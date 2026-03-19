import React, { useState, useEffect } from "react";
import "../estilos/panelSupervisor.css";
import logo_SF from "../assets/logo_SF.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

function PanelSupervisor() {
  const navegar = useNavigate();

  const [datosExcel, setDatosExcel] = useState([]);

  const [planesTrabajo, setPlanesTrabajo] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [ordenesDelPlan, setOrdenesDelPlan] = useState([]);
  const [seccionActiva, setSeccionActiva] = useState("perfil");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");
  const [ordenesGuardadas, setOrdenesGuardadas] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);

  const [datosPerfil, setDatosPerfil] = useState({
    idUsuario: "",
    nombre: "",
    email: "",
    telefono: "",
    rol: "",
  });

  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioGuardado) {
      setDatosPerfil(usuarioGuardado);
    }

    axios
      .get("http://localhost:8080/ordenes")
      .then((res) => setOrdenesGuardadas(res.data))
      .catch((err) => console.error("Error al traer órdenes:", err));

    axios
      .get("http://localhost:8080/planes-trabajo")
      .then((res) => setPlanesTrabajo(res.data))
      .catch((err) => console.error("Error al traer planes", err));
  }, []);

  const salir = () => {
    localStorage.removeItem("usuario");
    navegar("/inicioSesion");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosPerfil({ ...datosPerfil, [name]: value });
  };

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

  const verDetallesPlan = (id) => {
    axios
      .get(`http://localhost:8080/ordenes-plan-trabajo`)
      .then((res) => {
        const ordenesPlan = res.data.filter(
          (item) => item.planTrabajo.idPlanTrabajo === id
        );
        setOrdenesDelPlan(ordenesPlan.map((op) => op.ordenEnvio));
        setModalVisible(true);
      })
      .catch((err) => console.error("Error al obtener detalles del plan", err));
  };

  const handleArchivoExcel = (e) => {
    console.log("Archivo detectado");

    const archivo = e.target.files[0];
    if (!archivo) {
      console.log("No se seleccionó ningún archivo");
      return;
    }


    const lector = new FileReader();

    lector.onload = async (evento) => {
      console.log("✅ Archivo leído correctamente");
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

      try {
        await Promise.all(
          datosSinId.map((orden) =>
            axios.post("http://localhost:8080/ordenes", orden)
          )
        );

        setMensajeConfirmacion("Órdenes actualizadas.");
        setTimeout(() => setMensajeConfirmacion(""), 3000);

        // Recargar las órdenes para reflejar las nuevas
        const res = await axios.get("http://localhost:8080/ordenes");
        setOrdenesGuardadas(res.data);
      } catch (error) {
        console.error("Error al enviar datos:", error);
      }
    };

    lector.readAsArrayBuffer(archivo);
  };

  const crearPlanTrabajo = () => {
    axios
      .post("http://localhost:8080/planes-trabajo/creacion-ordenes", {
        ordenesIds: seleccionadas,
      })
      .then(() => {
        alert("Plan de trabajo creado");
        setSeleccionadas([]);

        axios
          .get("http://localhost:8080/ordenes")
          .then((res) => setOrdenesGuardadas(res.data));
        axios
          .get("http://localhost:8080/planes-trabajo")
          .then((res) => setPlanesTrabajo(res.data));
      })
      .catch((err) => {
        console.error("Error al crear plan:", err);
      });
  };

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
                <option value="Supervisor">Supervisor</option>
                <option value="Repartidor">Repartidor</option>
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
            {planesTrabajo.length === 0 ? (
              <p style={{ textAlign: "center" }}>No hay planes de trabajo</p>
            ) : (
              <div className="contenedor-tarjetas">
                {planesTrabajo.map((plan) => (
                  <div key={plan.idPlanTrabajo} className="tarjeta-orden">
                    <h3>Plan #{plan.idPlanTrabajo}</h3>
                    <p>
                      <strong>Estado:</strong> {plan.estadoPT}
                    </p>
                    <button
                      onClick={() => verDetallesPlan(plan.idPlanTrabajo)}
                      className="boton-global"
                    >
                      Ver Detalles
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            {mensajeConfirmacion && (
              <p
                style={{
                  color: "green",
                  textAlign: "center",
                  marginTop: "10px",
                }}
              >
                {mensajeConfirmacion}
              </p>
            )}

            <div className="contenedor-tarjetas">
              {ordenesGuardadas
                .filter((orden) => !orden.asignada)
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

            {ordenesGuardadas.length > 0 && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  className="boton-global"
                  disabled={seleccionadas.length === 0}
                  onClick={crearPlanTrabajo}
                >
                  Crear Plan de Trabajo
                </button>
              </div>
            )}

            {modalVisible && (
              <div className="modal-fondo">
                <div className="modal-contenido">
                  <h3>Órdenes del Plan</h3>
                  <button
                    className="cerrar-modal"
                    onClick={() => setModalVisible(false)}
                  >
                    Cerrar
                  </button>
                  {ordenesDelPlan.length === 0 ? (
                    <p>No hay órdenes asignadas a este plan.</p>
                  ) : (
                    <div className="contenedor-tarjetas">
                      {ordenesDelPlan.map((orden) => (
                        <div key={orden.idOrden} className="tarjeta-orden">
                          <p>
                            <strong>ID:</strong> {orden.idOrden}
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
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

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
          Administrador
        </button>
      </nav>

      {renderContenido()}
    </div>
  );
}

export default PanelSupervisor;
