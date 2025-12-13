import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { User, PlusCircle, Trash2, Edit } from "lucide-react";
import EditModal from "../../components/common/EditModal";

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  
  // Estado para crear nuevo paciente
  const [nuevoPaciente, setNuevoPaciente] = useState({
    // Datos del usuario
    nombre: "",
    email: "",
    password: "",
    // Datos del paciente
    dni: "",
    telefono: "",
    obra_social: "",
    direccion: "",
    historial_medico: "",
  });

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // 🔹 Obtener pacientes
  const fetchPacientes = async () => {
    try {
      const res = await api.get("/pacientes/");
      setPacientes(res.data);
    } catch (err) {
      console.error("❌ Error cargando pacientes:", err);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  // 🔹 Crear paciente (primero usuario, luego paciente)
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // 1️⃣ Crear usuario primero
      const userResponse = await api.post("/auth/register", {
        nombre: nuevoPaciente.nombre,
        email: nuevoPaciente.email,
        password: nuevoPaciente.password,
      });

      // 2️⃣ Crear paciente con el user_id
      await api.post("/pacientes/", {
        user_id: userResponse.data.id,
        dni: nuevoPaciente.dni || null,
        telefono: nuevoPaciente.telefono || null,
        obra_social: nuevoPaciente.obra_social || null,
        direccion: nuevoPaciente.direccion || null,
        historial_medico: nuevoPaciente.historial_medico || null,
      });

      alert("✅ Paciente creado correctamente");
      setNuevoPaciente({
        nombre: "",
        email: "",
        password: "",
        dni: "",
        telefono: "",
        obra_social: "",
        direccion: "",
        historial_medico: "",
      });
      fetchPacientes();
    } catch (err) {
      console.error("❌ Error creando paciente:", err);
      alert("Error al crear paciente. Revisa la consola.");
    }
  };

  // 🔹 Abrir modal de edición
  const handleEdit = (paciente) => {
    setEditando(paciente.id);
    setDatosEdicion({
      // Datos del usuario
      user_id: paciente.user_id,
      nombre: paciente.user?.nombre || "",
      email: paciente.user?.email || "",
      // Datos del paciente
      dni: paciente.dni || "",
      telefono: paciente.telefono || "",
      obra_social: paciente.obra_social || "",
      direccion: paciente.direccion || "",
      historial_medico: paciente.historial_medico || "",
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

      // 2️⃣ Actualizar paciente
      await api.put(`/pacientes/${editando}`, {
        dni: datosEdicion.dni || null,
        telefono: datosEdicion.telefono || null,
        obra_social: datosEdicion.obra_social || null,
        direccion: datosEdicion.direccion || null,
        historial_medico: datosEdicion.historial_medico || null,
      });

      alert("✅ Paciente actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchPacientes();
    } catch (err) {
      console.error("❌ Error actualizando paciente:", err);
      alert("Error al actualizar paciente");
    } finally {
      setIsLoadingSave(false);
    }
  };

  // 🔹 Eliminar paciente
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar paciente? Esto también eliminará su usuario.")) return;
    try {
      await api.delete(`/pacientes/${id}`);
      fetchPacientes();
      alert("✅ Paciente eliminado");
    } catch (err) {
      console.error("Error eliminando paciente:", err);
      alert("Error al eliminar paciente");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <User className="text-blue-600 w-6 h-6" /> Gestión de Pacientes
        </h1>

        {/* 🔹 Formulario de creación */}
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 border rounded-lg shadow-sm space-y-4"
        >
          <h3 className="font-semibold text-gray-700 border-b pb-2">
            Nuevo Paciente
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
                value={nuevoPaciente.nombre}
                onChange={(e) =>
                  setNuevoPaciente({ ...nuevoPaciente, nombre: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Correo electrónico *"
                className="border p-2 rounded"
                value={nuevoPaciente.email}
                onChange={(e) =>
                  setNuevoPaciente({ ...nuevoPaciente, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Contraseña *"
                className="border p-2 rounded"
                value={nuevoPaciente.password}
                onChange={(e) =>
                  setNuevoPaciente({ ...nuevoPaciente, password: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Datos del Paciente */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600">
              🏥 Datos del Paciente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="DNI"
                className="border p-2 rounded"
                value={nuevoPaciente.dni}
                onChange={(e) =>
                  setNuevoPaciente({ ...nuevoPaciente, dni: e.target.value })
                }
              />
              <input
                type="tel"
                placeholder="Teléfono"
                className="border p-2 rounded"
                value={nuevoPaciente.telefono}
                onChange={(e) =>
                  setNuevoPaciente({ ...nuevoPaciente, telefono: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Obra Social"
                className="border p-2 rounded"
                value={nuevoPaciente.obra_social}
                onChange={(e) =>
                  setNuevoPaciente({ ...nuevoPaciente, obra_social: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Dirección"
                className="border p-2 rounded"
                value={nuevoPaciente.direccion}
                onChange={(e) =>
                  setNuevoPaciente({ ...nuevoPaciente, direccion: e.target.value })
                }
              />
              <textarea
                placeholder="Historial Médico"
                className="border p-2 rounded md:col-span-2"
                rows="3"
                value={nuevoPaciente.historial_medico}
                onChange={(e) =>
                  setNuevoPaciente({
                    ...nuevoPaciente,
                    historial_medico: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5" /> Crear Paciente
          </button>
        </form>

        {/* 🔹 Tabla de pacientes */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {pacientes.length === 0 ? (
            <p className="text-gray-500">No hay pacientes registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Nombre</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">DNI</th>
                    <th className="p-2 border">Teléfono</th>
                    <th className="p-2 border">Obra Social</th>
                    <th className="p-2 border">Historial Medico</th>
                    <th className="p-2 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 border text-center">{p.id}</td>
                      <td className="p-2 border">{p.user?.nombre || "—"}</td>
                      <td className="p-2 border">{p.user?.email || "—"}</td>
                      <td className="p-2 border">{p.dni || "—"}</td>
                      <td className="p-2 border">{p.telefono || "—"}</td>
                      <td className="p-2 border">{p.obra_social || "—"}</td>
                      <td className="p-2 border">{p.historial_medico || "—"}</td>
                      <td className="p-2 border">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(p)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-yellow-600"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
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
          title="Editar Paciente"
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

            {/* Datos del Paciente */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                🏥 Datos del Paciente
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.dni || ""}
                    onChange={(e) =>
                      setDatosEdicion({ ...datosEdicion, dni: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.telefono || ""}
                    onChange={(e) =>
                      setDatosEdicion({ ...datosEdicion, telefono: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Obra Social
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.obra_social || ""}
                    onChange={(e) =>
                      setDatosEdicion({
                        ...datosEdicion,
                        obra_social: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.direccion || ""}
                    onChange={(e) =>
                      setDatosEdicion({ ...datosEdicion, direccion: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Historial Médico
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2"
                    rows="3"
                    value={datosEdicion.historial_medico || ""}
                    onChange={(e) =>
                      setDatosEdicion({
                        ...datosEdicion,
                        historial_medico: e.target.value,
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
