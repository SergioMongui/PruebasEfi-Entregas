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
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [listaUsuarios, setListaUsuarios] = useState([]);

  //pruebas se puede borrar mas adelante
  useEffect(() => { console.log("Modal cambió:", mostrarModalUsuarios); }, [mostrarModalUsuarios]);

  //

  //Datos del usuario
  const [datosPerfil, setDatosPerfil] = useState({
    idUsuario: "",
    nombre: "",
    email: "",
    telefono: "",
    rol: "",
  });

  //Almacenamiento de la informacion de perfil
  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioGuardado) {
      setDatosPerfil(usuarioGuardado);
    }
    //Almacenamiento de ordenes
    axios
      .get("http://localhost:8080/ordenes")
      .then((res) => setOrdenesGuardadas(res.data))
      .catch((err) => console.error("Error al traer órdenes:", err));
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
    //Base
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

      {mostrarModalUsuarios && (
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
    </div>
  );
}

export default PanelSupervisor;
