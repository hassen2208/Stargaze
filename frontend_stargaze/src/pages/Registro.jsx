import  ImagenRegistro from '../assets/imagenes/Registro.png';  
import { useState} from "react";
import './App.css';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

//FIREBASE
import {
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase/config";

function Registro() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (password !== confirmPassword) {

            setError("Las contraseñas no coinciden");

            return;
        }

        setLoading(true);

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            await updateProfile(
                userCredential.user,
                {
                    displayName: name
                }
            );

            alert("Usuario registrado correctamente");

            navigation("/Login");

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }
    };

    
    const navigation = useNavigate();
    const handleClickLogin = () => {
        navigation('/Login');
    }
    
    return (
        <div>
                    <img 
                            src={ImagenRegistro} 
                            alt="Fondo" 
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover', 
                                zIndex: -1,
                            }} 
                            />
                    
                    <div 
                        style={{position: 'fixed', top: '50%', left: '25%', transform: 'translate(-50%, -50%)', textAlign: 'left'}}
                        >
                        <h2 style={{color: "white", margin:0,padding:0}}>Registro Stargaze</h2>
                        <h2 style={{color: 'rgb(177, 173, 173)'}}>Regístrate para ser parte de este mundo</h2>
                        <form action="" >
                            <h3 style={{color: "white"}}> Nombre</h3>
                            <input 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder='Ingresa tu nombre' style={{color: "white", background: "rgb(56, 19, 136)", width: "570px", height: "40px", borderRadius: "30px", border: "none", padding: "10px"}}/>
                            <h3 style={{color: "white"}}>Correo electrónico</h3>
                            <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder='Ingresa tu correo electrónico' style={{color: "white", background: "rgb(56, 19, 136)", width: "570px", height: "40px", borderRadius: "30px", border: "none", padding: "10px"}}/>
                            <h3 style={{color: "white"}}>Contraseña</h3>
                            <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder='Ingresa tu contraseña' style={{color: "white", background: "rgb(56, 19, 136)", width: "570px", height: "40px", borderRadius: "30px", border: "none", padding: "10px"}}/>
                            <h3 style={{color: "white"}}>Confirmar contraseña</h3>
                            <input 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder='Confirma tu contraseña' style={{color: "white", background: "rgb(56, 19, 136)", width: "570px", height: "40px", borderRadius: "30px", border: "none", padding: "10px"}}/>
                
                        </form>
                        
                        <button 
                                onClick={() => handleClickLogin()}
                                style={{outline:"none",marginTop: "5px",fontSize: "23px", background: 'none', color: 'rgb(245, 240, 240)', width: "385px", height: "60px", marginLeft:"230px"}}>Ya tienes cuenta? Iniciar sesión</button>
                        <br />
                        <button onClick={handleSubmit} 
                               
                                style={{outline:"none", marginTop: "5px",fontSize: "23px", background: 'rgb(62, 6, 245)', color: 'rgb(245, 240, 240)', borderRadius: "30px", width: "285px", height: "60px",marginLeft:"150px"}}>Registrarse</button>
                    </div>
                </div>
    )
}
export default Registro;