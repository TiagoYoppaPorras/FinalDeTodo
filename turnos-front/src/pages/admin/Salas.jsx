import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Layers, PlusCircle, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Salas() {
  const [salas, setSalas] = useState([]);
  const [nuevaSala, setNuevaSala] = useState({ nombre: "", ubicacion: "" });
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
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 justify-center hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      </td>
                    )}
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
