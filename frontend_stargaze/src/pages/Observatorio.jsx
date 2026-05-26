import { useState, useEffect, useRef } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { tasksApi, voiceApi, setAuthToken } from '../services/api';
import './Observatorio.css';

/* ── Priority config ────────────────────────────── */
const PRIORITY_COLOR = { high: '#ef4444', medium: '#a855f7', low: '#22d3ee' };
const PRIORITY_ICON  = { high: '🚀', medium: '🪐', low: '⭐' };

/* ── Orbit radii (px from center) ───────────────── */
const ORBITS = [145, 240, 340];

/* ── Decorative background stars ───────────────── */
const DECO_STARS = Array.from({ length: 160 }, (_, i) => ({
  id: i,
  x:    Math.random() * 100,
  y:    Math.random() * 100,
  size: Math.random() * 2 + 0.4,
  dur:  Math.random() * 6 + 2,
  del:  Math.random() * 8,
}));

/* ── Decorative small planets ───────────────────── */
const DECO_PLANETS = [
  { id: 0, x: 10, y: 16, size: 20, color: '#7c3aed' },
  { id: 1, x: 89, y: 10, size: 14, color: '#dc2626' },
  { id: 2, x: 5,  y: 74, size: 24, color: '#6d28d9' },
  { id: 3, x: 93, y: 80, size: 16, color: '#5b21b6' },
  { id: 4, x: 20, y: 90, size: 11, color: '#7c3aed' },
  { id: 5, x: 80, y: 88, size: 18, color: '#4c1d95' },
];

/* ── Orbit index from due date ──────────────────── */
function getOrbitIndex(task) {
  if (!task.due_date || task.due_date === 'None' || task.due_date === 'null') return 2;
  const d = new Date(task.due_date);
  if (isNaN(d)) return 2;
  const days = (d - Date.now()) / 86400000;
  if (days <= 1)  return 0;
  if (days <= 7)  return 1;
  return 2;
}

/* ── Human-readable date ────────────────────────── */
function formatTaskDate(raw) {
  if (!raw || raw === 'None' || raw === 'null') return null;
  try {
    const d = new Date(raw);
    if (isNaN(d)) return null;
    const now = new Date();
    const tom = new Date(now); tom.setDate(tom.getDate() + 1);
    const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return `hoy ${time}`;
    if (d.toDateString() === tom.toDateString()) return `mañana ${time}`;
    return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${time}`;
  } catch { return null; }
}

/* ── Waveform bars ──────────────────────────────── */
function Waveform({ active }) {
  return (
    <div className={`obs-waveform ${active ? 'obs-waveform--active' : ''}`}>
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className="obs-wave-bar" style={{ animationDelay: `${i * 0.09}s` }} />
      ))}
    </div>
  );
}

/* ── Floating task planet card (no popup — modal handles actions) ── */
function PlanetCard({ task, selected, onSelect }) {
  const color   = PRIORITY_COLOR[task.priority] ?? '#94a3b8';
  const icon    = PRIORITY_ICON[task.priority]  ?? '✦';
  const dateStr = formatTaskDate(task.due_date);
  const active  = selected === task.id;

  return (
    <div
      className={`obs-planet ${active ? 'obs-planet--active' : ''}`}
      style={{ '--pc': color }}
      onClick={e => { e.stopPropagation(); onSelect(active ? null : task.id); }}
    >
      <span className="obs-planet-icon">{icon}</span>
      <div className="obs-planet-body">
        <p className="obs-planet-title">{task.title}</p>
        {dateStr && <p className="obs-planet-date">{dateStr}</p>}
      </div>
    </div>
  );
}

/* ── Task detail modal (centered, easy to tap) ──── */
function TaskModal({ task, onClose, onToggle, onDelete }) {
  if (!task) return null;
  const color   = PRIORITY_COLOR[task.priority] ?? '#94a3b8';
  const icon    = PRIORITY_ICON[task.priority]  ?? '✦';
  const dateStr = formatTaskDate(task.due_date);

  return (
    <div className="obs-modal-overlay" onClick={onClose}>
      <div className="obs-modal" style={{ '--pc': color }} onClick={e => e.stopPropagation()}>
        <div className="obs-modal-header">
          <span className="obs-modal-icon">{icon}</span>
          <div className="obs-modal-info">
            <p className="obs-modal-title">{task.title}</p>
            {dateStr && <p className="obs-modal-date">{dateStr}</p>}
          </div>
          <button className="obs-modal-close" onClick={onClose}>✕</button>
        </div>
        {task.description && (
          <p className="obs-modal-desc">{task.description}</p>
        )}
        <div className="obs-modal-actions">
          <button
            className="obs-modal-btn obs-modal-btn--check"
            onClick={() => { onToggle(task); onClose(); }}
          >✓ Completar</button>
          <button
            className="obs-modal-btn obs-modal-btn--del"
            onClick={() => { onDelete(task.id); onClose(); }}
          >🗑 Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function Observatorio() {
  const [aiStatus,   setAiStatus]   = useState('idle');
  const [aiMessage,  setAiMessage]  = useState('Mantén presionado para hablar');
  const [transcript, setTranscript] = useState('');
  const [tasks,      setTasks]      = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [center,     setCenter]     = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const audioRef     = useRef(null);

  /* ── Load token + tasks ── */
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setAuthToken(stored);
    tasksApi.list()
      .then(data => setTasks(Array.isArray(data) ? data : data.tasks ?? []))
      .catch(() => {});
  }, []);

  /* ── Measure orbital container via ResizeObserver ── */
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setCenter({ x: width / 2, y: height / 2 });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const reloadTasks = () =>
    tasksApi.list()
      .then(data => setTasks(Array.isArray(data) ? data : data.tasks ?? []))
      .catch(() => {});

  /* ── Voice recorder ── */
  const { isRecording, start, stop } = useVoiceRecorder(async (blob) => {
    setAiStatus('processing');
    setAiMessage('Procesando...');
    try {
      const { transcript: t, audioBlob } = await voiceApi.process(blob);
      setTranscript(t);
      setAiStatus('speaking');
      setAiMessage('Respondiendo...');
      reloadTasks();
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      audioRef.current.onended = () => {
        setAiStatus('idle');
        setAiMessage('Mantén presionado para hablar');
        URL.revokeObjectURL(url);
      };
    } catch {
      setAiStatus('idle');
      setAiMessage('Error al procesar. Intenta de nuevo.');
    }
  });

  const handleMicDown = () => { setAiStatus('recording'); setAiMessage('Escuchando...'); start(); };
  const handleMicUp   = () => stop();

  /* ── Task actions ── */
  const toggleTask = async (task) => {
    const updated = { ...task, status: task.status === 'completed' ? 'pending' : 'completed' };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try { await tasksApi.update(task.id, { status: updated.status }); } catch {}
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await tasksApi.remove(id); } catch {}
  };

  /* ── Compute orbital positions ── */
  const pending = tasks.filter(t => t.status !== 'completed');
  const groups  = [[], [], []];
  pending.forEach(t => groups[getOrbitIndex(t)].push(t));

  const positioned = [];
  groups.forEach((group, oi) => {
    const radius = ORBITS[oi];
    group.forEach((task, i) => {
      const angle = (i / Math.max(group.length, 1)) * 2 * Math.PI - Math.PI / 2;
      positioned.push({
        task,
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    });
  });

  const mascotState = isRecording ? 'recording' : aiStatus;

  return (
    <div className="obs-root" onClick={() => setSelected(null)}>

      {/* ── Background stars + deco planets ── */}
      <div className="obs-starfield" aria-hidden="true">
        {DECO_STARS.map(s => (
          <div key={s.id} className="obs-deco-star" style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.del}s`,
          }} />
        ))}
        {DECO_PLANETS.map(p => (
          <div key={p.id} className="obs-deco-planet" style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.color,
          }} />
        ))}
      </div>

      {/* ── Top title ── */}
      <div className="obs-topbar">
        <h1 className="obs-topbar-title">¿Qué deseas organizar hoy?</h1>
      </div>

      {/* ── Orbital canvas ── */}
      <div className="obs-orbital" ref={containerRef}>

        {/* Orbit rings */}
        {ORBITS.map((r, i) => (
          <div key={i} className="obs-orbit-ring" style={{ width: r * 2, height: r * 2 }} />
        ))}

        {/* Central star mascot */}
        <div className={`obs-mascot obs-mascot--${mascotState}`}>
          <div className="obs-mascot-glow" />
          <div className="obs-mascot-star">★</div>
          <div className="obs-mascot-face">
            <span className="obs-mascot-eye" />
            <span className="obs-mascot-eye" />
          </div>
          <div className="obs-mascot-smile" />
          <div className="obs-mascot-pulse obs-mascot-pulse--1" />
          <div className="obs-mascot-pulse obs-mascot-pulse--2" />
        </div>

        {/* Status text + transcript */}
        <div className="obs-status-area">
          {transcript && aiStatus !== 'idle' && (
            <p className="obs-transcript-pill">"{transcript}"</p>
          )}
          <p className="obs-status-text">{aiMessage}</p>
          <Waveform active={isRecording} />
        </div>

        {/* Task planets */}
        {center.x > 0 && positioned.map(({ task, x, y }) => (
          <div key={task.id} className="obs-planet-wrap" style={{ left: x, top: y }}>
            <PlanetCard
              task={task}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        ))}

        {/* Empty state */}
        {pending.length === 0 && (
          <div className="obs-empty">
            <p>Usa el micrófono para agregar tu primera misión</p>
          </div>
        )}
      </div>

      {/* ── Mic button ── */}
      <div className="obs-mic-area">
        <button
          className={`obs-mic-btn ${isRecording ? 'obs-mic-btn--recording' : ''}`}
          onMouseDown={handleMicDown}
          onMouseUp={handleMicUp}
          onTouchStart={handleMicDown}
          onTouchEnd={handleMicUp}
        >
          <span className="obs-mic-icon">{isRecording ? '⏹' : '🎙'}</span>
        </button>
      </div>

      {/* ── Task detail modal ── */}
      <TaskModal
        task={tasks.find(t => t.id === selected) ?? null}
        onClose={() => setSelected(null)}
        onToggle={toggleTask}
        onDelete={deleteTask}
      />

      <audio ref={audioRef} hidden />
    </div>
  );
}