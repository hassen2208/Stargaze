import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { tasksApi, voiceApi, chatApi, ttsApi, setAuthToken } from '../services/api';
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

/* ── Detect task-list intent from user message ── */
function detectTaskListIntent(text) {
  const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Si el usuario está CREANDO una tarea/cita, no es una consulta de lista
  if (/(agendame|agenda(?:me)?|crea(?:me)?|a[nñ]ade|agrega(?:me)?|ponme|pon\s+una|registra|nueva?\s+(cita|tarea)|program)/.test(t)) {
    return { match: false, startDay: 0, daysAhead: 0, label: '' };
  }
  // Combinaciones de días (deben ir ANTES de los checks individuales)
  if (/hoy\s+(y\s+)?(de\s+)?manana|manana\s+(y\s+)?hoy/.test(t))
    return { match: true, startDay: 0, daysAhead: 1, label: 'hoy y mañana' };
  if (/\bhoy\b/.test(t))    return { match: true, startDay: 0, daysAhead: 0, label: 'hoy' };
  if (/\bmanana\b/.test(t)) return { match: true, startDay: 1, daysAhead: 1, label: 'mañana' };
  const m = t.match(/(?:proximos?|siguientes?)\s+(\d+)\s+dias?/);
  if (m) return { match: true, startDay: 0, daysAhead: parseInt(m[1]), label: `los próximos ${m[1]} días` };
  if (/esta\s+semana/.test(t)) return { match: true, startDay: 0, daysAhead: 7, label: 'esta semana' };
  if (
    /(lista|muestr|cu[aá]ntas?|cu[aá]les?|que\s+(citas?|tareas?)|tengo\s+(hoy|manana|esta))/.test(t) &&
    /(hoy|manana|semana|dias?|prox)/.test(t)
  ) return { match: true, startDay: 0, daysAhead: 3, label: 'los próximos días' };
  return { match: false, startDay: 0, daysAhead: 0, label: '' };
}

/* ── Filter tasks into a time window ────────────── */
function getTasksForDays(tasks, daysAhead, startDay = 0) {
  const now          = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const filterStart  = new Date(startOfToday);
  filterStart.setDate(filterStart.getDate() + startDay);
  const endDate      = new Date(startOfToday);
  endDate.setDate(endDate.getDate() + daysAhead + 1);

  return tasks
    .filter(t =>
      t.status !== 'completed' &&
      t.due_date && t.due_date !== 'None' && t.due_date !== 'null'
    )
    .map(t => ({ ...t, _date: new Date(t.due_date) }))
    .filter(t => !isNaN(t._date) && t._date >= filterStart && t._date < endDate)
    .sort((a, b) => a._date - b._date);
}

/* ── Group filtered tasks by human date label ──── */
function groupTasksByDate(filteredTasks) {
  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const groups = {};
  filteredTasks.forEach(t => {
    const dayStart = new Date(t._date.getFullYear(), t._date.getMonth(), t._date.getDate());
    let label;
    if (dayStart.getTime() === today.getTime())         label = 'Hoy';
    else if (dayStart.getTime() === tomorrow.getTime()) label = 'Mañana';
    else label = t._date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });
  return groups;
}

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
    const h    = d.getHours() % 12 || 12;
    const min  = d.getMinutes().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    const day  = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year  = d.getFullYear().toString().slice(-2);
    return `${h}:${min} ${ampm} · ${day}/${month}/${year}`;
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

/* ── Planet card ────────────────────────────────── */
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
        {task.description && <p className="obs-planet-desc">{task.description}</p>}
        {dateStr && <p className="obs-planet-date">{dateStr}</p>}
      </div>
    </div>
  );
}

/* ── Task modal ─────────────────────────────────── */
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
        {task.description && <p className="obs-modal-desc">{task.description}</p>}
        <div className="obs-modal-actions">
          <button className="obs-modal-btn obs-modal-btn--check" onClick={() => { onToggle(task); onClose(); }}>
            ✓ Completar
          </button>
          <button className="obs-modal-btn obs-modal-btn--del" onClick={() => { onDelete(task.id); onClose(); }}>
            🗑 Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Chat message bubble ────────────────────────── */
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (msg.taskGroups) {
    const entries = Object.entries(msg.taskGroups);
    return (
      <div className="chat-bubble chat-bubble--ai">
        <span className="chat-bubble-avatar">✦</span>
        <div className="chat-bubble-content chat-bubble-content--list">
          <p className="chat-tasklist-intro">
            {msg.totalCount === 1
              ? '1 tarea encontrada:'
              : `${msg.totalCount} tareas encontradas:`}
          </p>
          {entries.map(([dateLabel, tasks]) => (
            <div key={dateLabel} className="chat-tasklist-group">
              <p className="chat-tasklist-date">{dateLabel}</p>
              {tasks.map(t => (
                <div key={t.id} className="chat-tasklist-item">
                  <span className="chat-tasklist-time">
                    {t._date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span
                    className="chat-tasklist-dot"
                    style={{ background: PRIORITY_COLOR[t.priority] ?? '#94a3b8' }}
                  />
                  <span className="chat-tasklist-title">{t.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-bubble chat-bubble--${isUser ? 'user' : 'ai'}`}>
      {!isUser && <span className="chat-bubble-avatar">✦</span>}
      <div className="chat-bubble-content">
        {msg.isAudio && isUser && (
          <span className="chat-audio-pill">🎙 Audio</span>
        )}
        {msg.text && <p className="chat-bubble-text">{msg.text}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════ */
export default function Observatorio() {
  const [aiStatus,   setAiStatus]   = useState('idle');
  const [aiMessage,  setAiMessage]  = useState('Mantén presionado para hablar');
  const [transcript, setTranscript] = useState('');
  const [tasks,      setTasks]      = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [center,     setCenter]     = useState({ x: 0, y: 0 });

  const [messages,     setMessages]    = useState([
    { id: 0, role: 'ai', text: '¡Hola! Puedes escribirme o usar el micrófono. Te ayudo a organizar tus tareas 🚀', isAudio: false },
  ]);
  const [inputText,    setInputText]   = useState('');
  const [chatLoading,  setChatLoading] = useState(false);
  const [chatMicMode,  setChatMicMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const containerRef    = useRef(null);
  const audioRef        = useRef(null);
  const chatEndRef      = useRef(null);
  const inputRef        = useRef(null);
  const chatRecorderRef = useRef(null);
  const chatChunksRef   = useRef([]);

  const addMsg = useCallback((role, text, isAudio = false) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, text, isAudio }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setAuthToken(stored);
    tasksApi.list()
      .then(data => setTasks(Array.isArray(data) ? data : data.tasks ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setCenter({ x: width / 2, y: height / 2 });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const reloadTasks = () =>
    tasksApi.list()
      .then(data => setTasks(Array.isArray(data) ? data : data.tasks ?? []))
      .catch(() => {});

  const playAudio = (blob, onEnd) => {
    const url = URL.createObjectURL(blob);
    audioRef.current.src = url;
    audioRef.current.play();
    audioRef.current.onended = () => { onEnd?.(); URL.revokeObjectURL(url); };
  };

  const speakText = useCallback(async (text) => {
    if (!text) return;
    try {
      const audioBlob = await ttsApi.speak(text);
      playAudio(audioBlob, null);
    } catch {}
  }, []);

  /* ── Mic orbital ── */
  const { isRecording, start, stop } = useVoiceRecorder(async (blob) => {
    if (chatMicMode) return;
    setAiStatus('processing');
    setAiMessage('Procesando...');
    try {
      const { transcript: t, audioBlob } = await voiceApi.process(blob);
      setTranscript(t);
      setAiStatus('speaking');
      setAiMessage('Respondiendo...');
      reloadTasks();
      playAudio(audioBlob, () => {
        setAiStatus('idle');
        setAiMessage('Mantén presionado para hablar');
      });
    } catch {
      setAiStatus('idle');
      setAiMessage('Error al procesar. Intenta de nuevo.');
    }
  });

  /* ── Chat: enviar texto ── */
  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text || chatLoading) return;
    setInputText('');
    addMsg('user', text, false);
    setChatLoading(true);

    const intent = detectTaskListIntent(text);

    try {
      const { response } = await chatApi.send(text);

      if (intent.match) {
        const freshData = await tasksApi.list().catch(() => null);
        const freshTasks = freshData
          ? (Array.isArray(freshData) ? freshData : freshData.tasks ?? [])
          : tasks;
        setTasks(freshTasks);

        const filtered = getTasksForDays(freshTasks, intent.daysAhead, intent.startDay);

        if (filtered.length === 0) {
          const empty = `No encontré tareas pendientes para ${intent.label} 🎉`;
          addMsg('ai', empty, false);
          if (voiceEnabled) speakText(empty);
        } else {
          const grouped = groupTasksByDate(filtered);
          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            role: 'ai',
            taskGroups: grouped,
            totalCount: filtered.length,
            text: null,
          }]);
          if (voiceEnabled) {
            speakText(`Tienes ${filtered.length} ${filtered.length === 1 ? 'tarea' : 'tareas'} para ${intent.label}.`);
          }
        }
      } else {
        addMsg('ai', response, false);
        reloadTasks();
        if (voiceEnabled) speakText(response);
      }
    } catch {
      addMsg('ai', 'Ocurrió un error. Intenta de nuevo.', false);
    } finally {
      setChatLoading(false);
    }
  };

  const handleInputKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); }
  };

  /* ── Chat mic: click para iniciar, click para detener ── */
  const toggleChatMic = async () => {
    // Si ya está grabando → detener
    if (chatMicMode) {
      chatRecorderRef.current?.stop();
      chatRecorderRef.current = null;
      setChatMicMode(false);
      return;
    }

    // Iniciar grabación
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Cross-browser mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chatChunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chatChunksRef.current.push(e.data); };

      rec.onstop = async () => {
        stream.getTracks().forEach(tr => tr.stop());
        if (chatChunksRef.current.length === 0) return;

        const blob = new Blob(chatChunksRef.current, { type: mimeType || 'audio/webm' });

        // Burbuja del usuario
        const userMsgId = Date.now() + Math.random();
        setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: '', isAudio: true }]);
        setChatLoading(true);

        try {
          const { transcript: userText, audioBlob: aiAudio, responseText: aiText } = await voiceApi.process(blob);

          // Mostrar lo que dijo el usuario
          if (userText) {
            setMessages(prev =>
              prev.map(m => m.id === userMsgId ? { ...m, text: userText } : m)
            );
          }

          // Detectar si preguntó por tareas
          const intent = detectTaskListIntent(userText || '');

          if (intent.match) {
            // Fetch tareas frescas
            const freshData = await tasksApi.list().catch(() => null);
            const freshTasks = freshData
              ? (Array.isArray(freshData) ? freshData : freshData.tasks ?? [])
              : tasks;
            setTasks(freshTasks);

            const filtered = getTasksForDays(freshTasks, intent.daysAhead, intent.startDay);

            if (filtered.length === 0) {
              const emptyMsg = `No encontré tareas pendientes para ${intent.label} 🎉`;
              addMsg('ai', emptyMsg, false);
              speakText(emptyMsg);
            } else {
              // Mostrar lista escrita
              const grouped = groupTasksByDate(filtered);
              setMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                role: 'ai',
                taskGroups: grouped,
                totalCount: filtered.length,
                text: null,
              }]);
              // Hablar resumen con el conteo correcto (no el del backend)
              const summary = `Tienes ${filtered.length} ${filtered.length === 1 ? 'tarea' : 'tareas'} para ${intent.label}.`;
              speakText(summary);
            }

          } else {
            // Respuesta normal: mostrar el texto del AI y reproducir el audio
            addMsg('ai', aiText || '🔊 Respondió por voz', false);
            reloadTasks();
            if (aiAudio && aiAudio.size > 0) playAudio(aiAudio, null);
          }

        } catch {
          addMsg('ai', 'Error al procesar el audio.', false);
        } finally {
          setChatLoading(false);
        }
      };

      rec.start(100);
      chatRecorderRef.current = rec;
      setChatMicMode(true);
    } catch {
      addMsg('ai', 'No se pudo acceder al micrófono.', false);
    }
  };

  const handleMicDown = () => { setAiStatus('recording'); setAiMessage('Escuchando...'); start(); };
  const handleMicUp   = () => stop();

  const toggleTask = async (task) => {
    const updated = { ...task, status: task.status === 'completed' ? 'pending' : 'completed' };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try { await tasksApi.update(task.id, { status: updated.status }); } catch {}
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await tasksApi.remove(id); } catch {}
  };

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

      <div className="obs-left">
        <div className="obs-topbar">
          <h1 className="obs-topbar-title">¿Qué deseas organizar hoy?</h1>
        </div>

        <div className="obs-orbital" ref={containerRef}>
          {ORBITS.map((r, i) => (
            <div key={i} className="obs-orbit-ring" style={{ width: r * 2, height: r * 2 }} />
          ))}

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

          <div className="obs-status-area">
            {transcript && aiStatus !== 'idle' && (
              <p className="obs-transcript-pill">"{transcript}"</p>
            )}
            <p className="obs-status-text">{aiMessage}</p>
            <Waveform active={isRecording} />
          </div>

          {center.x > 0 && positioned.map(({ task, x, y }) => (
            <div key={task.id} className="obs-planet-wrap" style={{ left: x, top: y }}>
              <PlanetCard task={task} selected={selected} onSelect={setSelected} />
            </div>
          ))}

          {pending.length === 0 && (
            <div className="obs-empty">
              <p>Usa el micrófono o el chat para agregar tu primera misión</p>
            </div>
          )}
        </div>

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
      </div>

      <div className="obs-chat" onClick={e => e.stopPropagation()}>
        <div className="chat-header">
          <span className="chat-header-icon">✦</span>
          <div>
            <p className="chat-header-title">Conversación</p>
            <p className="chat-header-sub">Escribe o usa el micrófono</p>
          </div>
          {chatLoading && <span className="chat-typing-dot" />}
          <button
            className={`chat-voice-toggle ${voiceEnabled ? 'chat-voice-toggle--on' : ''}`}
            onClick={() => setVoiceEnabled(v => !v)}
            title={voiceEnabled ? 'Silenciar respuestas' : 'Activar voz'}
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
        </div>

        <div className="chat-messages">
          {messages.map(msg => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
          {chatLoading && (
            <div className="chat-bubble chat-bubble--ai">
              <span className="chat-bubble-avatar">✦</span>
              <div className="chat-bubble-content chat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Escribe un mensaje..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleInputKey}
            rows={1}
            disabled={chatLoading}
          />
          <div className="chat-input-btns">
            {/* Click para iniciar/detener — no push-to-hold */}
            <button
              className={`chat-mic-btn ${chatMicMode ? 'chat-mic-btn--active' : ''}`}
              onClick={toggleChatMic}
              title={chatMicMode ? 'Detener grabación' : 'Grabar mensaje de voz'}
              disabled={chatLoading}
            >
              {chatMicMode ? '⏹' : '🎙'}
            </button>
            <button
              className="chat-send-btn"
              onClick={handleSendText}
              disabled={!inputText.trim() || chatLoading}
              title="Enviar"
            >
              ➤
            </button>
          </div>
        </div>
      </div>

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
