import type { AnalyzeRequest, AnalyzeResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

type ApiErrorBody = {
  error?: string;
};

export async function analyzeJobMatch(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'No se pudo analizar la compatibilidad. Intentalo de nuevo.';

    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Keep the friendly default message when the server returns a non-JSON error.
    }

    throw new Error(message);
  }

  return response.json() as Promise<AnalyzeResponse>;
}
