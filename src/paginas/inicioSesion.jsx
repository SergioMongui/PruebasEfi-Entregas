import React, { useState } from "react";
import "../estilos/inicioSesion.css";
import logo_SF from "../assets/logo_SF.png";
import loginBg from "../assets/login-bg.png";
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

      const usuario = response.data;
      console.log("USUARIO LOGIN:", usuario);

      if (response.data) {
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
      setError("Error al iniciar sesión. Inténtelo de nuevo.");
      console.error(error);
    }
  };

  return (
    <div className="container-fluid vh-100 p-0 overflow-hidden">
      <div className="row g-0 h-100">
        {/* Lado izquierdo: Imagen (oculto en pantallas pequeñas) */}
        <div
          className="col-md-6 d-none d-md-block login-image-side"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          <div className="image-overlay d-flex align-items-end p-5">
            <div className="text-white">
              <h1 className="display-4 fw-bold">Efi-Entregas</h1>
              <p className="lead">La solucion para su empresa</p>
            </div>
          </div>
        </div>

        {/* Lado derecho: Formulario */}
        <div className="col-md-6 col-12 d-flex align-items-center justify-content-center login-form-side p-4 p-md-5">
          <div className="card shadow border-0 rounded-4 w-100" style={{ maxWidth: "520px" }}>
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <img src={logo_SF} alt="Logo Efi-Entregas" className="mb-0" style={{ height: "180px", width: "auto", objectFit: "contain" }} />
                <h2 className="fw-bold text-dark mb-1">Bienvenido</h2>
                <p className="text-muted">Por favor, ingresa tus credenciales</p>
              </div>

              <form onSubmit={manejarEnvio}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-secondary">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control form-control-lg shadow-sm border-light-subtle"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary">Contraseña</label>
                  <input
                    type="password"
                    className="form-control form-control-lg shadow-sm border-light-subtle"
                    placeholder=""
                    value={contraseña}
                    onChange={(e) => setContraseña(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="alert alert-danger py-2 px-3 mb-3 border-0 small" role="alert">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold py-3 shadow-sm login-btn border-0 mb-4" >
                  Iniciar sesión
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navegar("/recuperarContrasena")}
                    className="btn btn-link text-decoration-none text-muted small fw-medium w-100"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InicioSesion;
