import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // 1. IMPORTA useLocation
import "../diseños/Navbar.css";
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 2. OBTÉN LA RUTA ACTUAL
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/login");
  };

  // 3. LA LÓGICA DE OCULTAMIENTO
  // Si la ruta es exactamente '/', '/login' o cualquier ruta que no sea de tareas/auditoría, ocultamos el navbar.
  // También ocultamos el navbar si la ruta no coincide con las que conocemos (como en el 404).
  const rutasConNavbar = ["/tareas", "/auditoria", "/tareas/"];
  const esRutaValida = rutasConNavbar.some((ruta) =>
    location.pathname.startsWith(ruta),
  );

  if (!esRutaValida) {
    return null; // Si no estamos en una ruta válida, el navbar se "esconde"
  }

  return (
    <nav className="navbar navbar-expand-lg custom-navbar mb-4 shadow-sm">
      <div className="container-fluid px-4 px-lg-5">
        <Link
          className="navbar-brand fw-bold"
          to={token ? "/tareas" : "/login"}
        >
          UGestión <span className="fs-6"></span>
        </Link>

        {/* Botón de hamburguesa para celulares */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menuNavegacion"
          aria-controls="menuNavegacion"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Contenedor que se colapsa en pantallas pequeñas */}
        <div className="collapse navbar-collapse" id="menuNavegacion">
          <div className="navbar-nav ms-auto align-items-center mt-3 mt-lg-0">
            {token ? (
              <>
                <Link className="nav-link custom-nav-link" to="/tareas">
                  Tareas
                </Link>
                {rol === "Admin" && (
                  <Link
                    className="nav-link custom-nav-link admin-link"
                    to="/auditoria"
                  >
                    Auditoría
                  </Link>
                )}
                <button
                  className="btn btn-outline-danger btn-sm ms-lg-3 mt-2 mt-lg-0 logout-btn w-100 w-lg-auto"
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                className="btn btn-primary btn-sm px-4 mt-2 mt-lg-0 w-100 w-lg-auto"
                to="/login"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
