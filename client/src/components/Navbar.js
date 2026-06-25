import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // 1. IMPORTA useLocation

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // 2. OBTÉN LA RUTA ACTUAL
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        navigate('/login');
    };

    // 3. LA LÓGICA DE OCULTAMIENTO
    // Si la ruta es exactamente '/', '/login' o cualquier ruta que no sea de tareas/auditoría, ocultamos el navbar.
    // También ocultamos el navbar si la ruta no coincide con las que conocemos (como en el 404).
    const rutasConNavbar = ['/tareas', '/auditoria', '/tareas/'];
    const esRutaValida = rutasConNavbar.some(ruta => location.pathname.startsWith(ruta));

    if (!esRutaValida) {
        return null; // Si no estamos en una ruta válida, el navbar se "esconde"
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            {/* ... el resto de tu código igual ... */}
            <div className="container">
                <Link className="navbar-brand" to="/">UGestión 🔒</Link>
                <div className="navbar-nav">
                    {token ? (
                        <>
                            <Link className="nav-link" to="/tareas">Tareas</Link>
                            {rol === 'Admin' && (
                                <Link className="nav-link text-warning" to="/auditoria">Auditoría</Link>
                            )}
                            <button className="nav-link btn btn-link" onClick={handleLogout}>
                                Cerrar Sesión
                            </button>
                        </>
                    ) : (
                        <Link className="nav-link" to="/login">Iniciar Sesión</Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;