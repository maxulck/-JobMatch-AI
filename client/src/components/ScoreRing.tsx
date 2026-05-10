type ScoreRingProps = {
  score: number;
};

function getScoreColor(score: number) {
  if (score < 40) {
    return '#ef4444';
  }

  if (score <= 70) {
    return '#f59e0b';
  }

  return '#22c55e';
}

export function ScoreRing({ score }: ScoreRingProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedScore / 100) * circumference;
  const color = getScoreColor(normalizedScore);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-56 w-56">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220" aria-hidden="true">
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="18"
          />
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="18"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tracking-normal text-white">{normalizedScore}%</span>
          <span className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
            Match
          </span>
        </div>
      </div>
    </div>
  );
}
