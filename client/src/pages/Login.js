import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../diseños/Login.css';

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

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("rol", response.data.rol); // ¡Muy importante!

      toast.success("¡Bienvenido(a) a UGestión! ✨");

      navigate("/tareas");
    } catch (error) {
      const mensajeError =
        error.response?.data?.mensaje ||
        "Credenciales incorrectas o servidor no disponible.";
      toast.error(`❌ ${mensajeError}`);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-card p-4 shadow">
        {/* Título arriba del login */}
        <h1 className="login-title mb-4">UGestion</h1>
        
        {/* Usuario */}
        <label className="form-label">Usuario</label>
        <input
          className="form-control mb-3"
          placeholder="Ingresa tu usuario"
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        
        {/* Contraseña */}
        <label className="form-label">Contraseña</label>
        <input
          className="form-control mb-4"
          type="password"
          placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        
        <button className="btn btn-primary w-100">Acceder</button>
      </form>
    </div>
  );
};

export default Login;
