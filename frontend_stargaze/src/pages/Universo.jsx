import { useState, useEffect } from 'react';
import { tasksApi, setAuthToken } from '../services/api';
import './Universo.css';

/* ── Starfield ─────────────────────────────────── */
const STARS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  duration: Math.random() * 4 + 2,
  delay: Math.random() * 5,
}));

function StarField() {
  return (
    <div className="uni-starfield" aria-hidden="true">
      {STARS.map(s => (
        <div
          key={s.id}
          className="uni-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Constants ─────────────────────────────────── */
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const PRIORITY_COLOR   = { high: '#ef4444', medium: '#f59e0b', low: '#22d3ee' };
const PRIORITY_LABEL   = { high: 'Alta',    medium: 'Media',   low: 'Baja'    };
const FILTERS          = ['all', 'high', 'medium', 'low'];
const FILTER_LABEL     = { all: 'Todas', high: 'Alta', medium: 'Media', low: 'Baja' };

/* ── Task card ─────────────────────────────────── */
function parseDateValue(raw) {
  if (!raw || raw === 'None' || raw === 'null') return '';
  try {
    const d = new Date(raw);
    if (isNaN(d)) return '';
    return d.toISOString().slice(0, 10);
  } catch { return ''; }
}

function parseTimeValue(raw) {
  if (!raw || raw === 'None' || raw === 'null') return '';
  try {
    const d = new Date(raw);
    if (isNaN(d)) return '';
    return d.toTimeString().slice(0, 5);
  } catch { return ''; }
}

function TaskCard({ task, onToggle, onDelete, onUpdate }) {
  const [editing,     setEditing]     = useState(false);
  const [title,       setTitle]       = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority,    setPriority]    = useState(task.priority || 'medium');
  const [editDate,    setEditDate]    = useState(() => parseDateValue(task.due_date));
  const [editTime,    setEditTime]    = useState(() => parseTimeValue(task.due_date));

  const done = task.status === 'completed';

  const handleSave = async () => {
    let due_date = null;
    if (editDate) {
      due_date = editTime ? `${editDate}T${editTime}:00` : `${editDate}T00:00:00`;
    }
    await onUpdate(task.id, { title, description, priority, due_date });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'medium');
    setEditDate(parseDateValue(task.due_date));
    setEditTime(parseTimeValue(task.due_date));
    setEditing(false);
  };

  const formatDate = (raw) => {
    if (!raw || raw === 'None' || raw === 'null') return null;
    try {
      const d = new Date(raw);
      if (isNaN(d)) return null;
      return d.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return null; }
  };

  const dueDate = formatDate(task.due_date);
  const color   = PRIORITY_COLOR[editing ? priority : task.priority] ?? '#94a3b8';

  return (
    <div
      className={`uni-card card ${done ? 'uni-card--done' : ''}`}
      style={{ '--priority-color': color }}
    >
      <div className="uni-card-glow" />

      {editing ? (
        /* ── Edit mode ── */
        <div className="uni-card-edit">
          <input
            className="uni-edit-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            autoFocus
          />
          <textarea
            className="uni-edit-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
          />
          <div className="uni-edit-priority">
            {PRIORITY_OPTIONS.map(p => (
              <button
                key={p}
                className={`uni-priority-opt ${priority === p ? 'uni-priority-opt--active' : ''}`}
                style={{ '--p-color': PRIORITY_COLOR[p] }}
                onClick={() => setPriority(p)}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="uni-edit-datetime">
            <input
              type="date"
              className="uni-edit-input"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
            />
            <input
              type="time"
              className="uni-edit-input"
              value={editTime}
              onChange={e => setEditTime(e.target.value)}
            />
          </div>
          <div className="uni-edit-actions">
            <button className="btn btn-primary uni-save-btn" onClick={handleSave}>Guardar</button>
            <button className="btn uni-save-btn" onClick={handleCancel}>Cancelar</button>
          </div>
        </div>
      ) : (
        /* ── View mode ── */
        <div className="uni-card-top">
          <button className="uni-check" onClick={() => onToggle(task)}>
            {done ? '✓' : ''}
          </button>

          <div className="uni-card-content">
            <p className="uni-card-title">{task.title}</p>
            {task.description && <p className="uni-card-desc">{task.description}</p>}
            {dueDate && <p className="uni-card-date">📅 {dueDate}</p>}
          </div>

          <div className="uni-card-actions">
            <span className="uni-priority-badge" style={{ color }}>
              {PRIORITY_LABEL[task.priority] ?? task.priority}
            </span>
            <button className="uni-btn-icon" onClick={() => setEditing(true)} title="Editar">✏️</button>
            <button className="uni-btn-icon uni-btn-icon--delete" onClick={() => onDelete(task.id)} title="Eliminar">🗑</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────── */
export default function Universo() {
  const [tasks,   setTasks]   = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setAuthToken(stored);

    tasksApi.list()
      .then(data => { setTasks(Array.isArray(data) ? data : data.tasks ?? []); setLoading(false); })
      .catch(() => { setError('No se pudo cargar el universo.'); setLoading(false); });
  }, []);

  const updateTask = async (id, data) => {
    try {
      const updated = await tasksApi.update(id, data);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data, ...updated } : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    }
  };

  const toggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try { await tasksApi.update(task.id, { status: newStatus }); } catch { /* local */ }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await tasksApi.remove(id); } catch { /* local */ }
  };

  const filtered  = filter === 'all' ? tasks : tasks.filter(t => t.priority === filter);
  const pending   = filtered.filter(t => t.status !== 'completed');
  const completed = filtered.filter(t => t.status === 'completed');

  const totalPending   = tasks.filter(t => t.status !== 'completed').length;
  const totalCompleted = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="uni-root">
      <StarField />

      <div className="uni-content">
        {/* Header */}
        <header className="uni-header">
          <div>
            <h1 className="uni-title text-gradient">Universo</h1>
            <p className="uni-subtitle">
              {totalPending} misión{totalPending !== 1 ? 'es' : ''} activa{totalPending !== 1 ? 's' : ''} · {totalCompleted} completada{totalCompleted !== 1 ? 's' : ''}
            </p>
          </div>
          <span className="badge">{tasks.length} total</span>
        </header>

        {/* Filters */}
        <div className="uni-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`uni-filter-btn ${filter === f ? 'uni-filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f !== 'all' && <span style={{ color: PRIORITY_COLOR[f], marginRight: 5 }}>●</span>}
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>

        {error && <div className="obs-error">{error}</div>}

        {loading ? (
          <div className="uni-loading">
            <span className="uni-loading-icon">✦</span>
            Cargando universo…
          </div>
        ) : (
          <>
            <div className="uni-task-list">
              {pending.length === 0 && (
                <div className="obs-empty">
                  <span>🌌</span>
                  <p>
                    No hay misiones{filter !== 'all' ? ` de prioridad ${PRIORITY_LABEL[filter].toLowerCase()}` : ''} pendientes.
                  </p>
                </div>
              )}
              {pending.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                />
              ))}
            </div>

            {completed.length > 0 && (
              <details className="obs-completed-section">
                <summary className="obs-completed-summary">✓ Completadas ({completed.length})</summary>
                <div className="uni-task-list uni-task-list--completed">
                  {completed.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onUpdate={updateTask}
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}