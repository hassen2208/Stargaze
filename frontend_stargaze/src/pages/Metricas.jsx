import "./AppMetricas.css";

import ImagenMetricas from "../assets/imagenes/fondoMetricas.png";

import useRecibirDatos from "../hooks/useRecibirDatos";

function Metricas() {
    const {
        metricas,
        loading,
        error
    } = useRecibirDatos();

    if (loading) {
        return <p>Cargando métricas...</p>;
    }

    if (error) {
        return <p>Error cargando métricas</p>;
    }

    return (
        <div>
            <img
                src={ImagenMetricas}
                alt="Fondo"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: -1,
                }}
            />

            <h3 className="metrics-title">
                Métricas
            </h3>

            <div className="stats">
                <div className="stat-card">
                    <p>Total Requests</p>
                    <h2>{metricas.total_requests}</h2>
                </div>

                <div className="stat-card">
                    <p>LLM Requests</p>
                    <h2>{metricas.llm_requests}</h2>
                </div>

                <div className="stat-card">
                    <p>Total Tokens</p>
                    <h2>{metricas.total_tokens}</h2>
                </div>

                <div className="stat-card">
                    <p>Total Cost USD</p>
                    <h2>
                        ${Number(metricas.total_cost_usd || 0).toFixed(4)}
                    </h2>
                </div>

                <div className="stat-card">
                    <p>Conversation Errors</p>
                    <h2>{metricas.conversation_errors}</h2>
                </div>

                <div className="stat-card">
                    <p>Voice Pipeline</p>
                    <h2>
                        {Number(metricas.voice_pipeline_seconds || 0).toFixed(2)}s
                    </h2>
                </div>

                <div className="stat-card">
                    <p>Transcription Time</p>
                    <h2>
                        {Number(metricas.voice_transcription_seconds || 0).toFixed(2)}s
                    </h2>
                </div>

                <div className="stat-card">
                    <p>TTS Time</p>
                    <h2>
                        {Number(metricas.voice_tts_seconds || 0).toFixed(2)}s
                    </h2>
                </div>
            </div>
        </div>
    );
}

export default Metricas;