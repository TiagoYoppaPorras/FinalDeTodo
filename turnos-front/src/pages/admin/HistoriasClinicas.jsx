import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; 
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { 
  FileText, 
  PlusCircle, 
  Edit, 
  Trash2, 
  User,
  Calendar,
  Activity,
  Heart,
  Thermometer,
  Weight,
  Ruler
} from "lucide-react";
import EditModal from "../../components/common/EditModal";
import { useAuth } from "../../context/AuthContext";
// 👇 Importamos las alertas
import { alertaExito, alertaError, confirmarAccion } from "../../utils/alerts";

export default function HistoriasClinicas() {
  const [searchParams] = useSearchParams();
  const pacienteIdParam = searchParams.get("paciente_id");
  const { roles } = useAuth();
  const navigate = useNavigate(); 

  const [historias, setHistorias] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [kinesiologos, setKinesiologos] = useState([]);
  const [loading, setLoading] = useState(true);

  const getNombrePaciente = (id) => {
    const p = pacientes.find(p => p.id === id);
    return p?.user?.nombre || "N/A";
  };

  const getNombreKinesiologo = (id) => {
    const k = kinesiologos.find(k => k.id === id);
    return k?.user?.nombre || "N/A";
  };

  // Estados para creación/edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // Filtros
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(pacienteIdParam || "");

  // Formulario
  const [formData, setFormData] = useState({
    paciente_id: pacienteIdParam || "",
    kinesiologo_id: "",
    peso: "",
    altura: "",
    presion_arterial: "",
    frecuencia_cardiaca: "",
    temperatura: "",
    motivo_consulta: "",
    diagnostico: "",
    tratamiento: "",
    evolucion: "",
    observaciones: "",
  });

  // ==========================================
  // FETCH DATOS
  // ==========================================
  useEffect(() => {
    fetchDatos();
  }, []);

  useEffect(() => {
    // Validación de seguridad
    if (roles.length > 0 && !roles.includes("admin") && !roles.includes("kinesiologo")) {
      navigate("/dashboard");
    }
  }, [roles, navigate]);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [resPacientes, resKines] = await Promise.all([
        api.get("/pacientes/"),
        api.get("/kinesiologos/"),
      ]);
      
      setPacientes(resPacientes.data);
      setKinesiologos(resKines.data);

      // Si hay paciente seleccionado, cargar sus historias
      if (pacienteSeleccionado) {
        const resHistorias = await api.get(`/historias-clinicas/paciente/${pacienteSeleccionado}`);
        setHistorias(resHistorias.data);
      } else {
        const resHistorias = await api.get("/historias-clinicas/");
        setHistorias(resHistorias.data);
      }
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CAMBIAR FILTRO DE PACIENTE
  // ==========================================
  const handleCambiarPaciente = async (pacienteId) => {
    setPacienteSeleccionado(pacienteId);
    
    if (pacienteId) {
      try {
        const res = await api.get(`/historias-clinicas/paciente/${pacienteId}`);
        setHistorias(res.data);
      } catch (err) {
        console.error("❌ Error:", err);
      }
    } else {
      fetchDatos();
    }
  };

  // ==========================================
  // ABRIR MODAL CREAR
  // ==========================================
  const abrirModalCrear = () => {
    setEditando(null);
    setFormData({
      paciente_id: pacienteSeleccionado || "",
      kinesiologo_id: "",
      peso: "",
      altura: "",
      presion_arterial: "",
      frecuencia_cardiaca: "",
      temperatura: "",
      motivo_consulta: "",
      diagnostico: "",
      tratamiento: "",
      evolucion: "",
      observaciones: "",
    });
    setModalAbierto(true);
  };

  // ==========================================
  // ABRIR MODAL EDITAR
  // ==========================================
  const abrirModalEditar = (historia) => {
    setEditando(historia.id);
    setFormData({
      paciente_id: historia.paciente_id,
      kinesiologo_id: historia.kinesiologo_id,
      peso: historia.peso || "",
      altura: historia.altura || "",
      presion_arterial: historia.presion_arterial || "",
      frecuencia_cardiaca: historia.frecuencia_cardiaca || "",
      temperatura: historia.temperatura || "",
      motivo_consulta: historia.motivo_consulta || "",
      diagnostico: historia.diagnostico || "",
      tratamiento: historia.tratamiento || "",
      evolucion: historia.evolucion || "",
      observaciones: historia.observaciones || "",
    });
    setModalAbierto(true);
  };

  // ==========================================
  // GUARDAR (CREAR O ACTUALIZAR)
  // ==========================================
  const handleGuardar = async () => {
    setIsLoadingSave(true);

    // Validación
    if (!formData.paciente_id || !formData.kinesiologo_id || !formData.motivo_consulta) {
      alertaError("Paciente, Kinesiólogo y Motivo de Consulta son obligatorios"); // ✨
      setIsLoadingSave(false);
      return;
    }

    try {
      // Preparar payload (convertir vacíos a null)
      const payload = {
        ...formData,
        paciente_id: parseInt(formData.paciente_id),
        kinesiologo_id: parseInt(formData.kinesiologo_id),
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        frecuencia_cardiaca: formData.frecuencia_cardiaca ? parseInt(formData.frecuencia_cardiaca) : null,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        presion_arterial: formData.presion_arterial || null,
        diagnostico: formData.diagnostico || null,
        tratamiento: formData.tratamiento || null,
        evolucion: formData.evolucion || null,
        observaciones: formData.observaciones || null,
      };

      if (editando) {
        await api.put(`/historias-clinicas/${editando}`, payload);
        alertaExito("Historia clínica actualizada"); // ✨
      } else {
        await api.post("/historias-clinicas/", payload);
        alertaExito("Historia clínica creada"); // ✨
      }

      setModalAbierto(false);
      fetchDatos();
    } catch (err) {
      console.error("❌ Error guardando:", err);
      alertaError(err.response?.data?.detail || "Error al guardar"); // ✨
    } finally {
      setIsLoadingSave(false);
    }
  };

  // ==========================================
  // ELIMINAR
  // ==========================================
  const handleEliminar = async (id) => {
    const confirmado = await confirmarAccion("¿Eliminar historia?", "Esta acción no se puede deshacer."); // ✨
    if (!confirmado) return;

    try {
      await api.delete(`/historias-clinicas/${id}`);
      alertaExito("Historia eliminada"); // ✨
      fetchDatos();
    } catch (err) {
      console.error("❌ Error eliminando:", err);
      alertaError("Error al eliminar"); // ✨
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando historias clínicas...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Responsive */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600 w-8 h-8" />
            <h1 className="text-2xl font-semibold text-gray-800">
              Historias Clínicas
            </h1>
          </div>
          <button
            onClick={abrirModalCrear}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" /> Nueva Historia
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Paciente
          </label>
          <select
            className="w-full md:w-96 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={pacienteSeleccionado}
            onChange={(e) => handleCambiarPaciente(e.target.value)}
          >
            <option value="">-- Todos los pacientes --</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.user?.nombre || "Sin nombre"} {p.dni ? `(DNI: ${p.dni})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Lista de Historias (Grid Responsive) */}
        {historias.length === 0 ? (
          <div className="bg-white border rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">
              No hay historias clínicas registradas
              {pacienteSeleccionado && " para este paciente"}.
            </p>
          </div>
        ) : (
          /* 🔹 GRID: 1 col móvil, 2 col tablet, 3 col desktop */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {historias.map((historia) => (
              <div
                key={historia.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
              >
                {/* Header de la Card */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-bold text-lg text-blue-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(historia.fecha_consulta).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        })}
                    </p>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p className="flex items-center gap-1">
                            <User className="w-3 h-3" /> Paciente: <span className="font-medium">{getNombrePaciente(historia.paciente_id)}</span>
                        </p>
                        <p className="flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Kinesiólogo: <span className="font-medium">{getNombreKinesiologo(historia.kinesiologo_id)}</span>
                        </p>
                    </div>
                  </div>
                  
                  {/* Botones de acción compactos */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirModalEditar(historia)}
                      className="bg-yellow-100 text-yellow-700 p-2 rounded hover:bg-yellow-200 transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(historia.id)}
                      className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Datos Vitales (Tags) */}
                {(historia.peso || historia.presion_arterial || historia.temperatura) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {historia.peso && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100">
                        <Weight className="w-3 h-3" /> {historia.peso} kg
                      </span>
                    )}
                    {historia.presion_arterial && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full font-medium border border-red-100">
                        <Heart className="w-3 h-3" /> {historia.presion_arterial}
                      </span>
                    )}
                    {historia.temperatura && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full font-medium border border-orange-100">
                        <Thermometer className="w-3 h-3" /> {historia.temperatura}°C
                      </span>
                    )}
                  </div>
                )}

                {/* Contenido Clínico */}
                <div className="space-y-3 text-sm flex-1">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo</p>
                    <p className="text-gray-800 break-words">{historia.motivo_consulta}</p>
                  </div>

                  {historia.diagnostico && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnóstico</p>
                      <p className="text-gray-800 break-words">{historia.diagnostico}</p>
                    </div>
                  )}

                  {historia.tratamiento && (
                    <div className="bg-green-50 p-2 rounded border border-green-100">
                      <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Tratamiento</p>
                      <p className="text-green-900 break-words">{historia.tratamiento}</p>
                    </div>
                  )}
                </div>
                
                {/* Footer Tarjeta (Observaciones) */}
                {historia.observaciones && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 italic break-words">"{historia.observaciones}"</p>
                    </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de Creación/Edición */}
        <EditModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={editando ? "Editar Historia Clínica" : "Nueva Historia Clínica"}
          onSave={handleGuardar}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            {/* Paciente y Kinesiólogo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paciente *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.paciente_id}
                  onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user?.nombre || "Sin nombre"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kinesiólogo *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.kinesiologo_id}
                  onChange={(e) => setFormData({ ...formData, kinesiologo_id: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {kinesiologos.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.user?.nombre || "Sin nombre"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Datos Vitales */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Datos Vitales
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.altura}
                    onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Presión</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.presion_arterial}
                    onChange={(e) => setFormData({ ...formData, presion_arterial: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">FC (lpm)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.frecuencia_cardiaca}
                    onChange={(e) => setFormData({ ...formData, frecuencia_cardiaca: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.temperatura}
                    onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Evaluación Clínica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de Consulta *
              </label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-2"
                value={formData.motivo_consulta}
                onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-2"
                value={formData.diagnostico}
                onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento</label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-2"
                value={formData.tratamiento}
                onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evolución</label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-2"
                value={formData.evolucion}
                onChange={(e) => setFormData({ ...formData, evolucion: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-2"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}