import { useRef, useState } from 'react';

export function useVoiceRecorder(onBlob) {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  return { isRecording, start, stop };
}