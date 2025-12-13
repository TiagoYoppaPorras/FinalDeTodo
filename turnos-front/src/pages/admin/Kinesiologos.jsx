import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Stethoscope, PlusCircle, Trash2, Edit } from "lucide-react";
import EditModal from "../../components/common/EditModal";

export default function Kinesiologos() {
  const [kines, setKines] = useState([]);

  // Estado para crear nuevo kinesiólogo
  const [nuevoKine, setNuevoKine] = useState({
    // Datos del usuario
    nombre: "",
    email: "",
    password: "",
    // Datos del kinesiólogo
    matricula_profesional: "",
    especialidad: "",
  });

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // 🔹 Obtener kinesiólogos
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

  // 🔹 Crear kinesiólogo (primero usuario, luego kinesiólogo)
  const handleCreate = async (e) => {
    e.preventDefault();

    // Validar matrícula profesional
    if (!nuevoKine.matricula_profesional.trim()) {
      alert("⚠️ La matrícula profesional es obligatoria");
      return;
    }

    try {
      // 1️⃣ Crear usuario primero
      const userResponse = await api.post("/auth/register", {
        nombre: nuevoKine.nombre,
        email: nuevoKine.email,
        password: nuevoKine.password,
      });

      // 2️⃣ Crear kinesiólogo con el user_id
      await api.post("/kinesiologos/", {
        user_id: userResponse.data.id,
        matricula_profesional: nuevoKine.matricula_profesional,
        especialidad: nuevoKine.especialidad || null,
      });

      alert("✅ Kinesiólogo creado correctamente");
      setNuevoKine({
        nombre: "",
        email: "",
        password: "",
        matricula_profesional: "",
        especialidad: "",
      });
      fetchKines();
    } catch (err) {
      console.error("❌ Error creando kinesiólogo:", err);
      alert("Error al crear kinesiólogo. Revisa la consola.");
    }
  };

  // 🔹 Abrir modal de edición
  const handleEdit = (kine) => {
    setEditando(kine.id);
    setDatosEdicion({
      // Datos del usuario
      user_id: kine.user_id,
      nombre: kine.user?.nombre || "",
      email: kine.user?.email || "",
      // Datos del kinesiólogo
      matricula_profesional: kine.matricula_profesional || "",
      especialidad: kine.especialidad || "",
    });
  };

  // 🔹 Guardar cambios de edición
  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      // 1️⃣ Actualizar usuario
      await api.put(`/usuarios/${datosEdicion.user_id}`, {
        nombre: datosEdicion.nombre,
        email: datosEdicion.email,
      });

      // 2️⃣ Actualizar kinesiólogo
      await api.put(`/kinesiologos/${editando}`, {
        matricula_profesional: datosEdicion.matricula_profesional,
        especialidad: datosEdicion.especialidad || null,
      });

      alert("✅ Kinesiólogo actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchKines();
    } catch (err) {
      console.error("❌ Error actualizando kinesiólogo:", err);
      alert("Error al actualizar kinesiólogo");
    } finally {
      setIsLoadingSave(false);
    }
  };

  // 🔹 Eliminar kinesiólogo
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar kinesiólogo? Esto también eliminará su usuario."))
      return;
    try {
      await api.delete(`/kinesiologos/${id}`);
      fetchKines();
      alert("✅ Kinesiólogo eliminado");
    } catch (err) {
      console.error("Error eliminando kinesiólogo:", err);
      alert("Error al eliminar kinesiólogo");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Stethoscope className="text-green-600 w-6 h-6" /> Gestión de
          Kinesiólogos
        </h1>

        {/* 🔹 Formulario de creación */}
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 border rounded-lg shadow-sm space-y-4"
        >
          <h3 className="font-semibold text-gray-700 border-b pb-2">
            Nuevo Kinesiólogo
          </h3>

          {/* Datos del Usuario */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600">
              📋 Datos de Usuario
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nombre completo *"
                className="border p-2 rounded"
                value={nuevoKine.nombre}
                onChange={(e) =>
                  setNuevoKine({ ...nuevoKine, nombre: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Correo electrónico *"
                className="border p-2 rounded"
                value={nuevoKine.email}
                onChange={(e) =>
                  setNuevoKine({ ...nuevoKine, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Contraseña *"
                className="border p-2 rounded"
                value={nuevoKine.password}
                onChange={(e) =>
                  setNuevoKine({ ...nuevoKine, password: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Datos del Kinesiólogo */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600">
              💼 Datos Profesionales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Matrícula Profesional *"
                className="border p-2 rounded"
                value={nuevoKine.matricula_profesional}
                onChange={(e) =>
                  setNuevoKine({
                    ...nuevoKine,
                    matricula_profesional: e.target.value,
                  })
                }
                required
              />
              <input
                type="text"
                placeholder="Especialidad"
                className="border p-2 rounded"
                value={nuevoKine.especialidad}
                onChange={(e) =>
                  setNuevoKine({ ...nuevoKine, especialidad: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <PlusCircle className="w-5 h-5" /> Crear Kinesiólogo
          </button>
        </form>

        {/* 🔹 Tabla de kinesiólogos */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {kines.length === 0 ? (
            <p className="text-gray-500">No hay kinesiólogos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Nombre</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Matrícula</th>
                    <th className="p-2 border">Especialidad</th>
                    <th className="p-2 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {kines.map((k) => (
                    <tr key={k.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 border text-center">{k.id}</td>
                      <td className="p-2 border">{k.user?.nombre || "—"}</td>
                      <td className="p-2 border">{k.user?.email || "—"}</td>
                      <td className="p-2 border">
                        {k.matricula_profesional || "—"}
                      </td>
                      <td className="p-2 border">{k.especialidad || "—"}</td>
                      <td className="p-2 border">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(k)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-yellow-600"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(k.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-red-600"
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 🔹 Modal de edición */}
        <EditModal
          isOpen={editando !== null}
          onClose={() => {
            setEditando(null);
            setDatosEdicion({});
          }}
          title="Editar Kinesiólogo"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4">
            {/* Datos del Usuario */}
            <div className="border-b pb-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                📋 Datos de Usuario
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre Completo
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
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.email || ""}
                    onChange={(e) =>
                      setDatosEdicion({ ...datosEdicion, email: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Datos del Kinesiólogo */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                💼 Datos Profesionales
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Matrícula Profesional
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.matricula_profesional || ""}
                    onChange={(e) =>
                      setDatosEdicion({
                        ...datosEdicion,
                        matricula_profesional: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.especialidad || ""}
                    onChange={(e) =>
                      setDatosEdicion({
                        ...datosEdicion,
                        especialidad: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}
