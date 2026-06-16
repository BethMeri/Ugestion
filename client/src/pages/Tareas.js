import React, { useEffect, useState } from "react";
import api from "../api/axios";

const Tareas = () => {
  const [tareas, setTareas] = useState([]);
  const rol = localStorage.getItem("rol");
  useEffect(() => {
    const obtenerTareas = async () => {
      try {
        // Recuperamos el token que guardaste al hacer Login
        const token = localStorage.getItem("token");

        // Pedimos las tareas al backend enviando el token en el header
        const response = await api.get("/api/tareas", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Guardamos las tareas en el estado para mostrarlas
        setTareas(response.data);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
        alert("No tienes permiso o tu sesión expiró.");
      }
    };

    obtenerTareas();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary">Mis Tareas de UGestión 📝</h2>
      <div className="row">
        {tareas.map((tarea) => (
          // Columna para que se ordenen bien
          <div className="col-md-6 mb-3" key={tarea.id}>
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h5 className="card-title text-dark">{tarea.titulo}</h5>
                <p className="card-text text-muted">{tarea.descripcion}</p>

                {/* Aquí añadiremos los botones de acción después */}
                <div className="mt-3">
                    
                  {/* Botones para Administradores y Docentes */}
                  {rol === "Docente" && (
    <>
        <button className="btn btn-sm btn-outline-warning me-2">Editar</button>
        <button className="btn btn-sm btn-outline-danger">Eliminar</button>
    </>
)}

                  {/* Botón exclusivo para Estudiantes */}
                  {localStorage.getItem("rol") === "Estudiante" && (
                    <button className="btn btn-sm btn-primary">
                      Adjuntar Entrega 📂
                    </button>
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
