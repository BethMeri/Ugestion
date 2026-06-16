import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    const handleLogout = () => {
        // Esto es lo más importante: borramos los datos para que el sistema "olvide" quién eres
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        navigate('/login'); // Te mandamos de vuelta a la entrada
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div className="container">
                <Link className="navbar-brand" to="/">UGestión 🔒</Link>
                <div className="navbar-nav">
                    {token ? (
                        <>
                            <Link className="nav-link" to="/tareas">Tareas</Link>
                            
                            {/* Auditoría solo para admins */}
                            {rol === 'Admin' && (
                                <Link className="nav-link text-warning" to="/auditoria">Auditoría</Link>
                            )}
                            
                            {/* ¡Aquí está el botón salvador! */}
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