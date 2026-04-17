import React, { useState, useEffect } from "react";
import axios from "axios";

function Registro({ onClose }) {
  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    telefono: "",
    contraseña: "",
    rol: ""
  });

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState(""); // "success" o "error"

  // Auto-ocultar mensaje después de 3 segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const manejarEnvio = (e) => {
    e.preventDefault();

    axios.post("http://localhost:8080/usuarios", formulario)
      .then((res) => {
        setMensaje("Usuario registrado correctamente");
        setTipoMensaje("success");
        
        // Opcional: limpiar formulario o cerrar modal después de un breve tiempo
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      })
      .catch((err) => {
        console.error("Error al registrar:", err);
        setMensaje("Error al registrar el usuario");
        setTipoMensaje("error");
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenido" style={{ maxWidth: "550px", position: "relative" }} onClick={(e) => e.stopPropagation()}>
        {/* Botón de cierre X */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            background: "transparent",
            border: "none",
            fontSize: "1.8rem",
            cursor: "pointer",
            color: "#666",
            lineHeight: "1"
          }}
        >
          &times;
        </button>

        <h2 className="mb-4" style={{ color: "#8a0d0d", fontWeight: "800" }}>Registrar Nuevo Usuario</h2>
        
        <form onSubmit={manejarEnvio} className="d-flex flex-column gap-3">
          <div className="form-group">
            <input
              type="text"
              name="nombre"
              className="form-control p-3"
              style={{ borderRadius: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}
              placeholder="Nombre completo"
              onChange={manejarCambio}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="email"
              name="email"
              className="form-control p-3"
              style={{ borderRadius: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}
              placeholder="Correo electrónico"
              onChange={manejarCambio}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="telefono"
              className="form-control p-3"
              style={{ borderRadius: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}
              placeholder="Teléfono"
              onChange={manejarCambio}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="contraseña"
              className="form-control p-3"
              style={{ borderRadius: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}
              placeholder="Contraseña"
              onChange={manejarCambio}
              required
            />
          </div>

          <div className="form-group">
            <select 
              name="rol" 
              className="form-select p-3"
              style={{ borderRadius: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}
              onChange={manejarCambio} 
              id="tipoUsuario" 
              required
            >
              <option value="" hidden>Tipo de usuario</option>
              <option value="supervisor">Supervisor</option>
              <option value="repartidor">Repartidor</option>
            </select>
          </div>

          {/* Mensaje de feedback visual */}
          {mensaje && (
            <div 
              style={{ 
                padding: "12px", 
                borderRadius: "10px", 
                fontSize: "0.9rem", 
                textAlign: "center",
                fontWeight: "500",
                backgroundColor: tipoMensaje === "success" ? "#e6f4ea" : "#fdecea",
                color: tipoMensaje === "success" ? "#2e7d32" : "#b71c1c",
                border: `1px solid ${tipoMensaje === "success" ? "#c3e6cb" : "#f5c6cb"}`
              }}
            >
              {mensaje}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-lg text-white w-100 py-3 mt-2"
            style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", fontWeight: "700" }}
          >
            Confirmar Registro
          </button>
        </form>
      </div>
    </div>
  );
}

export default Registro;
