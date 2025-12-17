import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart2,
  Shield,
  Stethoscope,
  UserPlus,
  Layers,
  ClipboardList,
  FileText,
  X // Importamos la X para cerrar el menú
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user, roles } = useAuth();

  const rolePriority = ["admin", "recepcionista", "kinesiologo", "paciente"];
  const roleName = rolePriority.find((r) => roles.includes(r)) || "sin rol";

  const menuByRole = {
    admin: [
      { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
      { name: "Usuarios", icon: <Users />, path: "/usuarios" },
      { name: "Turnos", icon: <Calendar />, path: "/turnos" },
      { name: "Pacientes", icon: <Users />, path: "/pacientes" },
      { name: "Kinesiólogos", icon: <Stethoscope />, path: "/kinesiologos" },
      { name: "Servicios", icon: <BarChart2 />, path: "/servicios" },
      { name: "Salas", icon: <Layers />, path: "/salas" },
      { name: "Roles", icon: <Shield />, path: "/roles" },
      { name: "Historias Clínicas", icon: <FileText />, path: "/historias-clinicas" },
      { name: "Calendario", icon: <Calendar />, path: "/calendario" },
    ],
    recepcionista: [
      { name: "Recepción", icon: <LayoutDashboard />, path: "/recepcion/dashboard" },
      { name: "Turnos de Hoy", icon: <ClipboardList />, path: "/recepcion/turnos" },
      { name: "Gestionar Turnos", icon: <Calendar />, path: "/turnos" },
      { name: "Pacientes", icon: <Users />, path: "/pacientes" },
      { name: "Calendario", icon: <Calendar />, path: "/calendario" },
    ],
    kinesiologo: [
      { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
      { name: "Historias Clínicas", icon: <FileText />, path: "/historias-clinicas" },
      { name: "Mis Turnos", icon: <Stethoscope />, path: "/turnos" },
      { name: "Servicios", icon: <BarChart2 />, path: "/servicios" },
      { name: "Salas", icon: <Layers />, path: "/salas" },
      { name: "Calendario", icon: <Calendar />, path: "/calendario" },
    ],
    paciente: [
      { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
      { name: "Mis Citas", icon: <Calendar />, path: "/mis-turnos" },
      { name: "Solicitar Turno", icon: <UserPlus />, path: "/nuevo-turno" },
    ],
  };

  const menuItems = menuByRole[roleName] || [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
  ];

  return (
    <>
      {/* OVERLAY PARA MÓVIL:
        Fondo oscuro transparente que cubre toda la pantalla cuando el menú está abierto.
        Al hacer click en él, se cierra el menú.
      */}
      <div 
        className={`fixed inset-0 z-40 bg-gray-900/50 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r flex flex-col shadow-lg md:shadow-sm transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 
        `}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">KinesioPro</h1>
            {user && (
              <p className="text-sm text-gray-500 mt-1 capitalize">
                Rol:{" "}
                <span className={`font-medium ${
                    roleName === "admin" ? "text-red-600"
                    : roleName === "recepcionista" ? "text-purple-600"
                    : roleName === "kinesiologo" ? "text-blue-600"
                    : "text-green-600"
                  }`}
                >
                  {roleName}
                </span>
              </p>
            )}
          </div>
          {/* Botón cerrar (X) visible solo en móvil */}
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => onClose()} // Cerramos el menú al hacer click en una opción (en móvil)
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <span className="w-5 h-5">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} KinesioPro
        </div>
      </aside>
    </>
  );
}