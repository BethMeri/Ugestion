import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Tareas from './pages/Tareas';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Auditoria from './pages/Auditoria';
import DetalleTarea from './pages/DetalleTarea';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <div className="container">
        <Routes>
          {/* 1. RUTAS PÚBLICAS */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />

          {/* 2. RUTAS PRIVADAS (Todo lo que necesita sesión) */}
          <Route path="/*" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Routes>
                  <Route path="/tareas" element={<Tareas />} />
                  <Route path="/auditoria" element={<Auditoria />} />
                  <Route path="/tareas/:id" element={<DetalleTarea />} />
                  
                  {/* ¡IMPORTANTE! El 404 va AQUÍ, dentro de este bloque, al final */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}
export default App;