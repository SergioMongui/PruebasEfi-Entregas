import React from "react";
import { useNavigate } from "react-router-dom";
import "../estilos/inicioSesion.css";

function RecuperarContrasena() {
  const navegar = useNavigate();

  return (
    <div className="MarcaHeader">
      <h1>Recuperar Contraseña</h1>
      <p>Esta página se encuentra en mantenimiento.</p>
      <button onClick={() => navegar("/inicioSesion")} className="boton-secundario">
        Volver
      </button>
    </div>
  );
}

export default RecuperarContrasena;
