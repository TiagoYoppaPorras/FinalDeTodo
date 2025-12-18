import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Layers, PlusCircle, Trash2, Edit } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EditModal from "../../components/common/EditModal";
import DataTable from "../../components/common/DataTable"; 
// 👇 Importamos las alertas
import { alertaExito, alertaError, confirmarAccion } from "../../utils/alerts";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState({ 
    nombre: "", 
    description: "", 
    duracion_minutos: "" 
  });
  const [loading, setLoading] = useState(true);

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const fetchServicios = async () => {
    try {
      const res = await api.get("/servicios/");
      setServicios(res.data);
    } catch (err) {
      console.error("❌ Error al cargar servicios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/servicios/", nuevoServicio);
      alertaExito("Servicio creado correctamente"); // ✨
      setNuevoServicio({ nombre: "", description: "", duracion_minutos: "" });
      fetchServicios();
    } catch (err) {
      console.error("❌ Error al crear servicio:", err);
      alertaError("Error al crear servicio"); // ✨
    }
  };

  const handleEdit = (servicio) => {
    setEditando(servicio.id);
    setDatosEdicion({
      nombre: servicio.nombre,
      description: servicio.description,
      duracion_minutos: servicio.duracion_minutos,
    });
  };

  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      await api.put(`/servicios/${editando}`, datosEdicion);
      alertaExito("Servicio actualizado correctamente"); // ✨
      setEditando(null);
      setDatosEdicion({});
      fetchServicios();
    } catch (err) {
      console.error("❌ Error actualizando servicio:", err);
      alertaError("Error al actualizar servicio"); // ✨
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmado = await confirmarAccion("¿Eliminar servicio?", "Esta acción no se puede deshacer."); // ✨
    if (!confirmado) return;

    try {
      await api.delete(`/servicios/${id}`);
      alertaExito("Servicio eliminado"); // ✨
      fetchServicios();
    } catch (err) {
      console.error("❌ Error al eliminar servicio:", err);
      alertaError("Error al eliminar servicio"); // ✨
    }
  };

  // 🔹 DEFINICIÓN DE COLUMNAS PARA DATATABLE
  const columns = [
    { key: "nombre", label: "Nombre" },
    { key: "description", label: "Descripción", render: (s) => s.description || "—" },
    { key: "duracion_minutos", label: "Duración (min)", render: (s) => s.duracion_minutos || "—" },
    ...(isAdmin ? [{
      key: "acciones",
      label: "Acciones",
      render: (s) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <button
            onClick={() => handleEdit(s)}
            className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(s.id)}
            className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }] : [])
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando servicios...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="text-blue-600 w-6 h-6" /> Servicios
        </h1>

        {/* Solo admin puede crear */}
        {isAdmin && (
          <form
            onSubmit={handleCreate}
            className="bg-white p-4 md:p-6 rounded-lg shadow-sm border space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nombre del servicio"
                className="border p-2 rounded w-full"
                value={nuevoServicio.nombre}
                onChange={(e) =>
                  setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Descripción"
                className="border p-2 rounded w-full"
                value={nuevoServicio.description}
                onChange={(e) =>
                  setNuevoServicio({
                    ...nuevoServicio,
                    description: e.target.value,
                  })
                }
              />
              <input
                type="number"
                placeholder="Duración (min)"
                className="border p-2 rounded w-full"
                value={nuevoServicio.duracion_minutos}
                onChange={(e) =>
                  setNuevoServicio({
                    ...nuevoServicio,
                    duracion_minutos: e.target.value,
                  })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <PlusCircle className="w-5 h-5" /> Crear Servicio
            </button>
          </form>
        )}

        <DataTable 
          data={servicios} 
          columns={columns} 
          emptyMessage="No hay servicios registrados." 
        />

        <EditModal
          isOpen={editando !== null}
          onClose={() => {
            setEditando(null);
            setDatosEdicion({});
          }}
          title="Editar Servicio"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Servicio
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={datosEdicion.nombre || ""}
                onChange={(e) =>
                  setDatosEdicion({ ...datosEdicion, nombre: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2"
                rows="3"
                value={datosEdicion.description || ""}
                onChange={(e) =>
                  setDatosEdicion({ ...datosEdicion, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (minutos)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={datosEdicion.duracion_minutos || ""}
                onChange={(e) =>
                  setDatosEdicion({ ...datosEdicion, duracion_minutos: e.target.value })
                }
              />
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}