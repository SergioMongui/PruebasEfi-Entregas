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
    const [ordenes, setOrdenes] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalCompletar, setMostrarModalCompletar] = useState(false);
    const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
    const [estadoOrden, setEstadoOrden] = useState("COMPLETADA");
    const [comentarios, setComentarios] = useState("");

    //Mostrar planes asociados al repartidor y ver detalles de las ordenes
    const [planes, setPlanes] = useState([]);
    const [planSeleccionado, setPlanSeleccionado] = useState(null);

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
    const [imagenPerfil, setImagenPerfil] = useState(null); // Estado para la previsualización de la foto de perfil

    //Comunicación con el backend para usuarios, planes de trabajo y ordenes
    useEffect(() => {
        const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
        if (usuarioGuardado) {
            setDatosPerfil(usuarioGuardado);
            // Cargar imagen de perfil desde el objeto usuario
            if (usuarioGuardado.imagenPerfil) {
                setImagenPerfil(usuarioGuardado.imagenPerfil);
            }
            //Traer los planes del repartidor
            axios
                .get(`http://localhost:8080/planes/usuario/${usuarioGuardado.idUsuario}`)
                .then((res) => {
                    setPlanes(res.data);
                })
                .catch((err) => console.error("Error al traer planes", err));
            //consulta la informacion de las ordenes con el backend
            axios
                .get("http://localhost:8080/ordenes")
                .then((res) => {
                    setOrdenes(res.data);
                    console.log("ORDENES:", res.data);
                })
                .catch((err) => console.error("Error al traer ordenes", err));
        }
    }, []);

    //realiza filtro de todoas las ordenes para consultar solo la seleccionada
    const ordenesDelPlan = ordenes.filter(
        (orden) =>
            String(orden.planTrabajo?.idPlanTrabajo) ===
            String(planSeleccionado?.idPlanTrabajo)
    );

    //ingreso de la informacion por inputs de perfil
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

    //Funcion para cambiar estado orden y guardar comentarios
    const actualizarEstadoOrden = async (idOrden, estado, comentario) => {
        try {
            const response = await axios.put(
                `http://localhost:8080/ordenes/${idOrden}/estado`,
                {
                    estado: estado,
                    comentario: comentario
                }
            );
            //trae las ordenes 
            const res = await axios.get("http://localhost:8080/ordenes");
            const todasLasOrdenes = res.data;
            setOrdenes(todasLasOrdenes);

            //Compara las ordenes totales con las ordenes que coinciden con el plan de trabajo seleccionado
            const idPlanActual = planSeleccionado.idPlanTrabajo;
            const ordenesDeEstePlan = todasLasOrdenes.filter(
                (o) => String(o.planTrabajo?.idPlanTrabajo) === String(idPlanActual)
            );

            //Verificar si estan completadas
            const todasListas = ordenesDeEstePlan.every((o) => o.estado === "COMPLETADA");

            if (todasListas) {

                await axios.put(`http://localhost:8080/planes/${idPlanActual}/estado`, {
                    estado: "COMPLETADA"
                });


                //Refrescar
                const resPlanes = await axios.get(`http://localhost:8080/planes/usuario/${datosPerfil.idUsuario}`);
                setPlanes(resPlanes.data);
            }

            alert("Estado y comentarios actualizados");

            setMostrarModalCompletar(false);
            setComentarios("");
            setMostrarModal(false);
            setPlanSeleccionado(null);
        } catch (error) {
            console.error("Error al actualizar", error);
        }
    };

    //Cancelar edición
    const cancelarEdicion = () => {
        const original = JSON.parse(localStorage.getItem("usuario"));
        setDatosPerfil(original);
        setModoEdicion(false);
    };

    //Barra de progreso:
    const calcularProgresoPlan = (idPlan) => {
        const ordenesDelPlan = ordenes.filter(
            (o) => String(o.planTrabajo?.idPlanTrabajo) === String(idPlan)
        );
        if (ordenesDelPlan.length === 0) return 0;
        const completadas = ordenesDelPlan.filter((o) => o.estado === "COMPLETADA").length;
        return Math.round((completadas / ordenesDelPlan.length) * 100);
    };

    //Filtros para el Historico Planes

    const [filtroIdPlanHist, setFiltroIdPlanHist] = useState("");
    const [filtroFechaHist, setFiltroFechaHist] = useState("");

    //Contenido Base de Repartidor
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
                                                        <input type="email" name="email" className="form-control form-control-sm" value={datosPerfil.email} onChange={handleChange} disabled={datosPerfil.rol === "repartidor"} />
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
                                                        <select name="rol" className="form-select form-select-sm" value={datosPerfil.rol} onChange={handleChange} disabled={datosPerfil.rol === "repartidor"}>
                                                            <option value="supervisor">Supervisor</option>
                                                            <option value="repartidor">Repartidor</option>
                                                        </select>
                                                    ) : (
                                                        <span className="text-dark text-capitalize" style={{ fontSize: "1rem", fontWeight: "500" }}>{datosPerfil.rol}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex gap-2">
                                            {!modoEdicion ? (
                                                <button
                                                    className="btn btn-lg text-white shadow-sm flex-grow-1 py-2"
                                                    style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none" }}
                                                    type="button"
                                                    onClick={() => setModoEdicion(true)}
                                                >
                                                    Editar
                                                </button>
                                            ) : (
                                                <div className="d-flex gap-2 w-100">
                                                    <button
                                                        className="btn btn-lg text-white flex-grow-1 py-2"
                                                        style={{ backgroundColor: "#8a0d0d", border: "none" }}
                                                        type="button"
                                                        onClick={guardarCambios}
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        className="btn btn-lg btn-outline-secondary flex-grow-1 py-2"
                                                        type="button"
                                                        onClick={cancelarEdicion}
                                                    >
                                                        Cancelar
                                                    </button>
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

                //filtro para planes activos 
                const planesActivos = planes.filter((plan) => plan.estado !== "COMPLETADA");
                return (
                    <div className="contenido-panel">
                        <h2 className="titulo-perfil">Planes de Trabajo</h2>
                        <div className="contenedor-tarjetas">

                            {planesActivos.length > 0 ? (
                                planesActivos.map((plan) => {
                                    const progreso = calcularProgresoPlan(plan.idPlanTrabajo);

                                    return (
                                        <div key={plan.idPlanTrabajo} className="tarjeta-orden">
                                            <p><strong>Plan:</strong> #{plan.idPlanTrabajo}</p>
                                            <p><strong>Fecha:</strong> {new Date(plan.fecha).toLocaleString()}</p>
                                            <p><strong>Estado:</strong> {plan.estado}</p>
                                            <div style={{ marginBottom: "10px" }}>
                                                <p style={{ fontSize: "0.8rem", marginBottom: "5px" }}>
                                                    Progreso: {progreso}%
                                                </p>
                                                <div style={{
                                                    width: "100%",
                                                    backgroundColor: "#e0e0e0",
                                                    borderRadius: "10px",
                                                    height: "10px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        width: `${progreso}%`,
                                                        backgroundColor: progreso === 100 ? "#4caf50" : "#2196f3",
                                                        height: "100%",
                                                        transition: "width 0.5s ease-in-out"
                                                    }}></div>
                                                </div>
                                            </div>

                                            <button
                                                className="btn btn-lg text-white shadow-sm w-100 py-2 mt-2"
                                                style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none" }}
                                                onClick={() => {
                                                    setPlanSeleccionado(plan);
                                                    setMostrarModal(true);
                                                }}
                                            >
                                                Ver detalles
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>No tienes planes asignados</p>
                            )}
                        </div>
                    </div>
                );

            case "historicoPlanes":

                const planesCompletados = planes
                    .filter((plan) => plan.estado === "COMPLETADA")

                    // filtro por ID
                    .filter((plan) =>
                        filtroIdPlanHist === ""
                            ? true
                            : plan.idPlanTrabajo.toString().includes(filtroIdPlanHist)
                    )

                    // filtro por fecha local, igual usado en supervisor
                    .filter((plan) => {
                        if (filtroFechaHist === "") return true;

                        const fechaObj = new Date(plan.fecha);

                        const año = fechaObj.getFullYear();
                        const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
                        const dia = String(fechaObj.getDate()).padStart(2, "0");

                        const fechaPlan = `${año}-${mes}-${dia}`;

                        return fechaPlan === filtroFechaHist;
                    });

                return (
                    <div className="contenido-panel">
                        <h2 className="titulo-perfil">Histórico de Planes</h2>
                        <div style={{ marginBottom: "15px" }}>
                            <input
                                type="text"
                                placeholder="Buscar por ID Plan"
                                value={filtroIdPlanHist}
                                onChange={(e) => setFiltroIdPlanHist(e.target.value)}
                            />

                            <input
                                type="date"
                                value={filtroFechaHist}
                                onChange={(e) => setFiltroFechaHist(e.target.value)}
                                style={{ marginLeft: "10px" }}
                            />
                        </div>
                        <div className="contenedor-tarjetas">
                            {planesCompletados.length > 0 ? (
                                planesCompletados.map((plan) => (
                                    <div key={plan.idPlanTrabajo} className="tarjeta-orden">
                                        <p><strong>Plan:</strong> #{plan.idPlanTrabajo}</p>
                                        <p><strong>Fecha:</strong> {new Date(plan.fecha).toLocaleString()}</p>
                                        <p><strong>Estado:</strong> {plan.estado}</p>

                                        <button
                                            className="btn btn-lg text-white shadow-sm w-100 py-2 mt-2"
                                            style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none" }}
                                            onClick={() => {
                                                setPlanSeleccionado(plan);
                                                setMostrarModal(true);
                                            }}
                                        >
                                            Ver detalles
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p>No tienes planes completados</p>
                            )}
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

            {mostrarModal && planSeleccionado && ( //Enseñar ordenes
                <div className="modal-overlay">
                    <div className="modal-contenido">

                        <h2>Plan #{planSeleccionado.idPlanTrabajo}</h2>
                        <div className="d-flex flex-column gap-1 mb-3">
                            <p className="mb-0"><strong>Estado:</strong> {planSeleccionado.estado}</p>
                            <p className="mb-0"><strong>Fecha:</strong> {new Date(planSeleccionado.fecha).toLocaleString()}</p>
                        </div>

                        <h3 className="h5 mb-3">Ordenes:</h3>

                        <div className="contenedor-tarjetas mb-4">
                            {ordenesDelPlan.length > 0 ? (
                                ordenesDelPlan.map((orden) => (
                                    <div key={orden.idOrden} className="tarjeta-orden">
                                        <p><strong>ID:</strong> {orden.idOrden}</p>
                                        <p><strong>Cliente:</strong> {orden.nombreCliente}</p>
                                        <p><strong>Dirección:</strong> {orden.direccion}</p>
                                        <p><strong>Estado:</strong> {orden.estado}</p>
                                        {orden.estado === "PENDIENTE" && orden.motivoCancelacion && (
                                            <p style={{ color: "#d32f2f", fontSize: "0.9rem", marginTop: "-5px" }}>
                                                <strong>Motivo:</strong> {orden.motivoCancelacion}
                                            </p>
                                        )}
                                        {orden.estado === "COMPLETADA" ? (
                                            <span className="etiqueta-finalizada">Finalizada</span>
                                        ) : (
                                            <button
                                                className="btn btn-lg text-white shadow-sm w-100 py-2 mt-2"
                                                style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none" }}
                                                onClick={() => {
                                                    setOrdenSeleccionada(orden);
                                                    setMostrarModalCompletar(true);
                                                }}
                                            >
                                                Completar
                                            </button>)}
                                    </div>
                                ))
                            ) : (
                                <p>No hay ordenes en este plan</p>
                            )}
                        </div>

                        <button
                            className="btn btn-lg btn-outline-secondary w-100 py-2"
                            style={{ borderRadius: "10px" }}
                            onClick={() => {
                                setMostrarModal(false);
                                setPlanSeleccionado(null);
                            }}
                        >
                            Cerrar
                        </button>

                    </div>
                </div>
            )}
            {mostrarModalCompletar && ordenSeleccionada && ( //modal para completar o dejar pendientes ordenes
                <div className="modal-overlay">
                    <div className="modal-contenido" style={{ maxWidth: "500px" }}>

                        <h2 className="mb-4">Completar Orden #{ordenSeleccionada.idOrden}</h2>

                        <div className="mb-3">
                            <label className="form-label fw-bold">Estado de la orden:</label>
                            <select
                                className="form-select"
                                value={estadoOrden}
                                onChange={(e) => setEstadoOrden(e.target.value)}
                            >
                                <option value="COMPLETADA">Completada</option>
                                <option value="PENDIENTE">Pendiente</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Comentarios:</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Observaciones..."
                                value={comentarios}
                                onChange={(e) => setComentarios(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-lg btn-outline-secondary flex-grow-1 py-2"
                                style={{ borderRadius: "10px" }}
                                onClick={() => {
                                    setMostrarModalCompletar(false);
                                    setOrdenSeleccionada(null);
                                }}
                            >
                                Volver
                            </button>

                            <button
                                className="btn btn-lg text-white shadow-sm flex-grow-1 py-2"
                                style={{ backgroundColor: "#8a0d0d", borderRadius: "10px", border: "none" }}
                                onClick={() => {
                                    const confirmar = window.confirm(
                                        `¿Esta seguro que deseas cambiar el estado de la orden #${ordenSeleccionada.idOrden}?`
                                    );

                                    if (!confirmar) return;
                                    actualizarEstadoOrden(ordenSeleccionada.idOrden, estadoOrden, comentarios);
                                }}
                            >
                                Confirmar
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
export default PanelRepartidor;