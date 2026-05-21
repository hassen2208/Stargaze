import React from "react";
import ImagenInicio from '../assets/imagenes/InicioPrincipal.png';
import './App.css';

function Inicio() {
  return (
      <div>
        <img 
        src={ImagenInicio} 
        alt="Fondo" 
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover', 
            zIndex: -1 
        }} 
        />
        <h2
            style={{
                position: 'fixed',
                top: '60%',
                left: '40%',
                color: 'rgb(255, 254, 254)',}}
            >Tu universo de productividad inteligente</h2>
        <button style={{position: 'fixed', top: '70%', left: '46%', padding: "20px", background: 'rgb(79, 37, 219)', color: 'rgb(245, 240, 240)', borderRadius: "40px", width: "200px"}}
                >COMENZAR</button>
    </div>
  );
}
export default Inicio;