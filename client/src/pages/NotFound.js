import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
      <h1 style={{ fontSize: '4rem', color: '#333' }}>404</h1>
      <p style={{ fontSize: '1.2rem' }}>Página no encontrada</p>
      
      {/* Esto hace exactamente lo mismo que la flecha de retroceder del navegador */}
      <button 
        onClick={() => navigate(-1)} 
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        Volver atrás
      </button>
    </div>
  );
}

export default NotFound;