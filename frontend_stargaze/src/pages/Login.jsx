import './AppLR.css';

import ImagenLogin from '../assets/imagenes/Login.png';

import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigation = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const cleanEmail = email.trim();
            const cleanPassword = password.trim();

            console.log("Firebase project:", auth.app.options.projectId);
            console.log("Firebase apiKey:", auth.app.options.apiKey);
            console.log("Email:", cleanEmail);
            console.log("Password length:", cleanPassword.length);

            const userCredential = await signInWithEmailAndPassword(
                auth,
                cleanEmail,
                cleanPassword
            );

            const token = await userCredential.user.getIdToken();

            localStorage.setItem(
                "token",
                token
            );

            const response = await fetch(
                `${API_URL}/api/v1/auth/me`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const backendError = await response.text();

                console.error(
                    "Backend auth error:",
                    backendError
                );

                throw new Error(
                    "El backend no pudo validar el usuario."
                );
            }

            const data = await response.json();

            console.log("Usuario autenticado en backend:", data);

            navigation("/app/observatorio");

        } catch (err) {
            console.error("Login error:", err);

            if (err.code === "auth/invalid-credential") {
                setError(
                    "Correo o contraseña incorrectos."
                );
            } else {
                setError(
                    "No se pudo iniciar sesión. Revisa consola para más detalles."
                );
            }

        } finally {
            setLoading(false);
        }
    };

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
                    zIndex: 0,
                }}
            />

            <div
                style={{
                    position: 'fixed',
                    top: '55%',
                    left: '25%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'left'
                }}
            >
                <h1 style={{ color: "white", margin: 0, padding: 0 }}>
                    Bienvenido
                </h1>

                <h2 style={{ color: 'rgb(177, 173, 173)' }}>
                    Inicia sesión para acceder a tu observatorio personal
                </h2>

                <form onSubmit={handleSubmit}>
                    <h2 style={{ color: "white" }}>
                        Correo electrónico
                    </h2>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Ingresa tu correo electrónico"
                        style={{
                            color: "white",
                            background: "rgb(56, 19, 136)",
                            width: "570px",
                            height: "40px",
                            borderRadius: "30px",
                            border: "none",
                            padding: "10px"
                        }}
                    />

                    <h2 style={{ color: "white" }}>
                        Contraseña
                    </h2>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Ingresa tu contraseña"
                        style={{
                            color: "white",
                            background: "rgb(56, 19, 136)",
                            width: "570px",
                            height: "40px",
                            borderRadius: "30px",
                            border: "none",
                            padding: "10px"
                        }}
                    />

                    {error && (
                        <p style={{ color: "#ff9a9a", marginTop: "15px" }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleClick}
                        style={{
                            outline: "none",
                            marginTop: "40px",
                            fontSize: "23px",
                            background: 'none',
                            color: 'rgb(245, 240, 240)',
                            width: "385px",
                            height: "60px",
                            marginLeft: "230px"
                        }}
                    >
                        No tienes cuenta? Registrarse
                    </button>

                    <br />

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            outline: "none",
                            marginTop: "20px",
                            fontSize: "23px",
                            background: 'rgb(62, 6, 245)',
                            color: 'rgb(245, 240, 240)',
                            borderRadius: "30px",
                            width: "285px",
                            height: "60px",
                            marginLeft: "150px"
                        }}
                    >
                        {loading ? "Ingresando..." : "Iniciar sesión"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;