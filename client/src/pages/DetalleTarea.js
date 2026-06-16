import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

const DetalleTarea = () => {
    const { id } = useParams();
    const [tarea, setTarea] = useState(null);
    const rol = localStorage.getItem("rol");

    useEffect(() => {
        // Traemos los detalles de esta tarea específica
        api.get(`/api/tareas/${id}`).then(res => setTarea(res.data));
    }, [id]);

    if (!tarea) return <div>Cargando...</div>;

    return (
        <div className="container mt-4">
            <h1>{tarea.titulo}</h1>
            <p className="lead">{tarea.descripcion}</p>

            <hr />

            {/* VISTA PARA ESTUDIANTE: Solo permite entregar */}
            {rol === "Estudiante" && (
                <div className="card p-3 bg-light">
                    <h4>Entrega tu trabajo</h4>
                    <input type="file" className="form-control mb-2" />
                    <button className="btn btn-primary">Enviar archivo 📤</button>
                </div>
            )}

            {/* VISTA PARA DOCENTE: Permite calificar */}
            {rol === "Docente" && (
                <div className="card p-3 border-primary">
                    <h4>Panel de Calificación</h4>
                    <p>Aquí verás la lista de alumnos que entregaron...</p>
                    {/* Lista de entregas iría aquí */}
                </div>
            )}
        </div>
    );
};
export default DetalleTarea;