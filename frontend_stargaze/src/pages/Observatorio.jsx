import { useState, useEffect, useRef } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { tasksApi, voiceApi, setAuthToken } from '../services/api';
import './Observatorio.css';

const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22d3ee' };
const PRIORITY_LABEL = { high: 'Alta', medium: 'Media', low: 'Baja' };

function Waveform({ active }) {
  return (
    <div className={`obs-waveform ${active ? 'obs-waveform--active' : ''}`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="obs-wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete }) {
  const done = task.status === 'completed';
  return (
    <div className={`obs-task-card card ${done ? 'obs-task-card--done' : ''}`}>
      <button className="obs-task-check" onClick={() => onToggle(task)}>
        {done ? '✓' : ''}
      </button>
      <div className="obs-task-body">
        <p className="obs-task-title">{task.title}</p>
        {task.description && <p className="obs-task-desc">{task.description}</p>}
      </div>
      <span
        className="obs-task-priority"
        style={{ color: PRIORITY_COLOR[task.priority] ?? '#94a3b8' }}
      >
        {PRIORITY_LABEL[task.priority] ?? task.priority}
      </span>
      <button className="obs-task-delete" onClick={() => onDelete(task.id)}>✕</button>
    </div>
  );
}

export default function Observatorio() {
  const [transcript, setTranscript] = useState('');
  const [aiStatus,   setAiStatus]   = useState('idle');
  const [aiMessage,  setAiMessage]  = useState('Mantén presionado el micrófono para hablar con tu asistente estelar');
  const audioRef = useRef(null);

  const [tasks,      setTasks]      = useState([]);
  const [tasksError, setTasksError] = useState(null);
  const [newTitle,   setNewTitle]   = useState('');
  const [adding,     setAdding]     = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setAuthToken(stored);
  }, []);

  useEffect(() => {
    tasksApi.list()
      .then(data => setTasks(Array.isArray(data) ? data : data.tasks ?? []))
      .catch(() => setTasksError('No se pudo conectar con el backend. Mostrando modo demo.'));
  }, []);

  const reloadTasks = () => {
    tasksApi.list()
      .then(data => setTasks(Array.isArray(data) ? data : data.tasks ?? []))
      .catch(() => {});
  };

  const { isRecording, start, stop } = useVoiceRecorder(async (blob) => {
    setAiStatus('processing');
    setAiMessage('Procesando tu mensaje...');
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
        setAiMessage('Mantén presionado el micrófono para hablar con tu asistente estelar');
        URL.revokeObjectURL(url);
      };
    } catch {
      setAiStatus('idle');
      setAiMessage('Error al procesar. Intenta de nuevo.');
    }
  });

  const handleMicDown = () => { setAiStatus('recording'); setAiMessage('Escuchando...'); start(); };
  const handleMicUp   = () => stop();

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const created = await tasksApi.create({ title: newTitle.trim(), priority: 'medium' });
      setTasks(prev => [created, ...prev]);
      setNewTitle('');
    } catch {
      setTasks(prev => [{
        id: Date.now(), title: newTitle.trim(),
        priority: 'medium', status: 'pending'
      }, ...prev]);
      setNewTitle('');
    }
    setAdding(false);
  };

  const toggleTask = async (task) => {
    const updated = { ...task, status: task.status === 'completed' ? 'pending' : 'completed' };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try { await tasksApi.update(task.id, { status: updated.status }); } catch { /* local only */ }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await tasksApi.remove(id); } catch { /* local only */ }
  };

  const pending   = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="obs-root">
      <section className="obs-voice card">
        <div className="obs-voice-header">
          <span className="badge">Asistente Estelar</span>
        </div>
        <div className="obs-mascot-wrap">
          <div className={`obs-mascot ${aiStatus === 'speaking' ? 'obs-mascot--speaking' : ''}`}>
            <div className="obs-mascot-core">✦</div>
            <div className="obs-mascot-ring obs-mascot-ring--1" />
            <div className="obs-mascot-ring obs-mascot-ring--2" />
          </div>
        </div>
        <p className="obs-ai-message">{aiMessage}</p>
        <Waveform active={isRecording} />
        {transcript && (
          <div className="obs-transcript">
            <span className="obs-transcript-label">Tú dijiste:</span>
            <p className="obs-transcript-text">"{transcript}"</p>
          </div>
        )}
        <button
          className={`obs-mic-btn ${isRecording ? 'obs-mic-btn--recording' : ''}`}
          onMouseDown={handleMicDown}
          onMouseUp={handleMicUp}
          onTouchStart={handleMicDown}
          onTouchEnd={handleMicUp}
        >
          <span className="obs-mic-icon">{isRecording ? '⏹' : '🎙'}</span>
          <span className="obs-mic-label">{isRecording ? 'Soltá para enviar' : 'Mantén presionado'}</span>
        </button>
        <audio ref={audioRef} hidden />
      </section>

      <section className="obs-tasks">
        <div className="obs-tasks-header">
          <div>
            <h1 className="obs-tasks-title text-gradient">Universo de Tareas</h1>
            <p className="obs-tasks-subtitle">
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''} · {completed.length} completada{completed.length !== 1 ? 's' : ''}
            </p>
          </div>
          <span className="badge">{tasks.length} total</span>
        </div>

        {tasksError && <div className="obs-error">{tasksError}</div>}

        <div className="obs-add-task">
          <input
            className="input-field"
            placeholder="Nueva tarea… presiona Enter o +"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button
            className="btn btn-primary obs-add-btn"
            onClick={addTask}
            disabled={adding || !newTitle.trim()}
          >+</button>
        </div>

        <div className="obs-task-list">
          {pending.length === 0 && !tasksError && (
            <div className="obs-empty">
              <span>🌌</span>
              <p>Tu universo está vacío. Agrega tu primera tarea.</p>
            </div>
          )}
          {pending.map(task => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
          ))}
        </div>

        {completed.length > 0 && (
          <details className="obs-completed-section">
            <summary className="obs-completed-summary">✓ Completadas ({completed.length})</summary>
            <div className="obs-task-list obs-task-list--completed">
              {completed.map(task => (
                <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </div>
          </details>
        )}
      </section>
    </div>
  );
}