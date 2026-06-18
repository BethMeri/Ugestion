import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Tareas = () => {
  const [tareas, setTareas] = useState([]);
  const [tituloNuevo, setTituloNuevo] = useState("");
  const [descNueva, setDescNueva] = useState("");
  const rol = localStorage.getItem("role") || localStorage.getItem("rol");

  // Envolvemos la carga en useCallback para evitar advertencias de React
  const obtenerTareas = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/api/tareas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTareas(response.data);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
    }
  }, []);

  useEffect(() => {
    obtenerTareas();
  }, [obtenerTareas]);

  // ==========================================
  // NUEVA FUNCIÓN: Crear Tarea (Solo Docente)
  // ==========================================
  const crearTarea = async (e) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    
    if (!tituloNuevo.trim() || !descNueva.trim()) {
      alert("⚠️ Por favor, llena el título y la descripción de la tarea.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/api/tareas",
        { titulo: tituloNuevo, descripcion: descNueva },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("¡Tarea creada y publicada con éxito! ✨");
      setTituloNuevo(""); // Limpiamos el formulario
      setDescNueva("");
      obtenerTareas(); // Recargamos la lista para que aparezca la nueva tarea
    } catch (error) {
      console.error("Error al crear:", error);
      alert("Hubo un error al crear la tarea.");
    }
  };

  // ==========================================
  // FUNCIÓN: Eliminar Tarea (Solo Docente)
  // ==========================================
  const eliminarTarea = async (id) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar esta tarea? Esta acción será auditada.")) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/api/tareas/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTareas(tareas.filter((tarea) => tarea.id !== id));
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Hubo un error al eliminar la tarea.");
      }
    }
  };

  // ==========================================
  // FUNCIÓN: Editar Tarea (Solo Docente)
  // ==========================================
  const editarTarea = async (id, tituloActual, descActual) => {
    const nuevoTitulo = window.prompt("✏️ Edita el título de la tarea:", tituloActual);
    const nuevaDesc = window.prompt("📝 Edita la descripción:", descActual);

    if (nuevoTitulo && nuevaDesc) {
      try {
        const token = localStorage.getItem("token");
        await api.put(
          `/api/tareas/${id}`,
          { titulo: nuevoTitulo, descripcion: nuevaDesc },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setTareas(
          tareas.map((tarea) =>
            tarea.id === id ? { ...tarea, titulo: nuevoTitulo, descripcion: nuevaDesc } : tarea
          )
        );
        alert("¡Tarea actualizada con éxito!");
      } catch (error) {
        console.error("Error al editar:", error);
        alert("Hubo un error al editar la tarea.");
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary">Panel de Tareas 📝</h2>

      {/* VISTA EXCLUSIVA DOCENTE: Formulario para crear tareas */}
      {rol === "Docente" && (
        <div className="card shadow-sm border-0 mb-4 bg-light">
          <div className="card-body">
            <h5 className="card-title text-dark mb-3">➕ Publicar Nueva Tarea</h5>
            <form onSubmit={crearTarea}>
              <div className="row">
                <div className="col-md-4 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Título de la tarea"
                    value={tituloNuevo}
                    onChange={(e) => setTituloNuevo(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Descripción o instrucciones detalladas"
                    value={descNueva}
                    onChange={(e) => setDescNueva(e.target.value)}
                  />
                </div>
                <div className="col-md-2 mb-2">
                  <button type="submit" className="btn btn-primary w-100 shadow-sm">
                    Publicar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTA GENERAL DE TAREAS (Visible para todos) */}
      <div className="row">
        {tareas.length > 0 ? (
          tareas.map((tarea) => (
            <div className="col-md-6 mb-3" key={tarea.id}>
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h5 className="card-title text-dark">
                    <Link to={`/tareas/${tarea.id}`} className="text-decoration-none text-primary fw-bold">
                      {tarea.titulo}
                    </Link>
                  </h5>
                  <p className="card-text text-muted">{tarea.descripcion}</p>

                  <div className="mt-3">
                    {/* Botones exclusivos del Docente */}
                    {rol === "Docente" && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-warning me-2 shadow-sm"
                          onClick={() => editarTarea(tarea.id, tarea.titulo, tarea.descripcion)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger shadow-sm"
                          onClick={() => eliminarTarea(tarea.id)}
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-info text-center">
              Aún no hay tareas publicadas en el sistema.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tareas;