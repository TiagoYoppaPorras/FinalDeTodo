import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Layers, PlusCircle, Trash2, Edit } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EditModal from "../../components/common/EditModal";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState({ 
    nombre: "", 
    description: "", 
    duracion_minutos: "" 
  });

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
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/servicios/", nuevoServicio);
      alert("✅ Servicio creado correctamente");
      setNuevoServicio({ nombre: "", description: "", duracion_minutos: "" });
      fetchServicios();
    } catch (err) {
      console.error("❌ Error al crear servicio:", err);
      alert("Error al crear servicio");
    }
  };

  // --- 🔹 Abrir modal de edición ---
  const handleEdit = (servicio) => {
    setEditando(servicio.id);
    setDatosEdicion({
      nombre: servicio.nombre,
      description: servicio.description,
      duracion_minutos: servicio.duracion_minutos,
    });
  };

  // --- 🔹 Guardar cambios de edición ---
  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      await api.put(`/servicios/${editando}`, datosEdicion);
      alert("✅ Servicio actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchServicios();
    } catch (err) {
      console.error("❌ Error actualizando servicio:", err);
      alert("Error al actualizar servicio");
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar servicio?")) return;
    try {
      await api.delete(`/servicios/${id}`);
      fetchServicios();
    } catch (err) {
      console.error("❌ Error al eliminar servicio:", err);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="text-blue-600 w-6 h-6" /> Servicios
        </h1>

        {/* Solo admin puede crear */}
        {isAdmin && (
          <form
            onSubmit={handleCreate}
            className="bg-white p-6 rounded-lg shadow-sm border space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nombre del servicio"
                className="border p-2 rounded"
                value={nuevoServicio.nombre}
                onChange={(e) =>
                  setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Descripción"
                className="border p-2 rounded"
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
                className="border p-2 rounded"
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
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <PlusCircle className="w-5 h-5" /> Crear Servicio
            </button>
          </form>
        )}

        {/* Lista de servicios */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {servicios.length === 0 ? (
            <p className="text-gray-500">No hay servicios registrados.</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Descripción</th>
                  <th className="p-2 border">Duración (min)</th>
                  {isAdmin && <th className="p-2 border">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {servicios.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 border">{s.nombre}</td>
                    <td className="p-2 border">{s.description || "—"}</td>
                    <td className="p-2 border text-center">
                      {s.duracion_minutos || "—"}
                    </td>
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
