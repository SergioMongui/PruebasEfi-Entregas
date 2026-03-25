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

    //Almacenamiento de la informacion de perfil
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

        console.log("Orden actualizada:", response.data);

    } catch (error) {
        console.error("Error al actualizar orden:", error);
    }
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

                        <div className="contenedor-tarjetas">
                            {planes.length > 0 ? (
                                planes.map((plan) => (
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
                                <p>No tienes planes asignados</p>
                            )}
                        </div>

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
                        /
                        <div className="contenedor-tarjetas">
                            {ordenesGuardadas //esto sera eliminado
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

                                        <button
                                            onClick={() => {
                                                setOrdenSeleccionada(orden);
                                                setMostrarModalCompletar(true);
                                            }}
                                        >
                                            Completar
                                        </button>
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

                                    console.log("Estado:", estadoOrden);
                                    console.log("Comentarios:", comentarios);
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