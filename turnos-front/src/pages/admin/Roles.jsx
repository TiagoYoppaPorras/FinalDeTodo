import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Shield, PlusCircle, Trash2 } from "lucide-react";
import DataTable from "../../components/common/DataTable";
// 👇 Importamos las alertas
import { alertaExito, alertaError, confirmarAccion } from "../../utils/alerts";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [nuevoRol, setNuevoRol] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/roles/", nuevoRol);
      alertaExito("Rol creado correctamente"); // ✨
      setNuevoRol({ name: "", description: "" });
      fetchRoles();
    } catch (err) {
      console.error("❌ Error creando rol:", err);
      alertaError("Error al crear el rol"); // ✨
    }
  };

  const handleDelete = async (id) => {
    const confirmado = await confirmarAccion("¿Eliminar rol?", "Esta acción no se puede deshacer."); // ✨
    if (!confirmado) return;

    try {
      await api.delete(`/roles/${id}`);
      alertaExito("Rol eliminado"); // ✨
      fetchRoles();
    } catch (err) {
      console.error("Error eliminando rol:", err);
      alertaError("No se pudo eliminar el rol"); // ✨
    }
  };

  const columns = [
    { key: "id", label: "ID", render: (r) => <span className="text-gray-500">#{r.id}</span> },
    { key: "name", label: "Nombre", render: (r) => <span className="font-medium text-gray-800">{r.name}</span> },
    { key: "description", label: "Descripción", render: (r) => r.description || "—" },
    {
      key: "acciones",
      label: "Acciones",
      render: (r) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <button
            onClick={() => handleDelete(r.id)}
            className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 flex items-center gap-1 text-xs"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando roles...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Shield className="text-blue-600 w-6 h-6" /> Gestión de Roles
        </h1>

        <form
          onSubmit={handleCreate}
          className="bg-white p-4 md:p-6 rounded-lg shadow-sm border space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del rol (ej: admin)"
              className="border p-2 rounded w-full"
              value={nuevoRol.name}
              onChange={(e) =>
                setNuevoRol({ ...nuevoRol, name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Descripción"
              className="border p-2 rounded w-full"
              value={nuevoRol.description}
              onChange={(e) =>
                setNuevoRol({ ...nuevoRol, description: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" /> Crear Rol
          </button>
        </form>

        <DataTable 
          data={roles} 
          columns={columns} 
          emptyMessage="No hay roles registrados." 
        />
      </div>
    </MainLayout>
  );
}