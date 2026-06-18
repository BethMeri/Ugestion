import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const DetalleTarea = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tarea, setTarea] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [miEntrega, setMiEntrega] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const rol = localStorage.getItem("role") || localStorage.getItem("rol");

  const cargarDatos = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      // 1. Cargar la tarea
      const resTarea = await api.get(`/api/tareas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTarea(resTarea.data);

      // 2. Cargar dependencias según el rol
      if (rol === "Estudiante") {
        try {
          const resMiEntrega = await api.get(`/api/tareas/${id}/mi-entrega`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMiEntrega(resMiEntrega.data);
        } catch (e) {
          console.log("Sin entrega previa");
        }
      } else if (rol === "Docente") {
        const resEntregas = await api.get(`/api/tareas/${id}/entregas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntregas(resEntregas.data);
      }
    } catch (error) {
      console.error("Error al cargar:", error);
    }
  }, [id, rol, navigate]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ==========================================
  // FLUJO DE INTERFAZ DEL ESTUDIANTE
  // ==========================================
  // Busca esta función y cámbiala por esta:
  const enviarTarea = async () => {
    if (!archivo || !archivo.startsWith("http")) {
      alert("Por favor, pega un enlace válido de Drive (https://...)");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/api/tareas/${id}/entregas`,
        { estado: archivo },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("¡Enlace enviado correctamente!");
      cargarDatos();
    } catch (error) {
      // CAMBIO AQUÍ: Vamos a ver el detalle del error
      console.error(
        "Detalle del error al enviar:",
        error.response?.data || error.message,
      );
      alert(
        "Error al enviar: " +
          (error.response?.data?.mensaje || "Revisa la consola F12"),
      );
    }
  };

  const anularEntrega = async () => {
    if (
      window.confirm(
        "⚠️ ¿Estás seguro de eliminar tu entrega? El documento se borrará del sistema y podrás subir uno nuevo.",
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/api/tareas/${id}/entregas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("¡Entrega eliminada correctamente! 🗑️");
        setArchivo(null);
        setMiEntrega(null);
        cargarDatos();
      } catch (error) {
        alert("Ocurrió un error de integridad al intentar revocar la entrega.");
      }
    }
  };

  // ==========================================
  // FLUJO DE INTERFAZ DEL DOCENTE
  // ==========================================
  const calificarEntrega = async (idEntrega) => {
    const nota = window.prompt(
      "🎓 Asiente la calificación sobre 10 puntos (ejemplo: 9.5):",
    );

    if (nota !== null && nota.trim() !== "") {
      try {
        const token = localStorage.getItem("token");
        await api.put(
          `/api/entregas/${idEntrega}/calificar`,
          { calificacion: parseFloat(nota) },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("¡Calificación guardada con éxito! ✨");
        cargarDatos();
      } catch (error) {
        alert("Error de red al registrar la calificación.");
      }
    }
  };

  if (!tarea) {
    return (
      <div className="container mt-5 text-center">
        <h5>Estableciendo conexión segura... 🕵️‍♀️</h5>
      </div>
    );
  }

  // Validación estricta para determinar si la fila ya cuenta con una nota del profesor
  const estaCalificado =
    miEntrega &&
    miEntrega.calificacion !== null &&
    miEntrega.calificacion !== undefined &&
    miEntrega.calificacion !== "";

  return (
    <div className="container mt-4">
      <button
        className="btn btn-outline-secondary mb-4"
        onClick={() => navigate("/tareas")}
      >
        ⬅ Volver a Mis Tareas
      </button>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h2 className="card-title text-primary fw-bold">{tarea.titulo}</h2>
          <p className="card-text fs-5 mt-3">{tarea.descripcion}</p>
        </div>
      </div>

      {/* VISTA ESTUDIANTE */}
      {rol === "Estudiante" && (
        <div className="card shadow-sm border-0 bg-light">
          <div className="card-body">
            {!miEntrega ? (
              <>
                <h4 className="text-dark mb-3">
                  Enlace de tu Documento en Drive 🔗
                </h4>
                <div className="mb-3">
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://drive.google.com/..."
                    onChange={(e) => setArchivo(e.target.value)}
                  />
                  <small className="text-muted mt-1 d-block">
                    Pega aquí el enlace compartido de tu documento en la nube.
                  </small>
                </div>
                <button
                  className="btn btn-primary px-4 shadow-sm"
                  onClick={enviarTarea}
                >
                  Enviar Enlace
                </button>
              </>
            ) : (
              <>
                <div className="alert alert-success shadow-sm" role="alert">
                  <h4 className="alert-heading">🎉 ¡Entrega Realizada!</h4>
                  <p className="mb-1 text-dark fw-bold">
                    Enlace:{" "}
                    <a href={miEntrega.estado} target="_blank" rel="noreferrer">
                      {miEntrega.estado}
                    </a>
                  </p>
                  <hr />
                  <p className="mb-0 fs-5">
                    <strong>Calificación Oficial:</strong>{" "}
                    {estaCalificado ? (
                      <span className="badge bg-primary ms-2 fs-6">
                        {miEntrega.calificacion} / 10
                      </span>
                    ) : (
                      <span className="badge bg-secondary ms-2 fs-6">
                        Pendiente por calificar
                      </span>
                    )}
                  </p>
                </div>

                {!estaCalificado ? (
                  <div className="mt-3 p-3 bg-white border rounded shadow-sm">
                    <h5 className="text-danger mb-2">
                      ¿Te equivocaste de enlace?
                    </h5>
                    <button
                      className="btn btn-danger shadow-sm"
                      onClick={anularEntrega}
                    >
                      🗑️ Eliminar Entrega Permanentemente
                    </button>
                  </div>
                ) : (
                  <div
                    className="alert alert-warning mt-2 border-0 shadow-sm"
                    role="alert"
                  >
                    🔒 <strong>Entrega Bloqueada:</strong> Tu trabajo ya ha sido
                    calificado y no se puede modificar (Integridad de datos).
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* VISTA DOCENTE */}
      {/* VISTA DOCENTE */}
      {rol === "Docente" && (
        <div className="card shadow-sm border-info">
          <div className="card-body">
            <h4 className="text-info mb-3">Estudiantes que han entregado 📝</h4>
            {entregas.length > 0 ? (
              <ul className="list-group">
                {entregas.map((entrega) => (
                  <li
                    key={entrega.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>👤 {entrega.nombre_estudiante}</strong>
                      <br />
                      <button
                        className="btn btn-link p-0 text-primary fw-bold text-decoration-none"
                        onClick={() => {
                          // AHORA LEE 'entrega.estado' porque el backend lo renombra
                          const link = entrega.estado;
                          if (link && link.startsWith("http")) {
                            window.open(link, "_blank");
                          } else {
                            alert("No hay un enlace válido.");
                          }
                        }}
                      >
                        Ver Documento en Drive 🔗
                      </button>
                      <br />
                      <small className="text-muted">
                        Nota: {entrega.calificacion || "Sin calificar"}
                      </small>
                    </div>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => calificarEntrega(entrega.id)}
                    >
                      {entrega.calificacion ? "✏️ Editar Nota" : "✅ Calificar"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="alert alert-light text-center">
                Ningún estudiante ha enviado tareas todavía.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleTarea;
