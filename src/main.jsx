import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Registro from "./paginas/Registro";
import PanelSupervisor from "./paginas/panelSupervisor";
import App from './App.jsx';
import InicioSesion from './paginas/inicioSesion.jsx';
import PanelRepartidor from "./paginas/panelRepartidor.jsx";
import RecuperarContrasena from "./paginas/RecuperarContrasena.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/inicioSesion" element={<InicioSesion />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/panelSupervisor" element={<PanelSupervisor />} />
        <Route path="/panelRepartidor" element={<PanelRepartidor />} />
        <Route path="/recuperarContrasena" element={<RecuperarContrasena />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
