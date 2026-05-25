import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";

function useRecibirDatos(){
     const [metricas, setMetricas] = useState({
        total_requests: 0,
        total_tokens: 0,
        total_cost_usd: 0,
        avg_tokens: 0,
        avg_cost: 0,
        avg_response_time: 0,
        error_rate: 0,
        hallucinations_detected: 0,
        monthly_cost_projection: []
  });

  const loadMetricas = async () => {
    const data = await apiFetch("/api/metricas",{
        headers: {
            Authorization: `Bearer ${"token"}`
        }
    });
    console.log("Datos métricas recibidos:", data);
    setMetricas({
        total_requests: data.total_requests,
        total_tokens: data.total_tokens,
        total_cost_usd: data.total_cost_usd,
        avg_tokens: data.avg_tokens,
        avg_cost: data.avg_cost,
        avg_response_time: data.avg_response_time,
        error_rate: data.error_rate,
        hallucinations_detected: data.hallucinations_detected,
        monthly_cost_projection: data.monthly_cost_projection
    }
        );
            };
    useEffect(() => {    
        loadMetricas();
        }, []);
    return {metricas, loadMetricas};
}

export default useRecibirDatos;