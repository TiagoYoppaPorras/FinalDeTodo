import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Layers, PlusCircle, Trash2, Edit } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EditModal from "../../components/common/EditModal";

export default function Salas() {
  const [salas, setSalas] = useState([]);
  const [nuevaSala, setNuevaSala] = useState({ nombre: "", ubicacion: "" });

  // Estados para edición
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
    }
  };

  useEffect(() => {
    fetchSalas();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/salas/", nuevaSala);
      alert("✅ Sala creada correctamente");
      setNuevaSala({ nombre: "", ubicacion: "" });
      fetchSalas();
    } catch (err) {
      console.error("❌ Error al crear sala:", err);
      alert("Error al crear sala");
    }
  };

  // --- 🔹 Abrir modal de edición ---
  const handleEdit = (sala) => {
    setEditando(sala.id);
    setDatosEdicion({
      nombre: sala.nombre,
      ubicacion: sala.ubicacion,
    });
  };

  // --- 🔹 Guardar cambios de edición ---
  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      await api.put(`/salas/${editando}`, datosEdicion);
      alert("✅ Sala actualizada correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchSalas();
    } catch (err) {
      console.error("❌ Error actualizando sala:", err);
      alert("Error al actualizar sala");
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar sala?")) return;
    try {
      await api.delete(`/salas/${id}`);
      fetchSalas();
    } catch (err) {
      console.error("❌ Error al eliminar sala:", err);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="text-green-600 w-6 h-6" /> Salas
        </h1>

        {/* Solo admin puede crear */}
        {isAdmin && (
          <form
            onSubmit={handleCreate}
            className="bg-white p-6 rounded-lg shadow-sm border space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre de la sala"
                className="border p-2 rounded"
                value={nuevaSala.nombre}
                onChange={(e) =>
                  setNuevaSala({ ...nuevaSala, nombre: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Ubicación"
                className="border p-2 rounded"
                value={nuevaSala.ubicacion}
                onChange={(e) =>
                  setNuevaSala({ ...nuevaSala, ubicacion: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <PlusCircle className="w-5 h-5" /> Crear Sala
            </button>
          </form>
        )}

        {/* Lista de salas */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {salas.length === 0 ? (
            <p className="text-gray-500">No hay salas registradas.</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Ubicación</th>
                  {isAdmin && <th className="p-2 border">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {salas.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 border">{s.nombre}</td>
                    <td className="p-2 border">{s.ubicacion || "—"}</td>
                    {isAdmin && (
                      <td className="p-2 border">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(s)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-yellow-600"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-red-600"
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 🔹 Modal de edición */}
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
