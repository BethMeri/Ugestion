import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Tareas = () => {
  const [tareas, setTareas] = useState([]);
  const rol = localStorage.getItem("rol");

  useEffect(() => {
    const obtenerTareas = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/api/tareas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTareas(response.data);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
        alert("No tienes permiso o tu sesión expiró.");
      }
    };
    obtenerTareas();
  }, []);

  // FUNCIÓN: Eliminar Tarea
  const eliminarTarea = async (id) => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar esta tarea? Esta acción será auditada.",
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/api/tareas/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Filtramos la lista para que desaparezca al instante
        setTareas(tareas.filter((tarea) => tarea.id !== id));
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Hubo un error al eliminar la tarea.");
      }
    }
  };

  // FUNCIÓN: Editar Tarea
  const editarTarea = async (id, tituloActual, descActual) => {
    const nuevoTitulo = window.prompt(
      "✏️ Edita el título de la tarea:",
      tituloActual,
    );
    const nuevaDesc = window.prompt("📝 Edita la descripción:", descActual);

    // Si el docente escribió algo y no canceló...
    if (nuevoTitulo && nuevaDesc) {
      try {
        const token = localStorage.getItem("token");
        await api.put(
          `/api/tareas/${id}`,
          {
            titulo: nuevoTitulo,
            descripcion: nuevaDesc,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // Actualizamos la tarea en la pantalla al instante
        setTareas(
          tareas.map((tarea) =>
            tarea.id === id
              ? { ...tarea, titulo: nuevoTitulo, descripcion: nuevaDesc }
              : tarea,
          ),
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
      <h2 className="mb-4 text-primary">Mis Tareas de UGestión 📝</h2>
      <div className="row">
        {tareas.map((tarea) => (
          <div className="col-md-6 mb-3" key={tarea.id}>
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h5 className="card-title text-dark">
                  <Link
                    to={`/tareas/${tarea.id}`}
                    className="text-decoration-none text-primary"
                  >
                    {tarea.titulo}
                  </Link>
                </h5>
                <p className="card-text text-muted">{tarea.descripcion}</p>

                <div className="mt-3">
                  {/* Botones exclusivos del Docente */}
                  {rol === "Docente" && (
                    <>
                      {/* Botón Editar conectado correctamente */}
                      <button
                        className="btn btn-sm btn-outline-warning me-2"
                        onClick={() =>
                          editarTarea(tarea.id, tarea.titulo, tarea.descripcion)
                        }
                      >
                        Editar
                      </button>

                      {/* Botón Eliminar restaurado */}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => eliminarTarea(tarea.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tareas;
