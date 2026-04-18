import React, { useState, useEffect } from "react";
import "../estilos/panelSupervisor.css";
import logo_SF from "../assets/logo_SF.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import Registro from "./Registro";

function PanelSupervisor() {
  const navegar = useNavigate();

  const [datosExcel, setDatosExcel] = useState([]);

  const [seccionActiva, setSeccionActiva] = useState("perfil");
  const [modoEdicion, setModoEdicion] = useState(false); //Edicion perfil
  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false); //Editar otros usuarios
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false); // Registro de nuevos usuarios
  const [ordenesGuardadas, setOrdenesGuardadas] = useState([]);
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [planes, setPlanes] = useState([]);

  //Filtros en Historico Planes de trabajo 
  const [filtroIdPlanHist, setFiltroIdPlanHist] = useState("");
  const [filtroRepartidorHist, setFiltroRepartidorHist] = useState("");
  const [filtroFechaHist, setFiltroFechaHist] = useState("");

  const [resultadoCarga, setResultadoCarga] = useState(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  //Para la eliminacion de tarjetas de ordenes en administrador
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState("");

  //Filtros en historico ordenes 
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroId, setFiltroId] = useState("");
  const [filtroPlan, setFiltroPlan] = useState("");

  //Asignación
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState([]);
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);

  // Estados de perfil
  const [datosPerfil, setDatosPerfil] = useState({
    idUsuario: "",
    nombre: "",
    email: "",
    telefono: "",
    rol: "",
  });
  const [imagenPerfil, setImagenPerfil] = useState(null); // Estado para la previsualización de la foto de perfil

  //"Ver detalles" del plan de trabajo muestra las ordenes relacionadas al plan
  const [mostrarModalPlan, setMostrarModalPlan] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const ordenesDelPlan = ordenesGuardadas.filter(
    (orden) =>
      String(orden.planTrabajo?.idPlanTrabajo) ===
      String(planSeleccionado?.idPlanTrabajo)
  );

  //Almacenamiento de la informacion de perfil
  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioGuardado) {
      setDatosPerfil(usuarioGuardado);
      // Cargar imagen de perfil desde el objeto usuario
      if (usuarioGuardado.imagenPerfil) {
        setImagenPerfil(usuarioGuardado.imagenPerfil);
      }
    }
    //traer las ordenes
    axios
      .get("http://localhost:8080/ordenes")
      .then((res) => setOrdenesGuardadas(res.data))
      .catch((err) => console.error("Error al traer ordenes:", err));

    //llamar planes 
    axios
      .get("http://localhost:8080/planes")
      .then((res) => setPlanes(res.data))
      .catch((err) => console.error("Error al traer planes:", err));
  }, []);
  //Salir
  const salir = () => {
    localStorage.removeItem("usuario");
    navegar("/inicioSesion");
  };
  //Actualicacion de la informacion del formulario perfil
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosPerfil({ ...datosPerfil, [name]: value });
  };
  //Guardar cambios de edición perfil
  const guardarCambios = async () => {
    const respuesta = await axios.put(
      `http://localhost:8080/usuarios/${datosPerfil.idUsuario}`,
      datosPerfil
    );
    setDatosPerfil(respuesta.data);
    localStorage.setItem("usuario", JSON.stringify(respuesta.data));
    setModoEdicion(false);
  };

  //Eliminar usuario
  const eliminarUsuario = async (id) => {
    try {
      //evitar que se elimine el supervisor
      if (id === datosPerfil.idUsuario) {
        alert("No puedes eliminarte a ti mismo");
        return;
      }
      const confirmacion = window.confirm(
        "¿Estás seguro que deseas eliminar a este usuario de forma permanente?"
      );

      if (!confirmacion) {
        return;
      }
      await axios.delete(`http://localhost:8080/usuarios/${id}`);

      // Actualiza la lista en pantalla sin recargar
      setListaUsuarios(listaUsuarios.filter(u => u.idUsuario !== id));

    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };

  //Listado y cambiar rol de otros usuarios
  const cambiarRolLocal = (id, nuevoRol) => {
    setListaUsuarios(prev =>
      prev.map(usuario =>
        usuario.idUsuario === id
          ? { ...usuario, rol: nuevoRol }
          : usuario
      )
    );
  };

  const guardarRol = async (usuario) => {
    try {
      if (usuario.idUsuario === datosPerfil.idUsuario) {
        alert("No puedes cambiar tu propio rol");
        return;
      }
      const confirmacion = window.confirm(
        "¿Estás seguro de cambiar el rol de este usuario?"
      );

      if (!confirmacion) {
        return;
      }
      const res = await axios.put(
        `http://localhost:8080/usuarios/${usuario.idUsuario}`,
        usuario
      );

      // Actualiza la lista con los cambios al backend
      setListaUsuarios(prev =>
        prev.map(u =>
          u.idUsuario === usuario.idUsuario ? res.data : u
        )
      );

    } catch (error) {
      console.error("Error al actualizar rol:", error);
    }
  };

  //Cancelar edicion datos perfil
  const cancelarEdicion = () => {
    const original = JSON.parse(localStorage.getItem("usuario"));
    setDatosPerfil(original);
    setModoEdicion(false);
  };

  //Leer archivo Excel y enviarlo al backend para procesamiento masivo
  const handleArchivoExcel = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      const resp = await axios.post("http://localhost:8080/ordenes/cargar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResultadoCarga(resp.data);
      setMostrarResultado(true);

      // Recargar las ordenes para reflejar las nuevas
      const res = await axios.get("http://localhost:8080/ordenes");
      setOrdenesGuardadas(res.data);
    } catch (error) {
      console.error("Error al cargar archivo:", error);
      alert("Error al procesar el archivo Excel. Verifique el formato.");
    }
  };

  //Contenido Base de Supervisor
  const renderContenido = () => {

    switch (seccionActiva) {
      case "perfil":
        return (
          <div className="contenido-panel">
            <h2 className="titulo-perfil">Mi Perfil</h2>

            <div className="d-flex justify-content-center mt-4">
              <div className="row g-0 w-100 shadow-sm rounded-4 border overflow-hidden" style={{ maxWidth: "1000px" }}>
                {/* Columna Izquierda: Imagen (Fondo sutil) */}
                <div className="col-md-4 d-flex flex-column align-items-center justify-content-center p-5 border-end" style={{ backgroundColor: "#fdfdfd" }}>
                  <div
                    className="rounded-circle bg-white d-flex align-items-center justify-content-center mb-4 shadow-sm border"
                    style={{ width: "160px", height: "160px", overflow: "hidden" }}
                  >
                    {imagenPerfil ? (
                      <img src={`http://localhost:8080${imagenPerfil}`} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "5rem" }}>👤</span>
                    )}
                  </div>
                  <label
                    className="btn text-white px-4 py-2 fw-medium shadow-sm transition-all"
                    style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none", cursor: "pointer" }}
                  >
                    Cambiar imagen
                    <input
                      type="file"
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (!file.type.startsWith("image/")) {
                            alert("Por favor seleccione un archivo de imagen válido.");
                            return;
                          }
                          const formData = new FormData();
                          formData.append("archivo", file);
                          try {
                            const res = await axios.put(
                              `http://localhost:8080/usuarios/${datosPerfil.idUsuario}/imagen`,
                              formData,
                              { headers: { "Content-Type": "multipart/form-data" } }
                            );
                            const nuevaRuta = res.data.ruta;
                            setImagenPerfil(nuevaRuta);

                            // Actualizar localStorage para persistencia
                            const usuarioActualizado = { ...datosPerfil, imagenPerfil: nuevaRuta };
                            localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
                            setDatosPerfil(usuarioActualizado);
                          } catch (error) {
                            console.error("Error al subir imagen:", error);
                            alert("Hubo un error al subir la imagen");
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Columna Derecha: Información (Limpia y centrada) */}
                <div className="col-md-8 bg-white p-4 p-md-5 d-flex flex-column justify-content-center">
                  <form className="w-100">
                    <div className="mb-4">
                      <div className="d-flex flex-column flex-md-row align-items-md-center py-3 border-bottom">
                        <span className="text-muted text-uppercase small fw-bold mb-1 mb-md-0" style={{ width: "120px", fontSize: "0.7rem", letterSpacing: "0.5px" }}>Nombre:</span>
                        <div className="flex-grow-1">
                          {modoEdicion ? (
                            <input type="text" name="nombre" className="form-control form-control-sm" value={datosPerfil.nombre} onChange={handleChange} />
                          ) : (
                            <span className="text-dark" style={{ fontSize: "1rem", fontWeight: "500" }}>{datosPerfil.nombre}</span>
                          )}
                        </div>
                      </div>

                      <div className="d-flex flex-column flex-md-row align-items-md-center py-3 border-bottom">
                        <span className="text-muted text-uppercase small fw-bold mb-1 mb-md-0" style={{ width: "120px", fontSize: "0.7rem", letterSpacing: "0.5px" }}>Email:</span>
                        <div className="flex-grow-1 text-break">
                          {modoEdicion ? (
                            <input type="email" name="email" className="form-control form-control-sm" value={datosPerfil.email} onChange={handleChange} />
                          ) : (
                            <span className="text-dark" style={{ fontSize: "1rem", fontWeight: "500" }}>{datosPerfil.email}</span>
                          )}
                        </div>
                      </div>

                      <div className="d-flex flex-column flex-md-row align-items-md-center py-3 border-bottom">
                        <span className="text-muted text-uppercase small fw-bold mb-1 mb-md-0" style={{ width: "120px", fontSize: "0.7rem", letterSpacing: "0.5px" }}>Teléfono:</span>
                        <div className="flex-grow-1">
                          {modoEdicion ? (
                            <input type="text" name="telefono" className="form-control form-control-sm" value={datosPerfil.telefono} onChange={handleChange} />
                          ) : (
                            <span className="text-dark" style={{ fontSize: "1rem", fontWeight: "500" }}>{datosPerfil.telefono}</span>
                          )}
                        </div>
                      </div>

                      <div className="d-flex flex-column flex-md-row align-items-md-center py-3 border-bottom">
                        <span className="text-muted text-uppercase small fw-bold mb-1 mb-md-0" style={{ width: "120px", fontSize: "0.7rem", letterSpacing: "0.5px" }}>Rol:</span>
                        <div className="flex-grow-1">
                          {modoEdicion ? (
                            <select name="rol" className="form-select form-select-sm" value={datosPerfil.rol} onChange={handleChange}>
                              <option value="supervisor">Supervisor</option>
                              <option value="repartidor">Repartidor</option>
                            </select>
                          ) : (
                            <span className="text-dark text-capitalize" style={{ fontSize: "1rem", fontWeight: "500" }}>{datosPerfil.rol}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-2">
                      {!modoEdicion ? (
                        <>
                          <button className="btn btn-lg text-white shadow-sm flex-grow-1 py-2" style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none" }} type="button" onClick={() => setModoEdicion(true)}>
                            Editar
                          </button>
                          {datosPerfil.rol === "supervisor" && (
                            <>
                              <button className="btn btn-lg text-white shadow-sm flex-grow-1 py-2" style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none" }} type="button" onClick={async () => {
                                try {
                                  const res = await axios.get("http://localhost:8080/usuarios");
                                  setListaUsuarios(res.data);
                                  setMostrarModalUsuarios(true);
                                } catch (error) { console.error(error); }
                              }}>
                                Editar otro usuario
                              </button>
                              <button
                                className="btn btn-lg text-white shadow-sm flex-grow-1 py-2"
                                style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none" }}
                                type="button"
                                onClick={() => setMostrarModalRegistro(true)}
                              >
                                Crear usuario
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="d-flex gap-2 w-100">
                          <button className="btn btn-lg text-white flex-grow-1 py-2" style={{ backgroundColor: "#8a0d0d", border: "none" }} type="button" onClick={guardarCambios}>Guardar</button>
                          <button className="btn btn-lg btn-outline-secondary flex-grow-1 py-2" type="button" onClick={cancelarEdicion}>Cancelar</button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );

      case "plan":
        return (
          <div className="contenido-panel">
            <h2 className="titulo-perfil">Planes de Trabajo</h2>

            <table border={"1"} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Repartidor</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Fecha asignación</th>
                  <th>Acción</th>
                </tr>

              </thead>

              <tbody>
                {planes
                  .filter((plan) => plan.estado === "ACTIVO")
                  .map(plan => (

                    <tr key={plan.idPlanTrabajo}>
                      <td>{plan.idPlanTrabajo}</td>
                      <td>{plan.estado}</td>
                      <td>{plan.nombre}</td>
                      <td>{plan.telefono}</td>
                      <td>{plan.email}</td>
                      <td>{new Date(plan.fecha).toLocaleString()}</td>
                      <td>
                        <button
                          style={{ width: "100%" }}
                          onClick={() => {
                            setPlanSeleccionado(plan);
                            setMostrarModalPlan(true);
                          }}
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>

                  ))}
              </tbody>
            </table>
          </div>
        );

      case "admin":
        return (
          <div className="contenido-panel">
            <h2 className="titulo-perfil">Administrador</h2>

            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleArchivoExcel}
              className="form-control"
              style={{ maxWidth: "400px" }}
            />

            {mostrarResultado && resultadoCarga && (
              <div className="contenido-panel mt-4 p-4 shadow-sm" style={{ border: "1px solid #dee2e6" }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="mb-0" style={{
                    color: resultadoCarga.fallidas === 0 ? "#2e7d32" : "#8a0d0d",
                    fontWeight: "700"
                  }}>
                    {resultadoCarga.fallidas === 0 ? "¡Carga Exitosa!" : "Carga con algunas Novedades"}
                  </h4>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setMostrarResultado(false)}
                  >
                    Cerrar Resultado
                  </button>
                </div>

                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                  <div className="text-center p-3 flex-grow-1" style={{ background: "#f8f9fa", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <span className="d-block small text-muted text-uppercase fw-bold">Total Filas</span>
                    <strong style={{ fontSize: "1.8rem", color: "#495057" }}>{resultadoCarga.total}</strong>
                  </div>
                  <div className="text-center p-3 flex-grow-1" style={{ background: "#f8f9fa", borderRadius: "10px", borderBottom: "4px solid #2e7d32", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <span className="d-block small text-muted text-uppercase fw-bold">Exitosas</span>
                    <strong style={{ fontSize: "1.8rem", color: "#2e7d32" }}>{resultadoCarga.exitosas}</strong>
                  </div>
                  <div className="text-center p-3 flex-grow-1" style={{ background: "#f8f9fa", borderRadius: "10px", borderBottom: resultadoCarga?.fallidas > 0 ? "4px solid #8a0d0d" : "none", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <span className="d-block small text-muted text-uppercase fw-bold">Fallidas</span>
                    <strong style={{ fontSize: "1.8rem", color: "#8a0d0d" }}>{resultadoCarga.fallidas}</strong>
                  </div>
                </div>

                {resultadoCarga.errores && resultadoCarga.errores.length > 0 && (
                  <div className="mt-2">
                    <p className="fw-bold mb-2 small text-muted">Detalles de errores encontrados:</p>
                    <div style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "5px" }}>
                      {resultadoCarga.errores.map((err, idx) => (
                        <div key={idx} className="mb-2 p-2" style={{
                          background: "#fff5f5",
                          borderLeft: "4px solid #8a0d0d",
                          borderRadius: "6px",
                          fontSize: "0.9rem"
                        }}>
                          <strong>Fila {err.fila}</strong> - <span className="text-muted">{err.campo}:</span> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="contenedor-tarjetas">
              {ordenesGuardadas
                .filter((orden) => orden.estado?.toUpperCase() === "ACTIVA") //filtro que muestra las ordenes con estado ACTIVO, dejandolo en mayus para evitar novedades y mejorar la comunacion con el backend
                .map((orden) => (
                  <div key={orden.idOrden} className="tarjeta-orden">
                    <input
                      type="checkbox"
                      checked={ordenesSeleccionadas.includes(orden.idOrden)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOrdenesSeleccionadas([...ordenesSeleccionadas, orden.idOrden]);
                        } else {
                          setOrdenesSeleccionadas(
                            ordenesSeleccionadas.filter((id) => id !== orden.idOrden)
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
                    <button
                      onClick={() => {
                        setOrdenAEliminar(orden);
                        setMostrarModalEliminar(true);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>

                ))}
            </div>
            <button
              onClick={async () => {
                if (ordenesSeleccionadas.length === 0) {
                  alert("Debes seleccionar al menos una orden");
                  return;
                }

                try {
                  const res = await axios.get("http://localhost:8080/usuarios"); //vuelve a traer a los usuarios
                  setListaUsuarios(res.data);
                  setMostrarModalAsignar(true);
                } catch (error) {
                  console.error("Error al traer usuarios", error);
                }
              }}
            >
              Asignación
            </button>
          </div>
        );

      case "historico":
        return (
          <div className="contenido-panel">
            <h2 className="titulo-perfil">Histórico de Ordenes</h2>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="CANCELADA">Canceladas</option>
              <option value="COMPLETADA">Completadas</option>
            </select>
            <input
              type="text"
              placeholder="Buscar por ID de orden"
              value={filtroId}
              onChange={(e) => setFiltroId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Buscar por ID Plan"
              value={filtroPlan}
              onChange={(e) => setFiltroPlan(e.target.value)}
            />
            <div className="contenedor-tarjetas">
              {ordenesGuardadas
                .filter((orden) =>
                  orden.estado === "CANCELADA" ||
                  orden.estado === "COMPLETADA"
                )
                .filter((orden) =>
                  filtroEstado === ""
                    ? true
                    : orden.estado === filtroEstado
                )
                .filter((orden) =>
                  filtroId === ""
                    ? true
                    : orden.idOrden.toString().includes(filtroId)
                )
                .filter((orden) => {
                  if (filtroPlan === "") return true;
                  const idPlan = orden.planTrabajo?.idPlanTrabajo;
                  return idPlan ? idPlan.toString().includes(filtroPlan) : false;
                })
                .map((orden) => (
                  <div
                    key={orden.idOrden}
                    className="tarjeta-orden"
                    style={{
                      border:
                        orden.estado?.toUpperCase() === "CANCELADA"
                          ? "2px solid #9b4845"
                          : "2px solid #6b916b",
                    }}
                  >
                    <p>
                      <strong>Plan de Trabajo:</strong> {orden.planTrabajo?.idPlanTrabajo ? `#${orden.planTrabajo.idPlanTrabajo}` : "N/A"}
                    </p>
                    <p><strong>ID Orden:</strong> {orden.idOrden}</p>
                    <p><strong>Cliente:</strong> {orden.nombreCliente}</p>
                    <p><strong>Estado:</strong> {orden.estado}</p>

                    {orden.motivoCancelacion && (
                      <p>
                        <strong>Motivo:</strong> {orden.motivoCancelacion}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        );

      case "historicoPlanes":
        return (
          <div className="contenido-panel">
            <h2 className="titulo-perfil">Histórico de Planes de Trabajo</h2>

            <div style={{ marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="Buscar por ID Plan"
                value={filtroIdPlanHist}
                onChange={(e) => setFiltroIdPlanHist(e.target.value)}
              />

              <input
                type="text"
                placeholder="Buscar por repartidor"
                value={filtroRepartidorHist}
                onChange={(e) => setFiltroRepartidorHist(e.target.value)}
                style={{ marginLeft: "10px" }}
              />

              <input
                type="date"
                value={filtroFechaHist}
                onChange={(e) => setFiltroFechaHist(e.target.value)}
                style={{ marginLeft: "10px" }}
              />
            </div>
            <table border={"1"} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Repartidor</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Fecha asignación</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {planes
                  .filter((plan) => plan.estado === "COMPLETADA")

                  // filtro por ID
                  .filter((plan) =>
                    filtroIdPlanHist === ""
                      ? true
                      : plan.idPlanTrabajo.toString().includes(filtroIdPlanHist)
                  )

                  // filtro por repartidor
                  .filter((plan) =>
                    filtroRepartidorHist === ""
                      ? true
                      : plan.nombre.toLowerCase().includes(filtroRepartidorHist.toLowerCase())
                  )

                  // filtro por fecha
                  .filter((plan) => {
                    if (filtroFechaHist === "") return true;

                    //Utilizar fechas locales
                    const fechaObj = new Date(plan.fecha);

                    const año = fechaObj.getFullYear();
                    const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
                    const dia = String(fechaObj.getDate()).padStart(2, "0");

                    const fechaPlan = `${año}-${mes}-${dia}`;
                    return fechaPlan === filtroFechaHist;
                  })

                  .map((plan) => (
                    <tr key={plan.idPlanTrabajo}>
                      <td>{plan.idPlanTrabajo}</td>
                      <td>{plan.estado}</td>
                      <td>{plan.nombre}</td>
                      <td>{plan.telefono}</td>
                      <td>{plan.email}</td>
                      <td>{new Date(plan.fecha).toLocaleString()}</td>
                      <td>
                        <button
                          style={{ width: "100%" }}
                          onClick={() => {
                            setPlanSeleccionado(plan);
                            setMostrarModalPlan(true);
                          }}
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  //Estructura visual header
  return (
    //Base visual
    <div className="panel-supervisor">
      {/* NavBar Moderna */}
      <nav className="navbar navbar-expand-lg navbar-custom px-4">
        <div className="container-fluid">
          {/* Brand/Logo a la izquierda */}
          <div className="navbar-brand d-flex align-items-center">
            <img src={logo_SF} alt="Logo" className="logo-navbar me-2" />
            <span className="navbar-brand-text d-none d-sm-inline">Efi-Entregas</span>
          </div>

          {/* Toggler para móviles */}
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Links centrados */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3">
              <li className="nav-item">
                <button
                  className={`nav-link-custom ${seccionActiva === "perfil" ? "activo" : ""}`}
                  onClick={() => setSeccionActiva("perfil")}
                >
                  Perfil
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link-custom ${seccionActiva === "plan" ? "activo" : ""}`}
                  onClick={() => setSeccionActiva("plan")}
                >
                  Plan de Trabajo
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link-custom ${seccionActiva === "admin" ? "activo" : ""}`}
                  onClick={() => setSeccionActiva("admin")}
                >
                  Administrador
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link-custom ${seccionActiva === "historico" ? "activo" : ""}`}
                  onClick={() => setSeccionActiva("historico")}
                >
                  Histórico Ordenes
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link-custom ${seccionActiva === "historicoPlanes" ? "activo" : ""}`}
                  onClick={() => setSeccionActiva("historicoPlanes")}
                >
                  Histórico Planes
                </button>
              </li>
            </ul>

            {/* Botón Salir a la derecha */}
            <div className="d-flex mt-3 mt-lg-0">
              <button className="btn-salir w-100" onClick={salir}>
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>


      {renderContenido()}

      {mostrarModalRegistro && (
        <Registro onClose={() => setMostrarModalRegistro(false)} />
      )}

      {mostrarModalUsuarios && (
        <div className="modal-overlay" onClick={() => setMostrarModalUsuarios(false)}>
          <div className="modal-contenido" style={{ maxWidth: "1050px", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMostrarModalUsuarios(false)}
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

            <h2 className="mb-4" style={{ color: "#8a0d0d", fontWeight: "800", textAlign: "left" }}>Gestión de Usuarios</h2>

            <div className="d-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
              {listaUsuarios.map((usuario) => (
                <div key={usuario.idUsuario} className="tarjeta-usuario" style={{
                  background: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  {/* Imagen Izquierda */}
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #eee",
                    flexShrink: 0
                  }}>
                    {usuario.imagenPerfil ? (
                      <img src={`http://localhost:8080${usuario.imagenPerfil}`} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "2.5rem" }}>👤</span>
                    )}
                  </div>

                  {/* Información Derecha */}
                  <div className="flex-grow-1" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <span className="badge" style={{ backgroundColor: "#f8d7da", color: "#842029", fontSize: "0.7rem" }}>ID: {usuario.idUsuario}</span>
                      <span className="text-capitalize fw-bold" style={{ color: "#6c757d", fontSize: "0.75rem" }}>{usuario.rol}</span>
                    </div>
                    <h5 className="mb-1" style={{ fontSize: "1.1rem", fontWeight: "700", color: "#212529" }}>{usuario.nombre}</h5>
                    <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                      <p className="mb-0"><i className="bi bi-envelope me-1"></i>{usuario.email}</p>
                      <p className="mb-0"><i className="bi bi-telephone me-1"></i>{usuario.telefono}</p>
                    </div>

                    <div className="mt-2 d-flex flex-column gap-2">
                      <select
                        className="form-select form-select-sm"
                        style={{ borderRadius: "8px", backgroundColor: "#f8f9fa" }}
                        value={usuario.rol}
                        onChange={(e) => cambiarRolLocal(usuario.idUsuario, e.target.value)}
                      >
                        <option value="supervisor">Supervisor</option>
                        <option value="repartidor">Repartidor</option>
                      </select>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm text-white flex-grow-1"
                          style={{ backgroundColor: "#8a0d0d", borderRadius: "8px", fontSize: "0.85rem", padding: "6px 0" }}
                          onClick={() => guardarRol(usuario)}
                        >
                          Guardar Rol
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: "8px", fontSize: "0.85rem" }}
                          onClick={() => eliminarUsuario(usuario.idUsuario)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-top text-end">
              <button
                className="btn btn-outline-secondary px-4"
                style={{ borderRadius: "10px" }}
                onClick={() => setMostrarModalUsuarios(false)}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalEliminar && ( //Se utiliza para eliminar ordenes
        <div className="modal-overlay">
          <div className="modal-contenido">
            <h3>Eliminar Orden</h3>

            <p>
              Indicar motivo de la eliminacion de la orden{" "}
              <strong>{ordenAEliminar?.idOrden}</strong>
            </p>

            <textarea
              placeholder="Detalle la causa..."
              value={motivoEliminacion}
              onChange={(e) => setMotivoEliminacion(e.target.value)}
            />

            <div style={{ marginTop: "10px" }}>
              <button onClick={() => setMostrarModalEliminar(false)}>
                Cancelar
              </button>

              <button
                onClick={async () => { //Boton de confirmacion de la eliminación envia la informacion al backend y actualiza la pagina

                  if (!motivoEliminacion.trim()) {
                    alert("Debe escribir un motivo para eliminar la orden");
                    return;
                  }

                  try {
                    await axios.put(
                      `http://localhost:8080/ordenes/cancelar/${ordenAEliminar.idOrden}`,
                      {
                        motivoCancelacion: motivoEliminacion,
                      }
                    );

                    const res = await axios.get("http://localhost:8080/ordenes");
                    setOrdenesGuardadas(res.data);
                    ;

                    setMostrarModalEliminar(false);
                    setMotivoEliminacion("");
                    setOrdenAEliminar(null);

                  } catch (error) {
                    alert("Hubo un error al eliminar la orden");
                  }
                }}
              >
                Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalAsignar && ( //Modal para ver las asignaciones 
        <div className="modal-overlay">
          <div className="modal-contenido">
            <h3>Asignar ordenes</h3>
            <p>ID ordenes seleccionadas:</p>
            <p>{ordenesSeleccionadas.join(", ")}</p>

            {listaUsuarios
              .filter((usuario) => usuario.rol === "repartidor")
              .map((usuario) => (
                <div
                  key={usuario.idUsuario}
                  className="item-usuario"
                  style={{ textAlign: "left" }}
                >
                  <p><strong>ID:</strong> {usuario.idUsuario}</p>
                  <p><strong>Nombre:</strong> {usuario.nombre}</p>
                  <p><strong>Email:</strong> {usuario.email}</p>
                  <p><strong>Teléfono:</strong> {usuario.telefono}</p>


                  <button //Boton para realizar la asignacion de una orden a un usuario
                    onClick={async () => {
                      try {
                        await axios.put("http://localhost:8080/ordenes/asignar", {
                          idUsuario: usuario.idUsuario,
                          ordenes: ordenesSeleccionadas,
                        });

                        alert("Ordenes asignadas correctamente");

                        setMostrarModalAsignar(false);
                        setOrdenesSeleccionadas([]);

                        // refrescar órdenes
                        const res = await axios.get("http://localhost:8080/ordenes");
                        setOrdenesGuardadas(res.data);
                        //refrescar planes
                        const resPlanes = await axios.get("http://localhost:8080/planes");
                        setPlanes(resPlanes.data);

                      } catch (error) {
                        alert("Error al asignar órdenes");
                        console.error(error);
                      }
                    }}
                  >
                    Asignar
                  </button>
                  <hr />
                </div>
              ))}

            <button onClick={() => setMostrarModalAsignar(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
      {mostrarModalPlan && ( //información de "Ver detalles" del modulo plan de trabajo
        <div className="modal-overlay">
          <div className="modal-contenido">
            <h3>Detalle del Plan</h3>

            <p><strong>ID Plan:</strong> {planSeleccionado?.idPlanTrabajo}</p>
            <p><strong>Estado:</strong> {planSeleccionado?.estado}</p>
            <p><strong>Repartidor:</strong> {planSeleccionado?.nombre}</p>

            <h4>Ordenes asociadas</h4>

            <div className="contenedor-tarjetas">
              {ordenesDelPlan.length > 0 ? (
                ordenesDelPlan.map((orden) => (
                  <div key={orden.idOrden} className="tarjeta-orden">
                    <p><strong>ID:</strong> {orden.idOrden}</p>
                    <p><strong>Cliente:</strong> {orden.nombreCliente}</p>
                    <p><strong>Dirección:</strong> {orden.direccion}</p>
                    <p><strong>Estado:</strong> {orden.estado}</p>
                  </div>
                ))
              ) : (
                <p>No hay ordenes asociadas</p>
              )}
            </div>

            <button onClick={() => setMostrarModalPlan(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanelSupervisor;
