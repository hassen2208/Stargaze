import { useState, useEffect, useCallback, useRef } from "react";
import { metricsApi } from "../services/api";


function useRecibirDatos() {
    const [metricas, setMetricas] = useState({
        total_requests: 0,
        llm_requests: 0,
        total_tokens: 0,
        total_cost_usd: 0,
        conversation_errors: 0,
        recognition_accuracy: 0,
        voice_pipeline_seconds: 0,
        voice_transcription_seconds: 0,
        voice_tts_seconds: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadMetricas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await metricsApi.dashboard();

            console.log("Métricas:", data);

            setMetricas({
                total_requests: data?.total_requests ?? 0,
                llm_requests: data?.llm_requests ?? 0,
                total_tokens: data?.total_tokens ?? 0,
                total_cost_usd: data?.total_cost_usd ?? 0,
                conversation_errors: data?.conversation_errors ?? 0,
                recognition_accuracy: data?.recognition_accuracy ?? 0,
                voice_pipeline_seconds: data?.voice_pipeline_seconds ?? 0,
                voice_transcription_seconds: data?.voice_transcription_seconds ?? 0,
                voice_tts_seconds: data?.voice_tts_seconds ?? 0,
            });

        } catch (err) {
            console.error("Error cargando métricas:", err);
            setError(err);

        } finally {
            setLoading(false);
        }
    }, []);

    const hasLoaded = useRef(false);

    useEffect(() => {
    if (hasLoaded.current) {
        return;
    }

    hasLoaded.current = true;

    loadMetricas();
}, [loadMetricas]);

    return {
        metricas,
        loading,
        error,
        reloadMetricas: loadMetricas
    };
}

export default useRecibirDatos;