import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Layers, PlusCircle, Trash2, Edit } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EditModal from "../../components/common/EditModal";
import DataTable from "../../components/common/DataTable";
// 👇 Importamos las alertas
import { alertaExito, alertaError, confirmarAccion } from "../../utils/alerts";

export default function Salas() {
  const [salas, setSalas] = useState([]);
  const [nuevaSala, setNuevaSala] = useState({ nombre: "", ubicacion: "" });
  const [loading, setLoading] = useState(true);

  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const fetchSalas = async () => {
    try {
      const res = await api.get("/salas/");
      setSalas(res.data);
    } catch (err) {
      console.error("❌ Error al cargar salas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalas();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/salas/", nuevaSala);
      alertaExito("Sala creada correctamente"); // ✨
      setNuevaSala({ nombre: "", ubicacion: "" });
      fetchSalas();
    } catch (err) {
      console.error("❌ Error al crear sala:", err);
      alertaError("Error al crear sala"); // ✨
    }
  };

  const handleEdit = (sala) => {
    setEditando(sala.id);
    setDatosEdicion({
      nombre: sala.nombre,
      ubicacion: sala.ubicacion,
    });
  };

  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      await api.put(`/salas/${editando}`, datosEdicion);
      alertaExito("Sala actualizada correctamente"); // ✨
      setEditando(null);
      setDatosEdicion({});
      fetchSalas();
    } catch (err) {
      console.error("❌ Error actualizando sala:", err);
      alertaError("Error al actualizar sala"); // ✨
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmado = await confirmarAccion("¿Eliminar sala?", "Esta acción no se puede deshacer."); // ✨
    if (!confirmado) return;

    try {
      await api.delete(`/salas/${id}`);
      alertaExito("Sala eliminada"); // ✨
      fetchSalas();
    } catch (err) {
      console.error("❌ Error al eliminar sala:", err);
      alertaError("Error al eliminar sala"); // ✨
    }
  };

  const columns = [
    { key: "nombre", label: "Nombre" },
    { key: "ubicacion", label: "Ubicación", render: (s) => s.ubicacion || "—" },
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
        <div className="p-6 text-gray-600">Cargando salas...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="text-green-600 w-6 h-6" /> Salas
        </h1>

        {isAdmin && (
          <form
            onSubmit={handleCreate}
            className="bg-white p-4 md:p-6 rounded-lg shadow-sm border space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre de la sala"
                className="border p-2 rounded w-full"
                value={nuevaSala.nombre}
                onChange={(e) =>
                  setNuevaSala({ ...nuevaSala, nombre: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Ubicación"
                className="border p-2 rounded w-full"
                value={nuevaSala.ubicacion}
                onChange={(e) =>
                  setNuevaSala({ ...nuevaSala, ubicacion: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <PlusCircle className="w-5 h-5" /> Crear Sala
            </button>
          </form>
        )}

        <DataTable 
          data={salas} 
          columns={columns} 
          emptyMessage="No hay salas registradas." 
        />

        <EditModal
          isOpen={editando !== null}
          onClose={() => {
            setEditando(null);
            setDatosEdicion({});
          }}
          title="Editar Sala"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Sala
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
                Ubicación
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={datosEdicion.ubicacion || ""}
                onChange={(e) =>
                  setDatosEdicion({ ...datosEdicion, ubicacion: e.target.value })
                }
              />
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}