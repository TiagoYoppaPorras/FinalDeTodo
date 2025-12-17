import { LogOut, Menu } from "lucide-react"; // Agregado Menu
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuClick }) { // Recibimos onMenuClick
  const { user, roles, logout } = useAuth();

  return (
    <header className="flex justify-between items-center bg-white border-b px-4 py-3 shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Botón Hamburguesa: Visible solo en móvil (md:hidden) */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-600 rounded-md md:hidden hover:bg-gray-100 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-xl font-semibold text-gray-800 truncate">
          KinesioPro
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="text-right hidden sm:block"> {/* Ocultamos info detallada en móvil muy pequeño */}
              <p className="text-sm font-medium text-gray-800">
                {user.nombre || "Usuario"}
              </p>
              <p className="text-xs text-gray-500">
                {roles?.join(", ") || "Sin rol"}
              </p>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Salir</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}