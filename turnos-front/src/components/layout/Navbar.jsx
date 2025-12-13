import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, roles, logout } = useAuth();

  return (
    <header className="flex justify-between items-center bg-white border-b px-6 py-3 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">KinesioPro</h1>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="text-right">
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
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
