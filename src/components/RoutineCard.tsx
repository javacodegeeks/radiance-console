import type { Routine } from '@/services/radianceClient';

interface Props {
  routine: Routine;
}

function RoutineSteps({ label, steps }: { label: string; steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-mono font-medium text-ink/40 uppercase tracking-widest mb-1">{label}</p>
      <ol className="space-y-1">
        {steps.map((step, i) => (
          <li key={step} className="text-sm text-ink/70 flex gap-2">
            <span className="text-botanical-400 shrink-0 font-mono">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RoutineCard({ routine }: Props) {
  const hasSteps = routine.am.length > 0 || routine.pm.length > 0;
  if (!hasSteps && routine.interactionWarnings.length === 0) return null;

  return (
    <div className="bg-white border border-line rounded-lg p-4 space-y-3">
      <p className="text-[11px] font-mono font-medium text-botanical-500 uppercase tracking-widest">Your routine</p>

      {hasSteps && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RoutineSteps label="AM" steps={routine.am} />
          <RoutineSteps label="PM" steps={routine.pm} />
        </div>
      )}

      {routine.interactionWarnings.length > 0 && (
        <div className="space-y-1 pt-1">
          {routine.interactionWarnings.map(warning => (
            <p key={warning} className="text-xs text-caution bg-caution-bg border-l-2 border-caution rounded-sm px-3 py-2">
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
