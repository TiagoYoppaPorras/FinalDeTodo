import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth  } from "../context/AuthContext";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Usuarios from "../pages/admin/Usuarios";
import Roles from "../pages/admin/Roles";
import Turnos from "../pages/admin/Turnos";
import Pacientes from "../pages/admin/Pacientes";
import Kinesiologos from "../pages/admin/Kinesiologos";
import Servicios from "../pages/admin/Servicios";
import Salas from "../pages/admin/Salas";
import MisTurnosPaciente from "../pages/MisTurnosPaciente";
import NuevoTurnoPaciente from "../pages/NuevoTurnoPaciente";
import HistoriasClinicas from "../pages/admin/HistoriasClinicas";
import TimelinePaciente from "../pages/admin/TimelinePaciente";
import CalendarioTurnos from "../pages/admin/CalendarioTurnos";
// Rutas de recepcionista
import DashboardRecepcionista from "../pages/recepcionista/DashboardRecepcionista";
import TurnosRecepcion from "../pages/recepcionista/TurnosRecepcion";


function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🔹 Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔹 Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* 🔹 Panel Admin */}
          <Route
            path="/usuarios"
            element={
              <PrivateRoute>
                <Usuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <PrivateRoute>
                <Roles />
              </PrivateRoute>
            }
          />
          <Route
            path="/turnos"
            element={
              <PrivateRoute>
                <Turnos />
              </PrivateRoute>
            }
          />
          <Route
            path="/pacientes"
            element={
              <PrivateRoute>
                <Pacientes />
              </PrivateRoute>
            }
          />
          <Route
            path="/kinesiologos"
            element={
              <PrivateRoute>
                <Kinesiologos />
              </PrivateRoute>
            }
          />
          <Route
            path="/servicios"
            element={
              <PrivateRoute>
                <Servicios />
              </PrivateRoute>
            }
          />
          <Route
            path="/salas"
            element={
              <PrivateRoute>
                <Salas />
              </PrivateRoute>
            }
          />

          <Route path="/historias-clinicas" element={<PrivateRoute><HistoriasClinicas /></PrivateRoute>} />
<Route path="/historias-clinicas/timeline/:pacienteId" element={<PrivateRoute><TimelinePaciente /></PrivateRoute>} />
<Route 
  path="/calendario" 
  element={<PrivateRoute><CalendarioTurnos /></PrivateRoute>} 
/>

          {/* 🔹 Panel Recepcionista */}
          <Route
            path="/recepcion/dashboard"
            element={
              <PrivateRoute>
                <DashboardRecepcionista />
              </PrivateRoute>
            }
          />
          <Route
            path="/recepcion/turnos"
            element={
              <PrivateRoute>
                <TurnosRecepcion />
              </PrivateRoute>
            }
          />

          {/* 🔹 Panel Paciente */}
          <Route
             path="/mis-turnos"
            element={
              <PrivateRoute>
                <MisTurnosPaciente />
              </PrivateRoute>
            }
          />
          
  
<Route
             path="/nuevo-turno"
            element={
              <PrivateRoute>
                <NuevoTurnoPaciente />
              </PrivateRoute>
            }
          />


          {/* Default */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
