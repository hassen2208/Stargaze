import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

const RAW_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";
const BASE = RAW_BASE.replace(/\/$/, "");

let _token = "";

export function setAuthToken(token) {
  _token = token;
}


function waitForFirebaseUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function getFreshToken() {
  const user = auth.currentUser || await waitForFirebaseUser();

  if (!user) {
    return localStorage.getItem("token") || "";
  }

  const token = await user.getIdToken();

  _token = token;
  localStorage.setItem("token", token);

  return token;
}

async function request(path, options = {}) {
  const token = await getFreshToken();

  const { headers: extraHeaders, ...restOptions } = options;

  const res = await fetch(`${BASE}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...extraHeaders,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API ${res.status}: ${errorText}`);
  }

  return res.json();
}

export const tasksApi = {
  list: () =>
    request("/api/v1/tasks/"),

  create: (data) =>
    request("/api/v1/tasks/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/api/v1/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id) =>
    request(`/api/v1/tasks/${id}`, {
      method: "DELETE",
    }),
};

export const voiceApi = {
  process: async (audioBlob) => {
    const token = await getFreshToken();

    const form = new FormData();

    form.append(
      "audio",
      audioBlob,
      "recording.webm"
    );

    const res = await fetch(`${BASE}/api/v1/voice/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Voice API ${res.status}: ${errorText}`);
    }

    const transcript = res.headers.get("X-Transcript") ?? "";
    const blob = await res.blob();

    return {
      transcript,
      audioBlob: blob,
    };
  },
};

export const metricsApi = {
  dashboard: () =>
    request("/api/v1/metrics/dashboard"),
};

export const authApi = {
  me: () =>
    request("/api/v1/auth/me"),
};