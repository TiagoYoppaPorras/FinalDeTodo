import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "../../context/AuthContext";

export default function MainLayout({ children }) {
  const { user, logout, loading } = useAuth();
  // Estado para controlar si el sidebar está visible en móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Cargando perfil...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        No se pudo cargar el perfil. Inicia sesión nuevamente.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Pasamos el estado y la función para cerrar 
        al Sidebar para que se comporte como un "Drawer" en móvil 
      */}
      <Sidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
        {/* Pasamos la función para ABRIR el menú al Navbar */}
        <Navbar 
          user={user} 
          onLogout={logout} 
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}