import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Stethoscope, PlusCircle, Trash2, Edit, UserPlus, UserCheck } from "lucide-react";
import EditModal from "../../components/common/EditModal";
import DataTable from "../../components/common/DataTable"; // 👈 Importamos el componente responsive

export default function Kinesiologos() {
  const [kinesiologos, setKinesiologos] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para creación
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modoCreacion, setModoCreacion] = useState("nuevo"); // "nuevo" o "existente"
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    email: "",
    password: "",
    matricula_profesional: "",
    especialidad: ""
  });
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [formExistente, setFormExistente] = useState({
    matricula_profesional: "",
    especialidad: ""
  });

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // --- 🔹 Fetch kinesiólogos ---
  const fetchKinesiologos = async () => {
    try {
      const res = await api.get("/kinesiologos/");
      setKinesiologos(res.data);
    } catch (err) {
      console.error("❌ Error cargando kinesiólogos:", err);
    }
  };

  // --- 🔹 Fetch usuarios disponibles ---
  const fetchUsuariosDisponibles = async () => {
    try {
      const res = await api.get("/kinesiologos/usuarios-disponibles");
      setUsuariosDisponibles(res.data);
    } catch (err) {
      console.error("❌ Error cargando usuarios disponibles:", err);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([fetchKinesiologos(), fetchUsuariosDisponibles()]);
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
      matricula_profesional: "",
      especialidad: ""
    });
    setUsuarioSeleccionado("");
    setFormExistente({
      matricula_profesional: "",
      especialidad: ""
    });
  };

  // --- 🔹 Crear kinesiólogo ---
  const handleCrear = async () => {
    setIsLoadingSave(true);
    try {
      if (modoCreacion === "nuevo") {
        // Validar matrícula
        if (!formNuevo.matricula_profesional) {
          alert("⚠️ La matrícula profesional es obligatoria");
          setIsLoadingSave(false);
          return;
        }

        // Crear usuario nuevo + kinesiólogo
        await api.post("/kinesiologos/con-usuario", formNuevo);
        alert("✅ Kinesiólogo creado correctamente");
      } else {
        // Asociar a usuario existente
        if (!usuarioSeleccionado) {
          alert("⚠️ Debes seleccionar un usuario");
          setIsLoadingSave(false);
          return;
        }

        if (!formExistente.matricula_profesional) {
          alert("⚠️ La matrícula profesional es obligatoria");
          setIsLoadingSave(false);
          return;
        }

        await api.post("/kinesiologos/", {
          user_id: parseInt(usuarioSeleccionado),
          ...formExistente
        });
        alert("✅ Kinesiólogo asociado correctamente");
      }
      
      setModalCrearAbierto(false);
      await Promise.all([fetchKinesiologos(), fetchUsuariosDisponibles()]);
    } catch (err) {
      console.error("❌ Error creando kinesiólogo:", err);
      alert(err.response?.data?.detail || "Error al crear kinesiólogo");
    } finally {
      setIsLoadingSave(false);
    }
  };

  // --- 🔹 Abrir modal de edición ---
  const handleEdit = (kinesiologo) => {
    setEditando(kinesiologo.id);
    setDatosEdicion({
      matricula_profesional: kinesiologo.matricula_profesional || "",
      especialidad: kinesiologo.especialidad || ""
    });
  };

  // --- 🔹 Actualizar kinesiólogo ---
  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      if (!datosEdicion.matricula_profesional) {
        alert("⚠️ La matrícula profesional es obligatoria");
        setIsLoadingSave(false);
        return;
      }

      await api.put(`/kinesiologos/${editando}`, datosEdicion);
      alert("✅ Kinesiólogo actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchKinesiologos();
    } catch (err) {
      console.error("❌ Error actualizando kinesiólogo:", err);
      alert("Error al actualizar kinesiólogo");
    } finally {
      setIsLoadingSave(false);
    }
  };

  // --- 🔹 Eliminar kinesiólogo ---
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar kinesiólogo?")) return;
    try {
      await api.delete(`/kinesiologos/${id}`);
      fetchKinesiologos();
      fetchUsuariosDisponibles();
      alert("✅ Kinesiólogo eliminado");
    } catch (err) {
      console.error("❌ Error eliminando kinesiólogo:", err);
      alert("Error al eliminar kinesiólogo");
    }
  };

  // 🔹 DEFINICIÓN DE COLUMNAS PARA DATATABLE
  const columns = [
    { 
      key: "nombre", 
      label: "Nombre", 
      render: (k) => k.user?.nombre || "N/A" 
    },
    { 
      key: "email", 
      label: "Email", 
      render: (k) => k.user?.email || "N/A" 
    },
    { 
      key: "matricula", 
      label: "Matrícula", 
      render: (k) => (
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
          {k.matricula_profesional}
        </span>
      )
    },
    { key: "especialidad", label: "Especialidad", render: (k) => k.especialidad || "-" },
    { 
      key: "acciones", 
      label: "Acciones", 
      render: (k) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <button
            onClick={() => handleEdit(k)}
            className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(k.id)}
            className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando kinesiólogos...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Stethoscope className="text-green-600 w-6 h-6" /> Gestión de Kinesiólogos
          </h1>
          <button
            onClick={abrirModalCrear}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <PlusCircle className="w-5 h-5" /> Crear Kinesiólogo
          </button>
        </div>

        {/* 🔹 TABLA RESPONSIVE */}
        <DataTable 
          data={kinesiologos} 
          columns={columns} 
          emptyMessage="No hay kinesiólogos registrados." 
        />

        {/* Modal de creación */}
        <EditModal
          isOpen={modalCrearAbierto}
          onClose={() => setModalCrearAbierto(false)}
          title="Crear Kinesiólogo"
          onSave={handleCrear}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            {/* Selector de modo */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Modo de Creación</h4>
              <div className="flex flex-col sm:flex-row gap-4">
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
                      placeholder="Nombre completo *"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={formNuevo.nombre}
                      onChange={(e) => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={formNuevo.email}
                      onChange={(e) => setFormNuevo({ ...formNuevo, email: e.target.value })}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Contraseña *"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={formNuevo.password}
                      onChange={(e) => setFormNuevo({ ...formNuevo, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="font-medium text-gray-700 mb-2">Datos Profesionales</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Matrícula Profesional *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: KN-12345"
                        className="w-full border border-gray-300 rounded-lg p-2"
                        value={formNuevo.matricula_profesional}
                        onChange={(e) => setFormNuevo({ ...formNuevo, matricula_profesional: e.target.value })}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">⚠️ Campo obligatorio</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Especialidad (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Traumatología, Neurología, etc."
                        className="w-full border border-gray-300 rounded-lg p-2"
                        value={formNuevo.especialidad}
                        onChange={(e) => setFormNuevo({ ...formNuevo, especialidad: e.target.value })}
                      />
                    </div>
                  </div>
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
                      ⚠️ No hay usuarios con rol "kinesiologo" disponibles.
                      <br />
                      Primero crea un usuario y asígnale el rol "kinesiologo" desde Gestión de Usuarios.
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
                    <h5 className="font-medium text-gray-700 mb-2">Datos Profesionales</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Matrícula Profesional *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: KN-12345"
                          className="w-full border border-gray-300 rounded-lg p-2"
                          value={formExistente.matricula_profesional}
                          onChange={(e) => setFormExistente({ ...formExistente, matricula_profesional: e.target.value })}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">⚠️ Campo obligatorio</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Especialidad (opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Traumatología, Neurología, etc."
                          className="w-full border border-gray-300 rounded-lg p-2"
                          value={formExistente.especialidad}
                          onChange={(e) => setFormExistente({ ...formExistente, especialidad: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Nota informativa */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> {modoCreacion === "nuevo" 
                  ? "Este modo crea el usuario y asigna automáticamente el rol 'kinesiologo'." 
                  : "Este modo es útil cuando ya creaste el usuario y le asignaste el rol 'kinesiologo'."}
              </p>
            </div>
          </div>
        </EditModal>

        {/* Modal de edición */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matrícula Profesional *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={datosEdicion.matricula_profesional || ""}
                onChange={(e) => setDatosEdicion({ ...datosEdicion, matricula_profesional: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">⚠️ Campo obligatorio</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={datosEdicion.especialidad || ""}
                onChange={(e) => setDatosEdicion({ ...datosEdicion, especialidad: e.target.value })}
                placeholder="Ej: Traumatología, Neurología, etc."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Nota:</strong> Para cambiar el nombre o email del profesional, edítalo desde Gestión de Usuarios.
              </p>
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}