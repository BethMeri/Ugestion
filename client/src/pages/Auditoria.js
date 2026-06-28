import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importa esto
import api from "../api/axios";
import '../diseños/Auditoria.css';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate(); // 2. Inicializa el hook
  const rol = localStorage.getItem("rol") || localStorage.getItem("role");

  useEffect(() => {
    // 3. Verificación de seguridad inmediata
    if (rol !== "Admin") {
      navigate("/tareas", { replace: true });
      return;
    }

    const obtenerLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/api/auditoria", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLogs(response.data);
      } catch (error) {
        console.error("Error al cargar auditoría:", error);
      }
    };

    obtenerLogs();
  }, [rol, navigate]); // 4. Añadimos dependencias

  // Si no es admin, no renderizamos nada (o podrías poner un spinner)
  if (rol !== "Admin") return null;
  return (
    <div className="container mt-5">
      {/* Añadimos sombra al título para que resalte */}
      <h2 className="text-primary fw-bold"> Registro de Auditoría</h2>

      {/* Añadimos shadow-sm y table-hover para que se vea profesional */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="card-body">
          <table className="table table-hover table-striped align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Acción</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  {/* Aquí mantuve tu lógica original tal cual */}
                  <td
                    className={
                      log.accion.includes("Entrega")
                        ? "text-primary fw-bold"
                        : ""
                    }
                  >
                    {log.accion}
                  </td>
                  <td className="text-muted">
                    {new Date(log.fecha_hora).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Auditoria;
