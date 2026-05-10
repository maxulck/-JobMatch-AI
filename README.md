# JobMatch AI

JobMatch AI es una aplicacion web full stack para analizar la compatibilidad entre una oferta de trabajo y un CV.

El usuario pega ambos textos, presiona **Analizar compatibilidad** y la app devuelve:

- Porcentaje de compatibilidad con el cargo
- Habilidades que coinciden con la oferta
- Habilidades que faltan segun la oferta
- Carta de presentacion personalizada
- 5 preguntas probables de entrevista con consejos para responderlas

La app puede funcionar de dos formas:

- **Modo local sin API key:** usa una comparacion simple de habilidades en el backend.
- **Modo Claude API:** si configuras `ANTHROPIC_API_KEY`, el backend llama a Claude.

![Captura de pantalla](screenshot.png)

## Tecnologias

- Frontend: React 19, TypeScript, Tailwind CSS y Vite
- Backend: Go con `net/http`
- IA opcional: Claude API, modelo `claude-sonnet-4-20250514`
- Paquetes: pnpm workspaces para el frontend
- Backend: Go modules
- Deploy sugerido: Netlify para frontend y Render para backend

## Estructura

```text
jobmatch-ai/
  client/
    src/
      App.tsx
      api.ts
      types.ts
      components/
        JobForm.tsx
        ResultCard.tsx
        ScoreRing.tsx
    index.html
    vite.config.ts
    tailwind.config.js
  server/
    main.go
    handlers/
      analyze.go
    .env.example
  package.json
  pnpm-workspace.yaml
  README.md
```

## Instalacion

Instala las dependencias del frontend:

```bash
pnpm install
```

Crea el archivo de entorno del backend:

```bash
cp server/.env.example server/.env
```

En Windows PowerShell tambien puedes usar:

```powershell
Copy-Item server/.env.example server/.env
```

## Variables de entorno

Backend (`server/.env`):

```env
ANTHROPIC_API_KEY=
PORT=8080
CLIENT_URL=http://localhost:5173
```

`ANTHROPIC_API_KEY` puede quedar vacia. En ese caso la app funciona en modo local sin llamar a Claude.

Frontend opcional (`client/.env`):

```env
VITE_API_URL=http://localhost:8080
```

Si `VITE_API_URL` no existe, el frontend usa `http://localhost:8080`.

## Ejecutar en desarrollo

Backend:

```bash
cd server
go run main.go
```

Frontend, en otra terminal:

```bash
pnpm dev:client
```

La app queda disponible en:

```text
http://localhost:5173
```

Si Vite usa otro puerto, por ejemplo `5175`, tambien funcionara porque el backend permite origenes locales.

Tambien puedes correr ambos procesos con:

```bash
pnpm dev
```

## Scripts

```bash
pnpm dev
pnpm dev:client
pnpm dev:server
pnpm build
```

## Endpoints

### GET `/api/health`

Verifica que el servidor este funcionando.

Respuesta:

```json
{
  "status": "ok"
}
```

### POST `/api/analyze`

Analiza la oferta y el CV.

Request:

```json
{
  "jobOffer": "texto completo de la oferta de trabajo",
  "cv": "texto completo del CV del usuario"
}
```

Response:

```json
{
  "score": 78,
  "matchingSkills": ["React", "Node.js", "MongoDB"],
  "missingSkills": ["Docker", "GraphQL"],
  "coverLetter": "Estimado equipo...",
  "interviewQuestions": [
    {
      "question": "Como manejas el estado global en React?",
      "tip": "Menciona Context API, Redux o Zustand segun tu experiencia."
    }
  ]
}
```

## Deploy en Netlify

1. Crea un sitio en Netlify conectado al repositorio.
2. Configura el directorio base como `client`.
3. Usa `pnpm build` como comando de build.
4. Usa `client/dist` como directorio de publicacion.
5. Agrega esta variable de entorno:

```env
VITE_API_URL=https://tu-backend-en-render.onrender.com
```

## Deploy en Render

1. Crea un Web Service en Render conectado al repositorio.
2. Configura el root directory como `server`.
3. Usa este build command:

```bash
go build -o app .
```

4. Usa este start command:

```bash
./app
```

5. Agrega variables de entorno:

```env
ANTHROPIC_API_KEY=
CLIENT_URL=https://tu-frontend-en-netlify.netlify.app
```

Si quieres usar Claude en produccion, coloca tu API key real en `ANTHROPIC_API_KEY`.

## Notas

- No subas `server/.env` al repositorio.
- `server/.env.example` si se sube como referencia.
- El backend usa solo libreria estandar de Go.
- El modo local sirve para demo y pruebas; para analisis mas avanzado puedes configurar Claude API.
