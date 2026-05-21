import { useState } from 'react';
import {BrowserRouter,Routes, Route, Navigate} from "react-router-dom";
import './App.css';
import Inicio from './pages/Inicio.jsx';


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
