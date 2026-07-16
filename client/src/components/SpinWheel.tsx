import { useState } from 'react';

interface SpinOutcome {
  prizeIndex: number;
  prizeLabel: string;
  alreadySpun: boolean;
}

interface SpinWheelProps {
  segments: string[];
  canSpin: boolean;
  onSpin: () => Promise<SpinOutcome>;
}

const WEDGE_COLORS = ['#00416a', '#b8923a', '#002147', '#8f6f28', '#1a5c89', '#d6b15c'];
const CX = 110;
const CY = 110;
const R = 104;

function point(angleDeg: number, radius: number) {
  const t = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.sin(t), y: CY - radius * Math.cos(t) };
}

export default function SpinWheel({ segments, canSpin, onSpin }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seg = segments.length ? 360 / segments.length : 360;

  const handleSpin = async () => {
    if (spinning || !canSpin) return;
    setError(null);
    setResult(null);
    setSpinning(true);
    try {
      const outcome = await onSpin();
      if (outcome.alreadySpun) {
        setSpinning(false);
        setResult(outcome);
        return;
      }
      // Land the chosen wedge under the top pointer, after several full turns.
      const target = 360 * 5 - (outcome.prizeIndex * seg + seg / 2);
      const base = Math.floor(rotation / 360) * 360;
      setRotation(base + target);
      window.setTimeout(() => {
        setSpinning(false);
        setResult(outcome);
      }, 4200);
    } catch (e) {
      setSpinning(false);
      setError(e instanceof Error ? e.message : 'Spin failed.');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <div className="h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-gold" />
        </div>

        <svg
          viewBox="0 0 220 220"
          className="h-64 w-64 sm:h-72 sm:w-72"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          <circle cx={CX} cy={CY} r={R + 4} fill="#1e1c1f" stroke="#3b3c36" strokeWidth="2" />
          {segments.map((label, i) => {
            const a0 = i * seg;
            const a1 = (i + 1) * seg;
            const p0 = point(a0, R);
            const p1 = point(a1, R);
            const mid = point(a0 + seg / 2, R * 0.62);
            return (
              <g key={i}>
                <path
                  d={`M ${CX} ${CY} L ${p0.x} ${p0.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`}
                  fill={WEDGE_COLORS[i % WEDGE_COLORS.length]}
                  stroke="#181618"
                  strokeWidth="1"
                />
                <text
                  x={mid.x}
                  y={mid.y}
                  fill="#f8f4ff"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${a0 + seg / 2}, ${mid.x}, ${mid.y})`}
                >
                  {label}
                </text>
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r="14" fill="#b8923a" stroke="#181618" strokeWidth="3" />
        </svg>
      </div>

      <button onClick={handleSpin} disabled={spinning || !canSpin} className="btn-primary mt-6">
        {spinning ? 'Spinning…' : canSpin ? 'Spin the wheel' : 'Come back tomorrow'}
      </button>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {result && !spinning && (
        <p className="mt-4 text-center font-serif text-xl text-bone">
          {result.alreadySpun ? (
            <span className="text-bone/70">You’ve already spun today — see you tomorrow!</span>
          ) : (
            <>
              🎉 You won <span className="text-gold">{result.prizeLabel}</span>!
            </>
          )}
        </p>
      )}
    </div>
  );
}
