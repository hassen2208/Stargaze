import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Observatorio from './pages/Observatorio.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Registro" element={<Registro />} />
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="observatorio" replace />} />
          <Route path="observatorio" element={<Observatorio />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;