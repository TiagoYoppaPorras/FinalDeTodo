import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "../../context/AuthContext";

export default function MainLayout({ children }) {
  const { user, logout, loading } = useAuth();

  // 🔹 Espera a que se cargue el contexto antes de mostrar contenido
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Cargando perfil...
      </div>
    );
  }

  // 🔹 Si no hay usuario (no logueado o token inválido)
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        No se pudo cargar el perfil. Inicia sesión nuevamente.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
