import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Tareas from './pages/Tareas';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Auditoria from './pages/Auditoria';
import DetalleTarea from './pages/DetalleTarea';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tareas" element={<ProtectedRoute><Tareas /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute><Auditoria /> </ProtectedRoute>
} />
          <Route path="/tareas/:id" element={<ProtectedRoute><DetalleTarea /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;