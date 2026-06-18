import React, { useEffect, useState } from "react";
import api from "../api/axios";

const Auditoria = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const obtenerLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        // ¡IMPORTANTE! El token debe enviarse con el prefijo "Bearer "
        const response = await api.get("/api/auditoria", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLogs(response.data);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          alert("No tienes permisos de administrador.");
        } else {
          alert(
            "Error al conectar con la base de datos: " +
              error.response?.data?.mensaje,
          );
        }
      }
    };
    obtenerLogs();
  }, []);

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
              <td>{log.accion}</td>
              <td>{new Date(log.fecha_hora).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Auditoria;
