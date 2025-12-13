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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { user, roles } = useAuth();

  // 🔹 Definir jerarquía de roles (de mayor a menor prioridad)
  const rolePriority = ["admin", "recepcionista", "kinesiologo", "paciente"];
  const roleName =
    rolePriority.find((r) => roles.includes(r)) || "sin rol";

  // 🔹 Menús separados por rol principal
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
    ],
    recepcionista: [
      { name: "Recepción", icon: <LayoutDashboard />, path: "/recepcion/dashboard" },
      { name: "Turnos de Hoy", icon: <ClipboardList />, path: "/recepcion/turnos" },
      { name: "Gestionar Turnos", icon: <Calendar />, path: "/turnos" },
      { name: "Pacientes", icon: <Users />, path: "/pacientes" },
    ],
    kinesiologo: [
      { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
      { name: "Mis Turnos", icon: <Stethoscope />, path: "/turnos" },
      { name: "Servicios", icon: <BarChart2 />, path: "/servicios" },
      { name: "Salas", icon: <Layers />, path: "/salas" },
    ],
    paciente: [
      { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
      { name: "Mis Citas", icon: <Calendar />, path: "/mis-turnos" },
      { name: "Solicitar Turno", icon: <UserPlus />, path: "/nuevo-turno" },
    ],
  };

  // 🔹 Obtener menú según el rol principal
  const menuItems = menuByRole[roleName] || [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
  ];

  return (
    <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">KinesioPro</h1>
        {user && (
          <p className="text-sm text-gray-500 mt-1 capitalize">
            Rol:{" "}
            <span
              className={`font-medium ${
                roleName === "admin"
                  ? "text-red-600"
                  : roleName === "recepcionista"
                  ? "text-purple-600"
                  : roleName === "kinesiologo"
                  ? "text-blue-600"
                  : "text-green-600"
              }`}
            >
              {roleName}
            </span>
          </p>
        )}
      </div>

      {/* Menú principal */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");

          return (
            <Link
              key={item.name}
              to={item.path}
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

      {/* Footer */}
      <div className="p-4 border-t text-xs text-gray-400 text-center">
        © {new Date().getFullYear()} KinesioPro
      </div>
    </aside>
  );
}
