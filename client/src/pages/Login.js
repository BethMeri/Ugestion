import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from 'react-router-dom';
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await api.post("/api/login", {
            correo: email,
            password,
        });

        // 1. Guardamos el Token y el Rol que viene del servidor
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("rol", response.data.rol); // ¡Muy importante!

        alert("¡Bienvenida a UGestión! ✨");

        // 2. Redirección automática a la página de Tareas
        navigate('/tareas'); 

    } catch (error) {
        alert("Error: Revisa tus credenciales o el servidor.");
    }
};


  return (
    <div className="container mt-5">
      <form onSubmit={handleSubmit} className="card p-4 shadow">
        <h2>Iniciar Sesión</h2>
        <input
          className="form-control mb-3"
          placeholder="Correo"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="form-control mb-3"
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
