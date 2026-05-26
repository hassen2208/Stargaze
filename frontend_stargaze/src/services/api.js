const BASE = '';
let _token = '';

export function setAuthToken(token) {
  _token = token;
}

async function request(path, options = {}) {
  const token = _token || localStorage.getItem('token') || '';

  const { headers: extraHeaders, ...restOptions } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...extraHeaders,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const tasksApi = {
  list:   ()         => request('/api/v1/tasks/'),
  create: (data)     => request('/api/v1/tasks/',      { method: 'POST',   body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/v1/tasks/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  remove: (id)       => request(`/api/v1/tasks/${id}`, { method: 'DELETE' }),
};

export const voiceApi = {
  process: async (audioBlob) => {
    const token = _token || localStorage.getItem('token') || '';
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    const res = await fetch(`${BASE}/api/v1/voice/process`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Voice API ${res.status}`);
    const transcript = res.headers.get('X-Transcript') ?? '';
    const blob = await res.blob();
    return { transcript, audioBlob: blob };
  },
};
export const metricsApi = {
  dashboard: () =>
    request('/api/v1/metrics/dashboard'),
};