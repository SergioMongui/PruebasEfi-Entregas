import React, { useState, useEffect } from "react";
import "../estilos/panelSupervisor.css";
import logo_SF from "../assets/logo_SF.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

function PanelSupervisor() {
  const navegar = useNavigate();

  const [datosExcel, setDatosExcel] = useState([]);

  const [seccionActiva, setSeccionActiva] = useState("perfil");
  const [modoEdicion, setModoEdicion] = useState(false); //Edicion perfil
  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false); //Editar otros usuarios
  const [ordenesGuardadas, setOrdenesGuardadas] = useState([]);
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [filtroPlan, setFiltroPlan] = useState("");
  //Para la eliminacion de tarjetas de ordenes en administrador
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState("");

  //Filtros de estados en historico supervisor
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroId, setFiltroId] = useState("");

  //Asignación
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState([]);
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);

  //Datos del usuario
  const [datosPerfil, setDatosPerfil] = useState({
    idUsuario: "",
    nombre: "",
    email: "",
    telefono: "",
    rol: "",
  });

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

  //Leer archivo Excel y convertirlo en datos de órdenes
  const handleArchivoExcel = (e) => {
    console.log("Archivo detectado");
    const archivo = e.target.files[0];
    if (!archivo) {
      console.log("No se seleccionó ningún archivo");
      return;
    }

    const lector = new FileReader();

    lector.onload = async (evento) => {
      console.log("Archivo leído correctamente");
      const datos = new Uint8Array(evento.target.result);
      const workbook = XLSX.read(datos, { type: "array" });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datosJson = XLSX.utils.sheet_to_json(hoja, { defval: "" });

      const datosSinId = datosJson.map((fila) => ({
        nombreCliente: fila["NOMBRE CLIENTE"] || "",
        direccion: fila["DIRECCION"] || "",
        telefono: fila["TELEFONO"] || "",
        listaProductos: fila["LISTA PRODUCTOS"] || "",
        valor: parseFloat(fila["VALOR"]) || 0,
      }));
      console.log("Datos a enviar:", datosSinId);
      setDatosExcel(datosSinId);
      //Envia las ordenes al backend
      try {
        await Promise.all(
          datosSinId.map((orden) =>
            axios.post("http://localhost:8080/ordenes", orden)
          )
        );

        // Recargar las ordenes para reflejar las nuevas
        const res = await axios.get("http://localhost:8080/ordenes");
        setOrdenesGuardadas(res.data);
      } catch (error) {
        console.error("Error al enviar datos", error);
      }
    };

    lector.readAsArrayBuffer(archivo);
  };

  //Contenido Base de Supervisor
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
                disabled={!modoEdicion}
              >
                <option value="supervisor">Supervisor</option>
                <option value="repartidor">Repartidor</option>
              </select>
              {!modoEdicion ? (
                <>
                  <button type="button" onClick={() => setModoEdicion(true)}>
                    Editar
                  </button>
                  {datosPerfil.rol === "supervisor" && (
                    <button type="button" onClick={async () => {
                      try {
                        const res = await axios.get("http://localhost:8080/usuarios");
                        setListaUsuarios(res.data);
                        setMostrarModalUsuarios(true);
                      } catch (error) {
                        console.error("Error para traer los usuarios", error);
                      }
                    }}>
                      Editar otro usuario
                    </button>

                  )}
                </>
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
                {planes.map(plan => (

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
            />

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
                          ? "2px solid red"
                          : "2px solid green",
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
      default:
        return null;
    }
  };

  //Estructura visual header
  return (
    //Base visual
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
          Administrador
        </button>
        <button
          className={seccionActiva === "historico" ? "activo" : ""}
          onClick={() => setSeccionActiva("historico")}
        >
          Histórico
        </button>
      </nav>


      {renderContenido()}

      {mostrarModalUsuarios && ( //Funciona como ventana emergente y realizar la edicion de rol o eliminacion de ususarios (solo para supervisor)
        <div className="modal-overlay">
          <div className="modal-contenido">
            <h3>Usuarios registrados</h3>
            {listaUsuarios.map((usuario) => (
              <div key={usuario.idUsuario} className="item-usuario">
                <p><strong>ID:</strong> {usuario.idUsuario}</p>
                <p><strong>Nombre:</strong> {usuario.nombre}</p>
                <select
                  value={usuario.rol}
                  onChange={(e) => cambiarRolLocal(usuario.idUsuario, e.target.value)}
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="repartidor">Repartidor</option>
                </select>
                <button onClick={() => guardarRol(usuario)}>
                  Guardar rol
                </button>

                <button onClick={() => eliminarUsuario(usuario.idUsuario)}>
                  Eliminar
                </button>

                <hr />
              </div>
            ))}

            <button onClick={() => setMostrarModalUsuarios(false)}>
              Cerrar
            </button>
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
