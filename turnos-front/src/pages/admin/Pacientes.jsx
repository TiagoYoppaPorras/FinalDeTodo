import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Users, PlusCircle, Trash2, Edit, UserPlus, UserCheck } from "lucide-react";
import EditModal from "../../components/common/EditModal";

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para creación
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modoCreacion, setModoCreacion] = useState("nuevo"); // "nuevo" o "existente"
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    email: "",
    password: "",
    dni: "",
    telefono: "",
    obra_social: "",
    historial_medico: "",
    direccion: ""
  });
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [formExistente, setFormExistente] = useState({
    dni: "",
    telefono: "",
    obra_social: "",
    historial_medico: "",
    direccion: ""
  });

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // --- 🔹 Fetch pacientes ---
  const fetchPacientes = async () => {
    try {
      const res = await api.get("/pacientes/");
      setPacientes(res.data);
    } catch (err) {
      console.error("❌ Error cargando pacientes:", err);
    }
  };

  // --- 🔹 Fetch usuarios disponibles ---
  const fetchUsuariosDisponibles = async () => {
    try {
      const res = await api.get("/pacientes/usuarios-disponibles");
      setUsuariosDisponibles(res.data);
    } catch (err) {
      console.error("❌ Error cargando usuarios disponibles:", err);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([fetchPacientes(), fetchUsuariosDisponibles()]);
      setLoading(false);
    };
    cargarDatos();
  }, []);

  // --- 🔹 Abrir modal de creación ---
  const abrirModalCrear = () => {
    setModalCrearAbierto(true);
    setModoCreacion("nuevo");
    setFormNuevo({
      nombre: "",
      email: "",
      password: "",
      dni: "",
      telefono: "",
      obra_social: "",
      historial_medico: "",
      direccion: ""
    });
    setUsuarioSeleccionado("");
    setFormExistente({
      dni: "",
      telefono: "",
      obra_social: "",
      historial_medico: "",
      direccion: ""
    });
  };

  // --- 🔹 Crear paciente ---
  const handleCrear = async () => {
    setIsLoadingSave(true);
    try {
      if (modoCreacion === "nuevo") {
        // Crear usuario nuevo + paciente
        await api.post("/pacientes/con-usuario", formNuevo);
        alert("✅ Paciente creado correctamente");
      } else {
        // Asociar a usuario existente
        if (!usuarioSeleccionado) {
          alert("⚠️ Debes seleccionar un usuario");
          setIsLoadingSave(false);
          return;
        }
        await api.post("/pacientes/", {
          user_id: parseInt(usuarioSeleccionado),
          ...formExistente
        });
        alert("✅ Paciente asociado correctamente");
      }
      
      setModalCrearAbierto(false);
      await Promise.all([fetchPacientes(), fetchUsuariosDisponibles()]);
    } catch (err) {
      console.error("❌ Error creando paciente:", err);
      alert(err.response?.data?.detail || "Error al crear paciente");
    } finally {
      setIsLoadingSave(false);
    }
  };

  // --- 🔹 Abrir modal de edición ---
  const handleEdit = (paciente) => {
    setEditando(paciente.id);
    setDatosEdicion({
      dni: paciente.dni || "",
      telefono: paciente.telefono || "",
      obra_social: paciente.obra_social || "",
      historial_medico: paciente.historial_medico || "",
      direccion: paciente.direccion || ""
    });
  };

  // --- 🔹 Actualizar paciente ---
  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      await api.put(`/pacientes/${editando}`, datosEdicion);
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

  // --- 🔹 Eliminar paciente ---
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar paciente?")) return;
    try {
      await api.delete(`/pacientes/${id}`);
      fetchPacientes();
      fetchUsuariosDisponibles();
      alert("✅ Paciente eliminado");
    } catch (err) {
      console.error("❌ Error eliminando paciente:", err);
      alert("Error al eliminar paciente");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando pacientes...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600 w-6 h-6" /> Gestión de Pacientes
          </h1>
          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5" /> Crear Paciente
          </button>
        </div>

        {/* Tabla de pacientes */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {pacientes.length === 0 ? (
            <p className="text-gray-500">No hay pacientes registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 border">Nombre</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">DNI</th>
                    <th className="p-2 border">Teléfono</th>
                    <th className="p-2 border">Obra Social</th>
                    <th className="p-2 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 border">{p.user?.nombre || "N/A"}</td>
                      <td className="p-2 border">{p.user?.email || "N/A"}</td>
                      <td className="p-2 border">{p.dni || "-"}</td>
                      <td className="p-2 border">{p.telefono || "-"}</td>
                      <td className="p-2 border">{p.obra_social || "-"}</td>
                      <td className="p-2 border">{p.historial_medico || "-"}</td>
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

        {/* Modal de creación */}
        <EditModal
          isOpen={modalCrearAbierto}
          onClose={() => setModalCrearAbierto(false)}
          title="Crear Paciente"
          onSave={handleCrear}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4">
            {/* Selector de modo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Modo de Creación</h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modo"
                    value="nuevo"
                    checked={modoCreacion === "nuevo"}
                    onChange={(e) => setModoCreacion(e.target.value)}
                    className="w-4 h-4"
                  />
                  <UserPlus className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Crear Usuario Nuevo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modo"
                    value="existente"
                    checked={modoCreacion === "existente"}
                    onChange={(e) => setModoCreacion(e.target.value)}
                    className="w-4 h-4"
                  />
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Asociar a Usuario Existente</span>
                </label>
              </div>
            </div>

            {/* Formulario para crear usuario nuevo */}
            {modoCreacion === "nuevo" && (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="font-medium text-gray-700 mb-2">Datos del Usuario</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={formNuevo.nombre}
                      onChange={(e) => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={formNuevo.email}
                      onChange={(e) => setFormNuevo({ ...formNuevo, email: e.target.value })}
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={formNuevo.password}
                      onChange={(e) => setFormNuevo({ ...formNuevo, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="font-medium text-gray-700 mb-2">Datos del Paciente</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="DNI"
                      className="border border-gray-300 rounded-lg p-2"
                      value={formNuevo.dni}
                      onChange={(e) => setFormNuevo({ ...formNuevo, dni: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      className="border border-gray-300 rounded-lg p-2"
                      value={formNuevo.telefono}
                      onChange={(e) => setFormNuevo({ ...formNuevo, telefono: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Obra Social"
                      className="border border-gray-300 rounded-lg p-2"
                      value={formNuevo.obra_social}
                      onChange={(e) => setFormNuevo({ ...formNuevo, obra_social: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Dirección"
                      className="border border-gray-300 rounded-lg p-2"
                      value={formNuevo.direccion}
                      onChange={(e) => setFormNuevo({ ...formNuevo, direccion: e.target.value })}
                    />
                  </div>
                  <textarea
                    placeholder="Historial Médico"
                    className="w-full border border-gray-300 rounded-lg p-2 mt-3"
                    rows="3"
                    value={formNuevo.historial_medico}
                    onChange={(e) => setFormNuevo({ ...formNuevo, historial_medico: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Formulario para asociar a usuario existente */}
            {modoCreacion === "existente" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Usuario
                  </label>
                  {usuariosDisponibles.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      ⚠️ No hay usuarios con rol "paciente" disponibles.
                      <br />
                      Primero crea un usuario y asígnale el rol "paciente" desde Gestión de Usuarios.
                    </div>
                  ) : (
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={usuarioSeleccionado}
                      onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                    >
                      <option value="">-- Seleccionar --</option>
                      {usuariosDisponibles.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {usuariosDisponibles.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-gray-700 mb-2">Datos del Paciente</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="DNI"
                        className="border border-gray-300 rounded-lg p-2"
                        value={formExistente.dni}
                        onChange={(e) => setFormExistente({ ...formExistente, dni: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Teléfono"
                        className="border border-gray-300 rounded-lg p-2"
                        value={formExistente.telefono}
                        onChange={(e) => setFormExistente({ ...formExistente, telefono: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Obra Social"
                        className="border border-gray-300 rounded-lg p-2"
                        value={formExistente.obra_social}
                        onChange={(e) => setFormExistente({ ...formExistente, obra_social: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Dirección"
                        className="border border-gray-300 rounded-lg p-2"
                        value={formExistente.direccion}
                        onChange={(e) => setFormExistente({ ...formExistente, direccion: e.target.value })}
                      />
                    </div>
                    <textarea
                      placeholder="Historial Médico"
                      className="w-full border border-gray-300 rounded-lg p-2 mt-3"
                      rows="3"
                      value={formExistente.historial_medico}
                      onChange={(e) => setFormExistente({ ...formExistente, historial_medico: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </EditModal>

        {/* Modal de edición */}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.dni || ""}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, dni: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.telefono || ""}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, telefono: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Obra Social</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.obra_social || ""}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, obra_social: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.direccion || ""}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, direccion: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Historial Médico</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2"
                rows="4"
                value={datosEdicion.historial_medico || ""}
                onChange={(e) => setDatosEdicion({ ...datosEdicion, historial_medico: e.target.value })}
              />
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}