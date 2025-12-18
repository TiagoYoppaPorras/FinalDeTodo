import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import DataTable from "../../components/common/DataTable";
import EditModal from "../../components/common/EditModal"; 
import { Users, PlusCircle, Trash2, Edit, UserPlus, UserCheck, FileText, AlertCircle } from "lucide-react";
import { alertaExito, alertaError, confirmarAccion } from "../../utils/alerts";

// 🔴 CORRECCIÓN: Definido FUERA del componente principal para evitar re-renderizados
const InputConError = ({ label, value, onChange, error, type = "text", placeholder = "" }) => (
    <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <div className="relative">
            <input 
                type={type} 
                className={`w-full border rounded-lg p-2 outline-none transition-colors
                    ${error ? "border-red-500 bg-red-50 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                value={value} 
                onChange={onChange}
                placeholder={placeholder}
            />
            {error && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
            )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
);

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estado para manejar errores por campo
  const [errores, setErrores] = useState({});

  // Estados para creación
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modoCreacion, setModoCreacion] = useState("nuevo");
  const [formNuevo, setFormNuevo] = useState({
    nombre: "", email: "", password: "", dni: "", telefono: "", obra_social: "", historial_medico: "", direccion: ""
  });
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [formExistente, setFormExistente] = useState({
    dni: "", telefono: "", obra_social: "", historial_medico: "", direccion: ""
  });

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // --- Fetch Data ---
  const fetchPacientes = async () => {
    try {
      const res = await api.get("/pacientes/");
      setPacientes(res.data);
    } catch (err) {
      console.error("❌ Error cargando pacientes:", err);
    }
  };

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

  // Helper para limpiar errores al escribir
  const handleChangeNuevo = (campo, valor) => {
    setFormNuevo(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: null }));
  };
  
  const handleChangeEdicion = (campo, valor) => {
    setDatosEdicion(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: null }));
  };

  // Lógica para mapear el mensaje del Backend al input correcto
  const procesarErrorBackend = (err) => {
    const mensaje = err.response?.data?.detail || "Error desconocido";
    const nuevosErrores = {};

    // Analizamos el texto para saber a qué input ponerle el borde rojo
    if (typeof mensaje === 'string') {
        if (mensaje.includes("DNI")) nuevosErrores.dni = mensaje;
        else if (mensaje.includes("email")) nuevosErrores.email = mensaje;
        else if (mensaje.includes("teléfono") || mensaje.includes("telefono")) nuevosErrores.telefono = mensaje;
        else {
            alertaError(mensaje); 
            return;
        }
    } else {
        alertaError("Ocurrió un error inesperado.");
        return;
    }
    
    setErrores(nuevosErrores);
  };

  // --- Handlers ---
  const abrirModalCrear = () => {
    setModalCrearAbierto(true);
    setModoCreacion("nuevo");
    setErrores({});
    setFormNuevo({ nombre: "", email: "", password: "", dni: "", telefono: "", obra_social: "", historial_medico: "", direccion: "" });
    setUsuarioSeleccionado("");
    setFormExistente({ dni: "", telefono: "", obra_social: "", historial_medico: "", direccion: "" });
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setIsLoadingSave(true);
    setErrores({});

    try {
      if (modoCreacion === "nuevo") {
        await api.post("/pacientes/con-usuario", formNuevo);
        alertaExito("Paciente creado correctamente");
      } else {
        if (!usuarioSeleccionado) {
          alertaError("Debes seleccionar un usuario");
          setIsLoadingSave(false);
          return;
        }
        await api.post("/pacientes/", { user_id: parseInt(usuarioSeleccionado), ...formExistente });
        alertaExito("Paciente asociado correctamente");
      }
      setModalCrearAbierto(false);
      await Promise.all([fetchPacientes(), fetchUsuariosDisponibles()]);
    } catch (err) {
      console.error("❌ Error creando paciente:", err);
      procesarErrorBackend(err);
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleEdit = (paciente) => {
    setEditando(paciente.id);
    setErrores({});
    setDatosEdicion({
      dni: paciente.dni || "",
      telefono: paciente.telefono || "",
      obra_social: paciente.obra_social || "",
      historial_medico: paciente.historial_medico || "",
      direccion: paciente.direccion || ""
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoadingSave(true);
    setErrores({});

    try {
      await api.put(`/pacientes/${editando}`, datosEdicion);
      alertaExito("Paciente actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchPacientes();
    } catch (err) {
      console.error("❌ Error actualizando paciente:", err);
      procesarErrorBackend(err);
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmado = await confirmarAccion("¿Eliminar paciente?", "Esta acción no se puede deshacer.");
    if (!confirmado) return;

    try {
      await api.delete(`/pacientes/${item.id}`);
      fetchPacientes();
      fetchUsuariosDisponibles();
      alertaExito("Paciente eliminado");
    } catch (err) {
      console.error("❌ Error eliminando paciente:", err);
      alertaError("Error al eliminar paciente");
    }
  };

  const columns = [
    { 
      key: "nombre", 
      label: "Nombre", 
      render: (item) => <span className="font-medium">{item.user?.nombre || "N/A"}</span> 
    },
    { 
      key: "email", 
      label: "Email", 
      render: (item) => <span className="text-gray-500">{item.user?.email || "N/A"}</span> 
    },
    { key: "dni", label: "DNI" },
    { key: "telefono", label: "Teléfono" },
    { key: "obra_social", label: "Obra Social" },
    { 
      key: "acciones", 
      label: "Acciones", 
      render: (item) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <button onClick={() => handleEdit(item)} className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600 transition" title="Editar">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(`/historias-clinicas?paciente_id=${item.id}`)} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition" title="Ver Historias Clínicas">
            <FileText className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600 flex justify-center">Cargando datos...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6"> 
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600 w-6 h-6" /> Gestión de Pacientes
          </h1>
          <button onClick={abrirModalCrear} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto">
            <PlusCircle className="w-5 h-5" /> Crear Paciente
          </button>
        </div>

        <DataTable data={pacientes} columns={columns} emptyMessage="No hay pacientes registrados." />

        {/* 🟢 MODAL DE CREACIÓN ACTUALIZADO */}
        <EditModal
          isOpen={modalCrearAbierto}
          onClose={() => setModalCrearAbierto(false)}
          title="Crear Paciente"
          onSave={handleCrear}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Modo de Creación</h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="modo" value="nuevo" checked={modoCreacion === "nuevo"} onChange={(e) => setModoCreacion(e.target.value)} className="w-4 h-4" />
                  <UserPlus className="w-5 h-5 text-green-600" /> <span className="text-sm font-medium">Usuario Nuevo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="modo" value="existente" checked={modoCreacion === "existente"} onChange={(e) => setModoCreacion(e.target.value)} className="w-4 h-4" />
                  <UserCheck className="w-5 h-5 text-blue-600" /> <span className="text-sm font-medium">Usuario Existente</span>
                </label>
              </div>
            </div>

            {modoCreacion === "nuevo" && (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="font-medium text-gray-700 mb-2">Datos del Usuario</h5>
                  <div className="space-y-3">
                    <InputConError placeholder="Nombre completo" value={formNuevo.nombre} onChange={(e) => handleChangeNuevo("nombre", e.target.value)} error={errores.nombre} />
                    <InputConError placeholder="Email" type="email" value={formNuevo.email} onChange={(e) => handleChangeNuevo("email", e.target.value)} error={errores.email} />
                    <InputConError placeholder="Contraseña" type="password" value={formNuevo.password} onChange={(e) => handleChangeNuevo("password", e.target.value)} error={errores.password} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="font-medium text-gray-700 mb-2">Datos Personales</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputConError placeholder="DNI" value={formNuevo.dni} onChange={(e) => handleChangeNuevo("dni", e.target.value)} error={errores.dni} />
                    <InputConError placeholder="Teléfono" value={formNuevo.telefono} onChange={(e) => handleChangeNuevo("telefono", e.target.value)} error={errores.telefono} />
                    <InputConError placeholder="Obra Social" value={formNuevo.obra_social} onChange={(e) => handleChangeNuevo("obra_social", e.target.value)} error={errores.obra_social} />
                    <InputConError placeholder="Dirección" value={formNuevo.direccion} onChange={(e) => handleChangeNuevo("direccion", e.target.value)} error={errores.direccion} />
                  </div>
                  <textarea placeholder="Historial Médico" className="w-full border border-gray-300 rounded-lg p-2 mt-3" rows="3" value={formNuevo.historial_medico} onChange={(e) => setFormNuevo({ ...formNuevo, historial_medico: e.target.value })} />
                </div>
              </>
            )}

            {modoCreacion === "existente" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Usuario</label>
                  {usuariosDisponibles.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">⚠️ No hay usuarios disponibles.</div>
                  ) : (
                    <select className="w-full border border-gray-300 rounded-lg p-2" value={usuarioSeleccionado} onChange={(e) => setUsuarioSeleccionado(e.target.value)}>
                      <option value="">-- Seleccionar --</option>
                      {usuariosDisponibles.map((u) => <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>)}
                    </select>
                  )}
                </div>
                {usuariosDisponibles.length > 0 && (
                   <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <h5 className="font-medium text-gray-700 mb-2">Datos Personales</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputConError placeholder="DNI" value={formExistente.dni} onChange={(e) => setFormExistente({...formExistente, dni: e.target.value})} error={errores.dni} />
                        <InputConError placeholder="Teléfono" value={formExistente.telefono} onChange={(e) => setFormExistente({...formExistente, telefono: e.target.value})} error={errores.telefono} />
                        <input type="text" placeholder="Obra Social" className="border border-gray-300 rounded-lg p-2" value={formExistente.obra_social} onChange={(e) => setFormExistente({ ...formExistente, obra_social: e.target.value })} />
                        <input type="text" placeholder="Dirección" className="border border-gray-300 rounded-lg p-2" value={formExistente.direccion} onChange={(e) => setFormExistente({ ...formExistente, direccion: e.target.value })} />
                    </div>
                   </div>
                )}
              </>
            )}
          </div>
        </EditModal>

        {/* 🟢 MODAL DE EDICIÓN ACTUALIZADO */}
        <EditModal
          isOpen={editando !== null}
          onClose={() => { setEditando(null); setDatosEdicion({}); setErrores({}); }}
          title="Editar Paciente"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputConError label="DNI" value={datosEdicion.dni || ""} onChange={(e) => handleChangeEdicion("dni", e.target.value)} error={errores.dni} />
              <InputConError label="Teléfono" value={datosEdicion.telefono || ""} onChange={(e) => handleChangeEdicion("telefono", e.target.value)} error={errores.telefono} />
              <InputConError label="Obra Social" value={datosEdicion.obra_social || ""} onChange={(e) => handleChangeEdicion("obra_social", e.target.value)} error={errores.obra_social} />
              <InputConError label="Dirección" value={datosEdicion.direccion || ""} onChange={(e) => handleChangeEdicion("direccion", e.target.value)} error={errores.direccion} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Historial Médico</label>
              <textarea className="w-full border border-gray-300 rounded-lg p-2" rows="4" value={datosEdicion.historial_medico || ""} onChange={(e) => setDatosEdicion({ ...datosEdicion, historial_medico: e.target.value })} />
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}