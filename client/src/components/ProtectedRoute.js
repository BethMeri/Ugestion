import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    // Si no hay token, te manda al login. Si hay, te deja pasar (children).
    return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;