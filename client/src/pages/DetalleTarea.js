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

  const cargarDatos = useCallback(() => {
    const token = localStorage.getItem("token");

    // 1. Cargar metadatos de la tarea específica
    api.get(`/api/tareas/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setTarea(res.data))
      .catch((err) => console.error("Error al cargar la tarea:", err));

    // 2. Si el rol activo es Estudiante, sincronizar el estado de su entrega
    if (rol === "Estudiante") {
      api.get(`/api/tareas/${id}/mi-entrega`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setMiEntrega(res.data))
        .catch((err) => console.error("Error al sincronizar tu entrega previa:", err));
    }

    // 3. Si el rol activo es Docente, descargar el listado de control del curso
    if (rol === "Docente") {
      api.get(`/api/tareas/${id}/entregas`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setEntregas(res.data))
        .catch((err) => console.error("Error al descargar listado de entregas:", err));
    }
  }, [id, rol]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ==========================================
  // FLUJO DE INTERFAZ DEL ESTUDIANTE
  // ==========================================
  const enviarTarea = async () => {
    if (!archivo) {
      alert("⚠️ Por favor, selecciona un documento desde tu computadora primero.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const nombreDocumento = `📄 Documento adjunto: ${archivo.name}`;
      
      await api.post(
        `/api/tareas/${id}/entregas`,
        { estado: nombreDocumento },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("¡Documento subido y enviado con éxito! 🚀");
      cargarDatos(); // Actualización inmediata del DOM
    } catch (error) {
      alert("Hubo un error al procesar el envío del archivo.");
    }
  };

  const anularEntrega = async () => {
    if (window.confirm("⚠️ ¿Estás seguro de eliminar tu entrega? El documento se borrará del sistema y podrás subir uno nuevo.")) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/api/tareas/${id}/entregas`, { headers: { Authorization: `Bearer ${token}` } });
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
    const nota = window.prompt("🎓 Asiente la calificación sobre 10 puntos (ejemplo: 9.5):");
    
    if (nota !== null && nota.trim() !== "") {
      try {
        const token = localStorage.getItem("token");
        await api.put(
          `/api/entregas/${idEntrega}/calificar`,
          { calificacion: parseFloat(nota) }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("¡Calificación guardada con éxito! ✨");
        cargarDatos(); 
      } catch (error) {
        alert("Error de red al registrar la calificación.");
      }
    }
  };

  if (!tarea) {
    return <div className="container mt-5 text-center"><h5>Estableciendo conexión segura... 🕵️‍♀️</h5></div>;
  }

  // Validación estricta para determinar si la fila ya cuenta con una nota del profesor
  const estaCalificado = miEntrega && miEntrega.calificacion !== null && miEntrega.calificacion !== undefined && miEntrega.calificacion !== "";

  return (
    <div className="container mt-4">
      <button className="btn btn-outline-secondary mb-4" onClick={() => navigate("/tareas")}>
        ⬅ Volver a Mis Tareas
      </button>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h2 className="card-title text-primary fw-bold">{tarea.titulo}</h2>
          <p className="card-text fs-5 mt-3">{tarea.descripcion}</p>
        </div>
      </div>

      {/* ========================================== */}
      {/* PANEL DE INTERACCIÓN - ESTUDIANTE          */}
      {/* ========================================== */}
      {rol === "Estudiante" && (
        <div className="card shadow-sm border-0 bg-light">
          <div className="card-body">
            {!miEntrega ? (
              <>
                <h4 className="text-dark mb-3">Sube tu Documento 📂</h4>
                <div className="mb-3">
                  <input 
                    type="file" 
                    className="form-control" 
                    onChange={(e) => setArchivo(e.target.files[0])}
                  />
                  <small className="text-muted mt-1 d-block">Mecanismo de carga compatible con PDF, Word o Imágenes.</small>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={enviarTarea}>
                  Enviar Documento
                </button>
              </>
            ) : (
              <>
                <div className="alert alert-success shadow-sm" role="alert">
                  <h4 className="alert-heading">🎉 ¡Documento Entregado!</h4>
                  <p className="mb-1 text-dark fw-bold">{miEntrega.estado}</p>
                  <hr/>
                  <p className="mb-0 fs-5">
                    <strong>Calificación Oficial:</strong>{" "}
                    {estaCalificado ? (
                      <span className="badge bg-primary ms-2 fs-6">{miEntrega.calificacion} / 10</span>
                    ) : (
                      <span className="badge bg-secondary ms-2 fs-6">Pendiente por calificar</span>
                    )}
                  </p>
                </div>

                {!estaCalificado ? (
                  <div className="mt-3 p-3 bg-white border rounded shadow-sm">
                    <h5 className="text-danger mb-2">¿Te equivocaste de archivo?</h5>
                    <p className="text-muted small">Puedes purgar el registro actual para liberar la entrega y adjuntar el documento correcto.</p>
                    <button className="btn btn-danger shadow-sm" onClick={anularEntrega}>
                      🗑️ Eliminar Entrega Permanentemente
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-warning mt-2 border-0 shadow-sm" role="alert">
                    🔒 <strong>Entrega Bloqueada:</strong> Tu documento ya ha sido calificado por el docente y no puede ser eliminado ni alterado por medidas de auditoría.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PANEL DE CONTROL - DOCENTE                 */}
      {/* ========================================== */}
      {rol === "Docente" && (
        <div className="card shadow-sm border-info">
          <div className="card-body">
            <h4 className="text-info mb-3">Estudiantes que han entregado 📝</h4>
            {entregas.length > 0 ? (
              <ul className="list-group">
                {entregas.map((entrega) => (
                  <li key={entrega.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>👤 {entrega.nombre_estudiante}</strong>
                      <br />
                      <span className="text-primary">{entrega.estado}</span>
                      <br />
                      <small className="text-muted fs-6">
                        Nota: {entrega.calificacion !== null && entrega.calificacion !== "" ? (
                          <strong className="text-success">{entrega.calificacion}/10</strong>
                        ) : (
                          "Sin calificar"
                        )}
                      </small>
                    </div>
                    
                    {entrega.calificacion === null || entrega.calificacion === "" ? (
                      <button 
                        className="btn btn-sm btn-success shadow-sm"
                        onClick={() => calificarEntrega(entrega.id)}
                      >
                        ✅ Calificar
                      </button>
                    ) : (
                      <button 
                        className="btn btn-sm btn-outline-warning shadow-sm"
                        onClick={() => calificarEntrega(entrega.id)}
                      >
                        ✏️ Editar Nota
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="alert alert-light border text-center">
                Ningún estudiante ha enviado documentos todavía.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleTarea;