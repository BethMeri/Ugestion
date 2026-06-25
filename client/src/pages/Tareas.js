import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
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
      toast.warning("⚠️ Por favor, llena el título y la descripción.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/api/tareas",
        { titulo: tituloNuevo, descripcion: descNueva },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("¡Tarea publicada con éxito! ✨");
      setTituloNuevo(""); // Limpiamos el formulario
      setDescNueva("");
      obtenerTareas();
    } catch (error) {
      toast.error("Error al crear la tarea.");
    }
  };

  // ==========================================
  // FUNCIÓN: Eliminar Tarea (Solo Docente)
  // ==========================================
  const eliminarTarea = async (id) => {

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡Esta acción eliminará la tarea",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    // Si el usuario presionó "Sí, eliminar"
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/api/tareas/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTareas(tareas.filter((tarea) => tarea.id !== id));

        // Notificación de éxito bonita
        Swal.fire("¡Eliminado!", "La tarea ha sido borrada.", "success");
      } catch (error) {
        toast.error("Hubo un error al eliminar.");
      }
    }
  };

  // ==========================================
  // FUNCIÓN: Editar Tarea (Solo Docente)
  // ==========================================
  const editarTarea = async (id, tituloActual, descActual) => {
    // Usamos Swal.fire para mostrar un formulario personalizado
    const { value: formValues } = await Swal.fire({
      title: "Editar Tarea",
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Título" value="' +
        tituloActual +
        '">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Descripción" value="' +
        descActual +
        '">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar cambios",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        return [
          document.getElementById("swal-input1").value,
          document.getElementById("swal-input2").value,
        ];
      },
    });

    // Si el usuario guardó los cambios
    if (formValues) {
      const [nuevoTitulo, nuevaDesc] = formValues;

      try {
        const token = localStorage.getItem("token");
        await api.put(
          `/api/tareas/${id}`,
          { titulo: nuevoTitulo, descripcion: nuevaDesc },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        setTareas(
          tareas.map((tarea) =>
            tarea.id === id
              ? { ...tarea, titulo: nuevoTitulo, descripcion: nuevaDesc }
              : tarea,
          ),
        );
        toast.success("¡Tarea actualizada con éxito! ✨");
      } catch (error) {
        toast.error("Error al editar la tarea.");
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
            <h5 className="card-title text-dark mb-3">
              ➕ Publicar Nueva Tarea
            </h5>
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
                  <button
                    type="submit"
                    className="btn btn-primary w-100 shadow-sm"
                  >
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
                    <Link
                      to={`/tareas/${tarea.id}`}
                      className="text-decoration-none text-primary fw-bold"
                    >
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
                          onClick={() =>
                            editarTarea(
                              tarea.id,
                              tarea.titulo,
                              tarea.descripcion,
                            )
                          }
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
