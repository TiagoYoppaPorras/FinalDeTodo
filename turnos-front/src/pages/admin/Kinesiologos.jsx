import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Stethoscope, PlusCircle, Trash2 } from "lucide-react";

export default function Kinesiologos() {
  const [kines, setKines] = useState([]);
  const [nuevoKine, setNuevoKine] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  const fetchKines = async () => {
    try {
      const res = await api.get("/kinesiologos/");
      setKines(res.data);
    } catch (err) {
      console.error("❌ Error cargando kinesiólogos:", err);
    }
  };

  useEffect(() => {
    fetchKines();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/kinesiologos/", nuevoKine);
      alert("✅ Kinesiólogo creado correctamente");
      setNuevoKine({ nombre: "", email: "", password: "" });
      fetchKines();
    } catch (err) {
      console.error("❌ Error creando kinesiólogo:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar kinesiólogo?")) return;
    try {
      await api.delete(`/kinesiologos/${id}`);
      fetchKines();
    } catch (err) {
      console.error("Error eliminando kinesiólogo:", err);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Stethoscope className="text-blue-600 w-6 h-6" /> Gestión de
          Kinesiólogos
        </h1>

        <form
          onSubmit={handleCreate}
          className="bg-white p-6 border rounded-lg shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="border p-2 rounded"
              value={nuevoKine.nombre}
              onChange={(e) =>
                setNuevoKine({ ...nuevoKine, nombre: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              className="border p-2 rounded"
              value={nuevoKine.email}
              onChange={(e) =>
                setNuevoKine({ ...nuevoKine, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="border p-2 rounded"
              value={nuevoKine.password}
              onChange={(e) =>
                setNuevoKine({ ...nuevoKine, password: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5" /> Crear Kinesiólogo
          </button>
        </form>

        <div className="bg-white border rounded-lg shadow-sm p-6">
          {kines.length === 0 ? (
            <p className="text-gray-500">No hay kinesiólogos registrados.</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {kines.map((k) => (
                  <tr key={k.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 border">{k.id}</td>
                    <td className="p-2 border">{k.nombre}</td>
                    <td className="p-2 border">{k.email}</td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 justify-center"
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
