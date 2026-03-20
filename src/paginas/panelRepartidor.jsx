import React, { useState } from "react";
import "../estilos/panelSupervisor.css"; // Se vuelve a utilizar no cambia mucho
import logo_SF from "../assets/logo_SF.png";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

//Gran parte del codigo directamente de panel supervisor
function PanelRepartidor() {
  const navegar = useNavigate();

  const [seccionActiva, setSeccionActiva] = useState("perfil");
    
  //Salir
    const salir = () => {
    localStorage.removeItem("usuario");
    navegar("/inicioSesion");
  };
  
  //Datos del usuario
    const [datosPerfil, setDatosPerfil] = useState({
      idUsuario: "",
      nombre: "",
      email: "",
      telefono: "",
      rol: "",
    });
    
    //Activar-desactivar edicion
    const [modoEdicion, setModoEdicion] = useState(false);

    //Almacenamiento de la informacion de perfil
    useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
     if (usuarioGuardado) {
    setDatosPerfil(usuarioGuardado);
    }
    }, []);

    //ingreso de la informacion por inputs
    const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosPerfil({ ...datosPerfil, [name]: value });
    };
    //Guardar, cambiar y cancelar la edición de datos perfil
    const guardarCambios = async () => {
    const respuesta = await axios.put(
        `http://localhost:8080/usuarios/${datosPerfil.idUsuario}`,
        datosPerfil
    );
    setDatosPerfil(respuesta.data);
    localStorage.setItem("usuario", JSON.stringify(respuesta.data));
    setModoEdicion(false);
    };

    const cancelarEdicion = () => {
    const original = JSON.parse(localStorage.getItem("usuario"));
    setDatosPerfil(original);
    setModoEdicion(false);
    };

  //Contenido Base de Repartidor
  const renderContenido = () => {
    switch (seccionActiva) {
      case "perfil":
        return (
          <div className="contenido-panel">
            <h2 className="titulo-perfil">Mi Perfil</h2>
            <form className="form-perfil">
              <input
                type="text"
                name="nombre"
                value={datosPerfil.nombre}
                onChange={handleChange}
                disabled={!modoEdicion}
              />
              <input
                type="email"
                name="email"
                value={datosPerfil.email}
                onChange={handleChange}
                disabled={!modoEdicion}
              />
              <input
                type="text"
                name="telefono"
                value={datosPerfil.telefono}
                onChange={handleChange}
                disabled={!modoEdicion}
              />
              <select
                name="rol"
                value={datosPerfil.rol}
                onChange={handleChange}
                disabled={!modoEdicion || datosPerfil.rol === "repartidor"} //se bloquea que el repartidor pueda realizar cambios de su rol
              >
                <option value="supervisor">Supervisor</option>
                <option value="repartidor">Repartidor</option>
              </select>
              {!modoEdicion ? (
                <button type="button" onClick={() => setModoEdicion(true)}>
                  Editar
                </button>
              ) : (
                <div className="botones-edicion">
                  <button type="button" onClick={guardarCambios}>
                    Guardar
                  </button>
                  <button type="button" onClick={cancelarEdicion}>
                    Cancelar
                  </button>
                </div>
              )}
            </form>
          </div>
        );

      case "plan":  
        return (
          <div className="contenido-panel">
            <h2 className="titulo-perfil">Planes de Trabajo</h2>
          </div>
        );

      case "admin":
        return (
          <div className="contenido-panel">
            <h2 className="titulo-perfil">Repartidor</h2>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleArchivoExcel}
            />
            ///Esto se debe cambiar ya que hace parte del supervisor
            <div className="contenedor-tarjetas">
              {ordenesGuardadas
                // esta ayuda a ver las ordnes que no han sido asignadas = .filter((orden) => !orden.asignada)
                .map((orden) => (
                  <div key={orden.idOrden} className="tarjeta-orden">
                    <input
                      type="checkbox"
                      checked={seleccionadas.includes(orden.idOrden)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSeleccionadas([...seleccionadas, orden.idOrden]);
                        } else {
                          setSeleccionadas(
                            seleccionadas.filter((id) => id !== orden.idOrden)
                          );
                        }
                      }}
                    />
                    <p>
                      <strong>ID Orden:</strong> {orden.idOrden}
                    </p>
                    <p>
                      <strong>Cliente:</strong> {orden.nombreCliente}
                    </p>
                    <p>
                      <strong>Dirección:</strong> {orden.direccion}
                    </p>
                    <p>
                      <strong>Productos:</strong> {orden.listaProductos}
                    </p>
                    <p>
                      <strong>Valor:</strong> ${orden.valor}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

    //Estructura visual header
     return (
      <div className="panel-supervisor">
        <header className="encabezado">
          <div className="logo-titulo">
            <h1>Efi-Entregas</h1>
            <img src={logo_SF} alt="Logo SF" className="logoPanel" />
          </div>
          <button onClick={salir}>Salir</button>
        </header>
  
        <nav className="barra-navegacion">
          <button
            className={seccionActiva === "perfil" ? "activo" : ""}
            onClick={() => setSeccionActiva("perfil")}
          >
            Perfil
          </button>
          <button
            className={seccionActiva === "plan" ? "activo" : ""}
            onClick={() => setSeccionActiva("plan")}
          >
            Plan de Trabajo
          </button>
          <button
            className={seccionActiva === "admin" ? "activo" : ""}
            onClick={() => setSeccionActiva("admin")}
          >
            Repartidor
          </button>
        </nav>
        {renderContenido()}
      </div>  
    );
}
export default PanelRepartidor;