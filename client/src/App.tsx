import { useState } from 'react';
import { analyzeJobMatch } from './api';
import { JobForm } from './components/JobForm';
import { ResultCard } from './components/ResultCard';
import type { AnalyzeResponse } from './types';

export default function App() {
  const [jobOffer, setJobOffer] = useState('');
  const [cv, setCv] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleAnalyze() {
    setError('');

    if (!jobOffer.trim() || !cv.trim()) {
      setError('Pega la oferta de trabajo y tu CV antes de analizar.');
      return;
    }

    setIsLoading(true);

    try {
      const analysis = await analyzeJobMatch({
        jobOffer: jobOffer.trim(),
        cv: cv.trim(),
      });
      setResult(analysis);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Ocurrio un error inesperado. Intentalo nuevamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            JobMatch AI
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-normal text-white sm:text-5xl">
            Analiza tu compatibilidad con una oferta en segundos
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Pega la oferta y tu CV para obtener un score, brechas de skills, una carta lista para
            enviar y preguntas probables de entrevista.
          </p>
        </header>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-glow sm:p-6">
          <JobForm
            jobOffer={jobOffer}
            cv={cv}
            isLoading={isLoading}
            onJobOfferChange={setJobOffer}
            onCvChange={setCv}
            onSubmit={handleAnalyze}
          />
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-red-100">
            {error}
          </div>
        )}

        {result && <ResultCard result={result} />}
      </div>
    </main>
  );
}
