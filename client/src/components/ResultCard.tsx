import { useState } from 'react';
import type { AnalyzeResponse } from '../types';
import { ScoreRing } from './ScoreRing';

type ResultCardProps = {
  result: AnalyzeResponse;
};

function SkillBadge({ children, tone }: { children: string; tone: 'green' | 'red' }) {
  const className =
    tone === 'green'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
      : 'border-red-400/30 bg-red-400/10 text-red-200';

  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-medium ${className}`}>
      {children}
    </span>
  );
}

export function ResultCard({ result }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyCoverLetter() {
    await navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mt-10 space-y-6">
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-white/10 bg-panel/95 p-6 shadow-glow">
          <h2 className="mb-6 text-xl font-bold text-white">Compatibilidad</h2>
          <ScoreRing score={result.score} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-panel/95 p-6">
            <h2 className="text-xl font-bold text-white">Skills que tienes</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.matchingSkills.length > 0 ? (
                result.matchingSkills.map((skill) => (
                  <SkillBadge key={skill} tone="green">
                    {skill}
                  </SkillBadge>
                ))
              ) : (
                <p className="text-sm text-slate-400">No se detectaron coincidencias claras.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-panel/95 p-6">
            <h2 className="text-xl font-bold text-white">Skills que te faltan</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.missingSkills.length > 0 ? (
                result.missingSkills.map((skill) => (
                  <SkillBadge key={skill} tone="red">
                    {skill}
                  </SkillBadge>
                ))
              ) : (
                <p className="text-sm text-slate-400">No se detectaron brechas importantes.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-panel/95 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-white">Carta de presentacion</h2>
          <button
            type="button"
            onClick={copyCoverLetter}
            className="rounded-lg border border-white/10 bg-panelSoft px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/50 hover:text-emerald-200"
          >
            {copied ? 'Copiada' : 'Copiar'}
          </button>
        </div>
        <div className="mt-5 whitespace-pre-line rounded-lg border border-white/10 bg-black/20 p-5 leading-7 text-slate-200">
          {result.coverLetter}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-panel/95 p-6">
        <h2 className="text-xl font-bold text-white">Preguntas de entrevista</h2>
        <ol className="mt-5 space-y-4">
          {result.interviewQuestions.map((item, index) => (
            <li key={`${item.question}-${index}`} className="rounded-lg bg-panelSoft p-4">
              <p className="font-semibold text-slate-100">
                {index + 1}. {item.question}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.tip}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
