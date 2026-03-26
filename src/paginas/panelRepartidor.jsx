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

    //Comunicación con el backend para usuarios, planes de trabajo y ordenes
    useEffect(() => {
        const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
        if (usuarioGuardado) {
            setDatosPerfil(usuarioGuardado);
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
                    className={seccionActiva === "historicoPlanes" ? "activo" : ""}
                    onClick={() => setSeccionActiva("historicoPlanes")}
                >
                    Histórico Planes
                </button>
            </nav>
            {renderContenido()}

            {mostrarModal && planSeleccionado && ( //Enseñar ordenes
                <div className="modal-overlay">
                    <div className="modal-contenido">

                        <h2>Plan #{planSeleccionado.idPlanTrabajo}</h2>
                        <p><strong>Estado:</strong> {planSeleccionado.estado}</p>
                        <p><strong>Fecha:</strong> {new Date(planSeleccionado.fecha).toLocaleString()}</p>

                        <h3>Ordenes:</h3>

                        <div className="contenedor-tarjetas">
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
                    <div className="modal-contenido">

                        <h2>Completar Orden #{ordenSeleccionada.idOrden}</h2>

                        <label>Estado de la orden:</label>
                        <select
                            value={estadoOrden}
                            onChange={(e) => setEstadoOrden(e.target.value)}
                        >
                            <option value="COMPLETADA">Completada</option>
                            <option value="PENDIENTE">Pendiente</option>
                        </select>
                        <br />
                        <br />
                        <label>Comentarios:</label>
                        <br />
                        <br />
                        <textarea
                            placeholder="Observaciones..."
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                        ></textarea>

                        <div style={{ marginTop: "15px" }}>
                            <button
                                onClick={() => {
                                    setMostrarModalCompletar(false);
                                    setOrdenSeleccionada(null);
                                }}
                            >
                                Volver
                            </button>

                            <button
                                onClick={() => {
                                    const confirmar = window.confirm(
                                        `¿Esta seguro que deseas cambiar el estado de la orden #${ordenSeleccionada.idOrden}?`
                                    );

                                    if (!confirmar) return;
                                    console.log("Funciona")
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