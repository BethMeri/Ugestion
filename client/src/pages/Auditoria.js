import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importa esto
import api from "../api/axios";

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
      <h2>🕵️‍♀️ Registro de Auditoría</h2>
      <table className="table table-striped mt-3">
        <thead>
          <tr>
            <th>Acción</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
         {logs.map((log, index) => (
  <tr key={index}>
    {/* Agregamos una lógica sencilla para resaltar las entregas */}
    <td className={log.accion.includes('Entrega') ? 'text-primary fw-bold' : ''}>
      {log.accion}
    </td>
    <td>{new Date(log.fecha_hora).toLocaleString()}</td>
  </tr>
))}
        </tbody>
      </table>
    </div>
  );
};

export default Auditoria;
