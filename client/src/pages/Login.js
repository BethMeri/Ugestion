import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
    <div className="container mt-5">
      <form onSubmit={handleSubmit} className="card p-4 shadow">
        <h2>Iniciar Sesión</h2>
        <input
          className="form-control mb-3"
          placeholder="Correo"
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email" // Opcional, pero recomendado para el correo
        />
        <input
          className="form-control mb-3"
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" // <-- ESTO ES LO QUE ELIMINA EL AVISO
        />
        <button className="btn btn-primary">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
