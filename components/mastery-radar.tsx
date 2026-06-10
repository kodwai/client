interface RadarCategory {
  key: string;
  rating: number;
}

function titleCaseKey(key: string): string {
  return key
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

const GRID = "#9a9388";
const RUST = "#c2410c";

export function MasteryRadar({
  categories,
  size = 260,
}: {
  categories: RadarCategory[];
  size?: number;
}) {
  const top = categories.slice(0, 6);

  // A radar needs at least 3 axes — otherwise fall back to a simple full-width list.
  if (top.length < 3) {
    return (
      <div className="w-full">
        {top.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-b-0"
          >
            <span className="font-mono text-sm">{titleCaseKey(c.key)}</span>
            <span className="font-display text-base">{c.rating}</span>
          </div>
        ))}
      </div>
    );
  }

  const n = top.length;
  const cx = size / 2;
  const cy = size / 2;
  // Leave room for labels around the chart.
  const R = size / 2 - 44;

  const angleFor = (i: number) => (-90 + (i * 360) / n) * (Math.PI / 180);

  const radiusFor = (rating: number) => {
    const clamped = Math.max(900, Math.min(1700, rating));
    const frac = (clamped - 900) / (1700 - 900);
    return R * Math.max(0.08, frac);
  };

  const pointAt = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const gridPolygon = (scale: number) =>
    top
      .map((_, i) => {
        const p = pointAt(angleFor(i), R * scale);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

  const dataPoints = top.map((c, i) => pointAt(angleFor(i), radiusFor(c.rating)));
  const dataPolygon = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // Horizontal breathing room so side labels (e.g. "Algorithms") aren't clipped.
  const padX = 56;

  return (
    <svg
      width={size + padX * 2}
      height={size}
      viewBox={`${-padX} 0 ${size + padX * 2} ${size}`}
      className="max-w-full"
    >
      {/* Concentric grid polygons */}
      {[0.5, 1].map((scale) => (
        <polygon
          key={scale}
          points={gridPolygon(scale)}
          fill="none"
          stroke={GRID}
          strokeOpacity={0.4}
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {top.map((_, i) => {
        const p = pointAt(angleFor(i), R);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={GRID}
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill={RUST}
        fillOpacity={0.15}
        stroke={RUST}
        strokeWidth={1.5}
      />

      {/* Vertex dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={RUST} />
      ))}

      {/* Labels */}
      {top.map((c, i) => {
        const angle = angleFor(i);
        const label = pointAt(angle, R + 16);
        const cos = Math.cos(angle);
        const anchor =
          Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <text
            key={c.key}
            x={label.x}
            y={label.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-muted font-mono"
            fontSize={9}
          >
            <tspan x={label.x} dy={0}>
              {titleCaseKey(c.key)}
            </tspan>
            <tspan x={label.x} dy={11} fill={RUST}>
              {c.rating}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
