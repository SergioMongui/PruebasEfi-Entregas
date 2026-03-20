import React, { useState } from "react";
import "../estilos/inicioSesion.css";
import logo_SF from "../assets/logo_SF.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function InicioSesion() {
  const navegar = useNavigate();

  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");

  const irARegistro = () => {
    navegar("/registro");
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8080/usuarios/login", {
        email,
        contraseña
      });

      //PRUEBA
      const usuario = response.data;
      console.log("USUARIO LOGIN:", usuario);
      //

      if (response.data) {
        const usuario = response.data;
          localStorage.setItem("usuario", JSON.stringify(usuario));
          if (usuario.rol === "supervisor") {
              navegar("/panelSupervisor");
            } else if (usuario.rol === "repartidor") {
              navegar("/panelRepartidor");
}
      } else {
        setError("Correo o contraseña incorrectos");
      }
    } catch (error) {
      setError("Error");
      console.error(error);
    }

  };

  return (
    <div className="MarcaHeader">
      <img src={logo_SF} alt="Logo SF" className="logo" />
      <h1>Efi-Entregas</h1>

      <form className="formInicioSesion" onSubmit={manejarEnvio}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
        />

        <button type="submit">Iniciar sesión</button>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </form>

      <button type="button" onClick={irARegistro} className="boton-secundario">
        Registrarse
      </button>
    </div>
  );
}

export default InicioSesion;
