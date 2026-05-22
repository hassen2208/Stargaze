import { useState } from 'react';
import {BrowserRouter,Routes, Route, Navigate} from "react-router-dom";
import './App.css';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Registro" element={<Registro />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
