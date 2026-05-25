import {React, useState} from "react";
import ImagenInicio from '../assets/imagenes/InicioPrincipal.png';
import './App.css';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';



function Inicio() {
  const [open, setOpen] = useState(false);
  const navigation = useNavigate();
  const handleClick = () => {
    setOpen(true);
    setTimeout(()=>navigation('/Login'),300);
        
  }
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
            zIndex: 0 
        }} 
        />
        <h2
            style={{
                position: 'fixed',
                top: '60%',
                left: '40%',
                color: 'rgb(255, 254, 254)',}}
            >Tu universo de productividad inteligente</h2>

        <motion.button style={{outline:"none",position: 'fixed', top: '70%', left: '46%', padding: "20px", background: 'rgb(79, 37, 219)', color: 'rgb(245, 240, 240)', borderRadius: "40px", width: "200px"}}    
            onClick={handleClick}
            initial={{x:0,y:0,opacity:0}}
            animate={{rotate:360,opacity:1, scale: open? 50:1,}}
            transition={{duration:1, ease: "easeInOut"}}
            
                >COMENZAR</motion.button>
    </div>
  );
}
export default Inicio;