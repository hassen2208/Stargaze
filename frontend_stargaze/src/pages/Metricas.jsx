import "./App.css";
import React, { useEffect, useState } from "react";
import ImagenMetricas from '../assets/imagenes/fondoMetricas.png';
function metricas() {
    return (
        
        <div >
        <img  src={ImagenMetricas} 
                            alt="Fondo" 
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover', 
                                zIndex: -1,
                            }} ></img>
          <h3>Métricas </h3>
          <div className="stats">

          <div className="stat-card">
            <p>Total requests</p>
            {"cargando..." }
          </div>

          <div className="stat-card">
            <p>Total tokens</p>
            { "cargando..." }
          </div>

          <div className="stat-card">
            <p>Total cost</p>
            { "cargando..." }
          </div>

          <div className="stat-card">
            <p>Avg response time</p>
            { "cargando..." }
          </div>

        </div>
        <div>
          <h3>Proyección de costo del LLM</h3>

            <div className="chart-card">

        

            </div>
        </div>
        </div>
    )

}

export default metricas;