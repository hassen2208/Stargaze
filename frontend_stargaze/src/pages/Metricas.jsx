import "./AppMetricas.css";
import useRecibirDatos from "../hooks/useRecibirDatos";

/* ── Gráfica de barras (SVG puro) ─────────────── */
function BarChart({ items }) {
  const W = 560, H = 160, PAD_L = 0, PAD_B = 36, BAR_GAP = 18;
  const maxVal = Math.max(...items.map((i) => i.value), 0.01);
  const barW = (W - PAD_L - BAR_GAP * (items.length - 1)) / items.length;

  const allZero = items.every((i) => i.value === 0);
  if (allZero) return <div className="chart-empty">Sin datos de latencia aún</div>;

  return (
    <div className="bar-chart-wrap">
      <svg
        className="bar-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {items.map((item) => (
            <linearGradient
              key={item.id}
              id={`bar-grad-${item.id}`}
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%" stopColor={item.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={item.color} stopOpacity="0.3" />
            </linearGradient>
          ))}
        </defs>

        {/* Líneas guía */}
        {[0.25, 0.5, 0.75, 1].map((f) => {
          const y = H - PAD_B - f * (H - PAD_B);
          return (
            <line
              key={f}
              x1={0} y1={y} x2={W} y2={y}
              stroke="rgba(139,92,246,0.12)" strokeWidth="1"
            />
          );
        })}

        {items.map((item, i) => {
          const x = PAD_L + i * (barW + BAR_GAP);
          const barH = ((item.value / maxVal) * (H - PAD_B - 10));
          const y = H - PAD_B - barH;
          return (
            <g key={item.id}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="5" ry="5"
                fill={`url(#bar-grad-${item.id})`}
              />
              {/* Valor encima */}
              <text
                x={x + barW / 2} y={y - 6}
                textAnchor="middle"
                fill={item.color}
                fontSize="11"
                fontWeight="700"
              >
                {item.value.toFixed(2)}s
              </text>
              {/* Label abajo */}
              <text
                x={x + barW / 2} y={H - 4}
                textAnchor="middle"
                fill="rgba(107,122,153,0.9)"
                fontSize="10"
                fontWeight="600"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Gráfica de dona (SVG puro) ───────────────── */
function DonutChart({ slices }) {
  const R = 60, CX = 80, CY = 80, STROKE = 22;
  const circumference = 2 * Math.PI * R;
  const total = slices.reduce((s, sl) => s + sl.value, 0);

  const allZero = total === 0;

  let offset = 0;
  const arcs = slices.map((sl) => {
    const pct = allZero ? 1 / slices.length : sl.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const arc = { ...sl, dash, gap, offset, pct };
    offset += dash;
    return arc;
  });

  return (
    <div className="donut-wrap">
      <svg className="donut-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="rgba(139,92,246,0.08)" strokeWidth={STROKE} />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={allZero ? "rgba(139,92,246,0.2)" : arc.color}
            strokeWidth={STROKE}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px` }}
          />
        ))}
        {/* Centro */}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="#f0f0ff"
          fontSize="18" fontWeight="800">
          {allZero ? "—" : total.toFixed(1)}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle"
          fill="rgba(107,122,153,0.85)" fontSize="9" fontWeight="600">
          {allZero ? "Sin datos" : "SEG TOTAL"}
        </text>
      </svg>

      <div className="donut-legend">
        {slices.map((sl) => {
          const pct = total > 0 ? ((sl.value / total) * 100).toFixed(0) : "—";
          return (
            <div key={sl.label} className="legend-item">
              <span className="legend-dot" style={{ background: sl.color }} />
              <span>{sl.label}</span>
              <span className="legend-pct">{total > 0 ? `${pct}%` : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Página principal ─────────────────────────── */
const KPI_CARDS = [
  { key: "total_requests",  label: "Solicitudes totales", icon: "📡", mod: "requests",  fmt: (v) => v },
  { key: "llm_requests",   label: "LLM Requests",         icon: "🤖", mod: "llm",       fmt: (v) => v },
  { key: "total_tokens",   label: "Total Tokens",          icon: "🔤", mod: "tokens",    fmt: (v) => v.toLocaleString() },
  { key: "total_cost_usd", label: "Costo USD",             icon: "💰", mod: "cost",      fmt: (v) => `$${v.toFixed(4)}` },
  { key: "conversation_errors", label: "Errores",          icon: "⚠️", mod: "errors",    fmt: (v) => v },
];

function Metricas() {
  const { metricas, loading, error } = useRecibirDatos();

  if (loading)
    return <div className="metricas-root"><p className="metricas-loading">Cargando métricas…</p></div>;
  if (error)
    return <div className="metricas-root"><p className="metricas-loading">Error cargando métricas</p></div>;

  const barItems = [
    { id: "pipeline",     label: "Voice Pipeline",  value: metricas.voice_pipeline_seconds,      color: "#fb923c" },
    { id: "transcripcion", label: "Transcripción",  value: metricas.voice_transcription_seconds, color: "#38bdf8" },
    { id: "tts",          label: "TTS",             value: metricas.voice_tts_seconds,           color: "#a3e635" },
  ];

  const donutSlices = [
    { label: "Pipeline",      value: metricas.voice_pipeline_seconds,      color: "#fb923c" },
    { label: "Transcripción", value: metricas.voice_transcription_seconds, color: "#38bdf8" },
    { label: "TTS",           value: metricas.voice_tts_seconds,           color: "#a3e635" },
  ];

  return (
    <div className="metricas-root">

      {/* Header */}
      <div className="metrics-header">
        <div className="metrics-header-left">
          <h2 className="metrics-title">Métricas del Sistema</h2>
          <p className="metrics-subtitle">Resumen de actividad en tiempo real</p>
        </div>
        <span className="metrics-badge">En vivo</span>
      </div>

      {/* KPI Cards */}
      <div className="stats">
        {KPI_CARDS.map(({ key, label, icon, mod, fmt }) => (
          <div key={key} className={`stat-card stat-card--${mod}`}>
            <div className="stat-card-header">
              <span className="stat-card-icon">{icon}</span>
              <span className="stat-card-label">{label}</span>
            </div>
            <p className="stat-card-value">{fmt(metricas[key] ?? 0)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-row">
        {/* Barras — latencias de voz */}
        <div className="chart-panel">
          <p className="chart-panel-title">Latencia de voz (segundos)</p>
          <BarChart items={barItems} />
        </div>

        {/* Dona — distribución */}
        <div className="chart-panel">
          <p className="chart-panel-title">Distribución de tiempo de voz</p>
          <DonutChart slices={donutSlices} />
        </div>
      </div>
    </div>
  );
}

export default Metricas;
