import type { FormEvent } from 'react';

type JobFormProps = {
  jobOffer: string;
  cv: string;
  isLoading: boolean;
  onJobOfferChange: (value: string) => void;
  onCvChange: (value: string) => void;
  onSubmit: () => void;
};

export function JobForm({
  jobOffer,
  cv,
  isLoading,
  onJobOfferChange,
  onCvChange,
  onSubmit,
}: JobFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="mb-3 block text-sm font-semibold text-slate-200">Oferta de trabajo</span>
          <textarea
            value={jobOffer}
            onChange={(event) => onJobOfferChange(event.target.value)}
            placeholder="Pega aqui el texto completo de la oferta..."
            className="min-h-80 w-full resize-y rounded-lg border border-white/10 bg-panel p-4 text-base leading-7 text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
          />
        </label>

        <label className="block">
          <span className="mb-3 block text-sm font-semibold text-slate-200">CV del candidato</span>
          <textarea
            value={cv}
            onChange={(event) => onCvChange(event.target.value)}
            placeholder="Pega aqui el contenido de tu CV..."
            className="min-h-80 w-full resize-y rounded-lg border border-white/10 bg-panel p-4 text-base leading-7 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-emerald-500 px-6 py-3 text-base font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200 sm:w-auto"
      >
        {isLoading && (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-950" />
        )}
        {isLoading ? 'Analizando...' : 'Analizar compatibilidad'}
      </button>
    </form>
  );
}
