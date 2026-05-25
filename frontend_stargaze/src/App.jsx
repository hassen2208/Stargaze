import { useState } from 'react';
import {BrowserRouter,Routes, Route, Navigate} from "react-router-dom";
import './App.css';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Metricas from './pages/Metricas.jsx';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Registro" element={<Registro />} />
        <Route path="/Metricas" element={<Metricas />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
