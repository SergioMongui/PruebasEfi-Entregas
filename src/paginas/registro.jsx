import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../estilos/registro.css";

function Registro() {
  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    telefono: "",
    contraseña: "",
    rol: ""
  });

  const navigate = useNavigate();

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const manejarEnvio = (e) => {
    e.preventDefault();

    fetch("http://localhost:8080/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulario)
    })
      .then((res) => {
        if (res.ok) {
          alert("Usuario registrado correctamente");
          navigate("/inicioSesion");
        } else {
          alert("Error al registrar el usuario");
        }
      })
      .catch((err) => {
        console.error("Error de red:", err);
      });
  };

  return (
    <div className="registro-contenedor">
      <div style={{ display: "flex", justifyContent: "left" }}>
        <button onClick={() => navigate("/inicioSesion")}>
          Volver
        </button>
      </div>
      <h2>Registro</h2>
      <form className="registro-formulario" onSubmit={manejarEnvio}>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          onChange={manejarCambio}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          onChange={manejarCambio}
          required
        />
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          onChange={manejarCambio}
          required
        />
        <input
          type="password"
          name="contraseña"
          placeholder="Contraseña"
          onChange={manejarCambio}
          required
        />
        <select name="rol" onChange={manejarCambio} id="tipoUsuario" required>
          <option value="" hidden>Tipo de usuario</option>
          <option value="supervisor">Supervisor</option>
          <option value="repartidor">Repartidor</option>
        </select>
        <button type="submit">Confirmar</button>
      </form>
    </div>
  );
}

export default Registro;
