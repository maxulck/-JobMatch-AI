package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const anthropicURL = "https://api.anthropic.com/v1/messages"
const claudeModel = "claude-sonnet-4-20250514"

type AnalyzeHandler struct {
	apiKey string
	client *http.Client
}

type AnalyzeRequest struct {
	JobOffer string `json:"jobOffer"`
	CV       string `json:"cv"`
}

type InterviewQuestion struct {
	Question string `json:"question"`
	Tip      string `json:"tip"`
}

type AnalyzeResponse struct {
	Score              int                 `json:"score"`
	MatchingSkills     []string            `json:"matchingSkills"`
	MissingSkills      []string            `json:"missingSkills"`
	CoverLetter        string              `json:"coverLetter"`
	InterviewQuestions []InterviewQuestion `json:"interviewQuestions"`
}

type anthropicRequest struct {
	Model     string             `json:"model"`
	MaxTokens int                `json:"max_tokens"`
	Messages  []anthropicMessage `json:"messages"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	Content []anthropicContent `json:"content"`
}

type anthropicContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

func NewAnalyzeHandler(apiKey string) *AnalyzeHandler {
	return &AnalyzeHandler{
		apiKey: apiKey,
		client: &http.Client{Timeout: 60 * time.Second},
	}
}

func (h *AnalyzeHandler) Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, http.StatusMethodNotAllowed, "Metodo no permitido")
		return
	}

	var payload AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSONError(w, http.StatusBadRequest, "El cuerpo de la solicitud no es JSON valido")
		return
	}

	payload.JobOffer = strings.TrimSpace(payload.JobOffer)
	payload.CV = strings.TrimSpace(payload.CV)

	if payload.JobOffer == "" || payload.CV == "" {
		writeJSONError(w, http.StatusBadRequest, "La oferta de trabajo y el CV son obligatorios")
		return
	}

	if strings.TrimSpace(h.apiKey) == "" || strings.TrimSpace(h.apiKey) == "tu_api_key_aqui" {
		writeJSON(w, http.StatusOK, analyzeLocally(payload))
		return
	}

	result, err := h.analyzeWithClaude(payload)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func (h *AnalyzeHandler) analyzeWithClaude(payload AnalyzeRequest) (*AnalyzeResponse, error) {
	if strings.TrimSpace(h.apiKey) == "" {
		return nil, errors.New("ANTHROPIC_API_KEY no esta configurada en el backend")
	}

	claudePayload := anthropicRequest{
		Model:     claudeModel,
		MaxTokens: 2500,
		Messages: []anthropicMessage{
			{
				Role:    "user",
				Content: buildPrompt(payload.JobOffer, payload.CV),
			},
		},
	}

	requestBody, err := json.Marshal(claudePayload)
	if err != nil {
		return nil, fmt.Errorf("no se pudo preparar la solicitud a Claude: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, anthropicURL, bytes.NewReader(requestBody))
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear la solicitud a Claude: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", h.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := h.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("no se pudo conectar con Claude: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("no se pudo leer la respuesta de Claude: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Claude devolvio un error (%d): %s", resp.StatusCode, string(body))
	}

	var claudeResponse anthropicResponse
	if err := json.Unmarshal(body, &claudeResponse); err != nil {
		return nil, fmt.Errorf("Claude devolvio una respuesta inesperada: %w", err)
	}

	text := firstTextContent(claudeResponse)
	if strings.TrimSpace(text) == "" {
		return nil, errors.New("Claude no devolvio contenido de texto para analizar")
	}

	var analysis AnalyzeResponse
	if err := json.Unmarshal([]byte(text), &analysis); err != nil {
		return nil, fmt.Errorf("Claude no devolvio JSON valido para el analisis: %w", err)
	}

	if err := validateAnalysis(analysis); err != nil {
		return nil, err
	}

	return &analysis, nil
}

func buildPrompt(jobOffer string, cv string) string {
	return fmt.Sprintf(`Eres un experto en recursos humanos y selección de personal. 
Analiza la compatibilidad entre esta oferta de trabajo y este CV.

OFERTA DE TRABAJO:
%s

CV DEL CANDIDATO:
%s

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta, sin texto adicional, sin bloques de código markdown:
{
  "score": número entre 0 y 100 que representa el porcentaje de compatibilidad,
  "matchingSkills": array de strings con habilidades del CV que coinciden con la oferta,
  "missingSkills": array de strings con habilidades requeridas en la oferta que no están en el CV,
  "coverLetter": string con una carta de presentación personalizada de 3 párrafos en español,
  "interviewQuestions": array de 5 objetos con "question" y "tip", preguntas probables para esta oferta con consejos para responderlas
}`, jobOffer, cv)
}

func firstTextContent(response anthropicResponse) string {
	for _, content := range response.Content {
		if content.Type == "text" && strings.TrimSpace(content.Text) != "" {
			return strings.TrimSpace(content.Text)
		}
	}

	return ""
}

func validateAnalysis(analysis AnalyzeResponse) error {
	if analysis.Score < 0 || analysis.Score > 100 {
		return errors.New("Claude devolvio un score fuera del rango 0-100")
	}

	if analysis.MatchingSkills == nil {
		return errors.New("Claude no devolvio matchingSkills")
	}

	if analysis.MissingSkills == nil {
		return errors.New("Claude no devolvio missingSkills")
	}

	if strings.TrimSpace(analysis.CoverLetter) == "" {
		return errors.New("Claude no devolvio coverLetter")
	}

	if len(analysis.InterviewQuestions) != 5 {
		return errors.New("Claude no devolvio exactamente 5 preguntas de entrevista")
	}

	for _, item := range analysis.InterviewQuestions {
		if strings.TrimSpace(item.Question) == "" || strings.TrimSpace(item.Tip) == "" {
			return errors.New("Claude devolvio preguntas de entrevista incompletas")
		}
	}

	return nil
}

func analyzeLocally(payload AnalyzeRequest) *AnalyzeResponse {
	skills := []string{
		"React",
		"TypeScript",
		"JavaScript",
		"Node.js",
		"Go",
		"Python",
		"Java",
		"SQL",
		"PostgreSQL",
		"MongoDB",
		"Docker",
		"Kubernetes",
		"AWS",
		"Azure",
		"GCP",
		"GraphQL",
		"REST",
		"Git",
		"CI/CD",
		"Tailwind",
		"HTML",
		"CSS",
		"Vite",
		"Next.js",
		"Testing",
		"Scrum",
		"Agile",
		"Microservices",
	}

	jobText := strings.ToLower(payload.JobOffer)
	cvText := strings.ToLower(payload.CV)
	matchingSkills := make([]string, 0)
	missingSkills := make([]string, 0)

	for _, skill := range skills {
		needle := strings.ToLower(skill)
		inJob := strings.Contains(jobText, needle)
		inCV := strings.Contains(cvText, needle)

		if inJob && inCV {
			matchingSkills = append(matchingSkills, skill)
		}

		if inJob && !inCV {
			missingSkills = append(missingSkills, skill)
		}
	}

	score := 35
	totalRequired := len(matchingSkills) + len(missingSkills)
	if totalRequired > 0 {
		score = 25 + (len(matchingSkills) * 70 / totalRequired)
	}

	if score > 100 {
		score = 100
	}

	return &AnalyzeResponse{
		Score:          score,
		MatchingSkills: matchingSkills,
		MissingSkills:  missingSkills,
		CoverLetter: `Estimado equipo de seleccion:

Me interesa postular a esta oportunidad porque veo una buena conexion entre los desafios del cargo y mi experiencia profesional. A partir de la oferta, considero que puedo aportar especialmente en las responsabilidades tecnicas y colaborativas mencionadas.

Mi CV refleja habilidades que se alinean con varios puntos del puesto, y tambien tengo disposicion para fortalecer rapidamente las areas que requieran mayor profundidad. Me motiva sumarme a un equipo donde pueda generar impacto, aprender del contexto del negocio y contribuir con soluciones claras y bien ejecutadas.

Quedo atento a la posibilidad de conversar y profundizar como mi perfil puede aportar valor al rol. Muchas gracias por considerar mi postulacion.`,
		InterviewQuestions: []InterviewQuestion{
			{
				Question: "¿Que experiencia tienes relacionada directamente con las responsabilidades principales del cargo?",
				Tip:      "Responde con un ejemplo concreto, explicando el problema, tu accion y el resultado.",
			},
			{
				Question: "¿Cuales de las tecnologias o habilidades de la oferta has usado en proyectos reales?",
				Tip:      "Menciona herramientas especificas y conecta cada una con un logro medible.",
			},
			{
				Question: "¿Como abordarias una habilidad requerida que aun no dominas completamente?",
				Tip:      "Muestra honestidad, un plan de aprendizaje y ejemplos de veces en que aprendiste rapido.",
			},
			{
				Question: "¿Como trabajas con equipos multidisciplinarios o bajo metodologias agiles?",
				Tip:      "Habla de comunicacion, prioridades, feedback y colaboracion con perfiles distintos.",
			},
			{
				Question: "¿Por que te interesa este cargo y no solo cualquier oportunidad similar?",
				Tip:      "Conecta tu motivacion con la empresa, el tipo de desafios y tu proyeccion profesional.",
			},
		},
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
