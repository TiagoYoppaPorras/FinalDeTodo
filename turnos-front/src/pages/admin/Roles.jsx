import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Shield, PlusCircle, Trash2 } from "lucide-react";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [nuevoRol, setNuevoRol] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);

  // 🔹 Obtener roles
  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles/");
      setRoles(res.data);
    } catch (err) {
      console.error("❌ Error cargando roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // 🔹 Crear nuevo rol
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/roles/", nuevoRol);
      alert("✅ Rol creado correctamente");
      setNuevoRol({ name: "", description: "" });
      fetchRoles();
    } catch (err) {
      console.error("❌ Error creando rol:", err);
      alert("Error al crear el rol");
    }
  };

  // 🔹 Eliminar rol
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar rol?")) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchRoles();
    } catch (err) {
      console.error("Error eliminando rol:", err);
      alert("No se pudo eliminar el rol");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Shield className="text-blue-600 w-6 h-6" /> Gestión de Roles
        </h1>

        {/* 🔹 Formulario de creación */}
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-lg shadow-sm border space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del rol (ej: admin)"
              className="border p-2 rounded"
              value={nuevoRol.name}
              onChange={(e) =>
                setNuevoRol({ ...nuevoRol, name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Descripción"
              className="border p-2 rounded"
              value={nuevoRol.description}
              onChange={(e) =>
                setNuevoRol({ ...nuevoRol, description: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" /> Crear Rol
          </button>
        </form>

        {/* 🔹 Tabla de roles */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {loading ? (
            <p className="text-gray-500">Cargando roles...</p>
          ) : roles.length === 0 ? (
            <p className="text-gray-500">No hay roles registrados.</p>
          ) : (
            <table className="w-full text-sm border">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Descripción</th>
                  <th className="p-2 border text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 border text-center">{r.id}</td>
                    <td className="p-2 border font-medium">{r.name}</td>
                    <td className="p-2 border">{r.description}</td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs flex items-center gap-1 justify-center hover:bg-red-600"
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
