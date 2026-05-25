import './App.css';
import ImagenLogin from '../assets/imagenes/Login.png';
import { useState} from "react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

//FIREBASE
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const token =
                await userCredential.user.getIdToken();

            localStorage.setItem(
                "token",
                token
            );

            const response = await fetch(
                "http://localhost:8000/api/v1/auth/me",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            console.log(data);

            
            navigation('/Metricas')

        } catch (err) {

            setError("Credenciales incorrectas");

            console.error(err);

        }
        };

    const [botonIniciarSesion, setBotonIniciarSesion] = useState(false);
    const navigation = useNavigate();

    const handleClick = () => {
        navigation('/Registro');
    };

    return (
        <div>
            <img 
                    src={ImagenLogin} 
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
                style={{position: 'fixed', top: '55%', left: '25%', transform: 'translate(-50%, -50%)', textAlign: 'left'}}
                >
                <h1 style={{color: "white", margin:0,padding:0}}>Bienvenido</h1>
                <h2 style={{color: 'rgb(177, 173, 173)'}}>Inicia sesión para acceder a tu observatorio personal</h2>
                <form action="" >
                    <h2 style={{color: "white"}}>Correo electrónico</h2>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder='Ingresa tu correo electrónico' 
                        style={{color: "white", background: "rgb(56, 19, 136)", width: "570px", height: "40px", borderRadius: "30px", border: "none", padding: "10px"}}/>
                    <h2 style={{color: "white"}}>Contraseña</h2>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder='Ingresa tu contraseña' 
                        style={{color: "white", background: "rgb(56, 19, 136)", width: "570px", height: "40px", borderRadius: "30px", border: "none", padding: "10px"}}/>
                
                </form>
                
                <button 
                                onClick={() => handleClick()} 
                                style={{outline:"none",marginTop: "40px",fontSize: "23px", background: 'none', color: 'rgb(245, 240, 240)', width: "385px", height: "60px", marginLeft:"230px"}} >No tienes cuenta? Registrarse</button>
                <br />
                <button 
                                onClick={handleSubmit}
                                style={{outline:"none", marginTop: "20px",fontSize: "23px", background: 'rgb(62, 6, 245)', color: 'rgb(245, 240, 240)', borderRadius: "30px", width: "285px", height: "60px",marginLeft:"150px"}}>Iniciar sesión</button>
            </div>
        </div>
    )
}
export default Login;