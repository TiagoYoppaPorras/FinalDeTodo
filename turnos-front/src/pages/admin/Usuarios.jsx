import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Users, PlusCircle, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  const { loading, user } = useAuth();

  // --- 🔹 Obtener usuarios ---
  const fetchUsuarios = async () => {
    try {
      const res = await api.get("/usuarios/");
      setUsuarios(res.data);
    } catch (err) {
      console.error("❌ Error cargando usuarios:", err);
    }
  };

  // --- 🔹 Ejecutar fetch al cargar ---
  useEffect(() => {
    if (!loading && user) {
      fetchUsuarios();
    }
  }, [loading, user]);

  // --- 🔹 Crear usuario ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
      });

      alert("✅ Usuario creado correctamente");
      setNuevoUsuario({ nombre: "", email: "", password: "" });
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error creando usuario:", err);
      alert("Error al crear usuario. Revisa la consola.");
    }
  };

  // --- 🔹 Eliminar usuario ---
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar usuario?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      fetchUsuarios();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      alert("Error al eliminar usuario.");
    }
  };

  // --- 🔹 Estado de carga inicial ---
  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando usuarios...</div>
      </MainLayout>
    );
  }

  // --- 🔹 Render ---
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600 w-6 h-6" /> Gestión de Usuarios
        </h1>

        {/* 🔹 Formulario de creación */}
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-lg shadow-sm border space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="border p-2 rounded"
              value={nuevoUsuario.nombre}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              className="border p-2 rounded"
              value={nuevoUsuario.email}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="border p-2 rounded"
              value={nuevoUsuario.password}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5" /> Crear Usuario
          </button>
        </form>

        {/* 🔹 Tabla de usuarios */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {usuarios.length === 0 ? (
            <p className="text-gray-500">No hay usuarios registrados.</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Activo</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 border">{u.nombre}</td>
                    <td className="p-2 border">{u.email}</td>
                    <td className="p-2 border text-center">
                      {u.activo ? "✅" : "❌"}
                    </td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 justify-center hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
