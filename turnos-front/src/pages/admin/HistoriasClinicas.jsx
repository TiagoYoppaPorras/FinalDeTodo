import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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



export default function HistoriasClinicas() {
  const [searchParams] = useSearchParams();
  const pacienteIdParam = searchParams.get("paciente_id");
  const { roles } = useAuth();

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
  if (!roles.includes("admin") && !roles.includes("kinesiologo")) {
    navigate("/dashboard");
  }
}, [roles]);
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
      alert("⚠️ Paciente, Kinesiólogo y Motivo de Consulta son obligatorios");
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
        alert("✅ Historia clínica actualizada");
      } else {
        await api.post("/historias-clinicas/", payload);
        alert("✅ Historia clínica creada");
      }

      setModalAbierto(false);
      fetchDatos();
    } catch (err) {
      console.error("❌ Error guardando:", err);
      alert(err.response?.data?.detail || "Error al guardar");
    } finally {
      setIsLoadingSave(false);
    }
  };

  // ==========================================
  // ELIMINAR
  // ==========================================
  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta historia clínica?")) return;

    try {
      await api.delete(`/historias-clinicas/${id}`);
      alert("✅ Historia eliminada");
      fetchDatos();
    } catch (err) {
      console.error("❌ Error eliminando:", err);
      alert("Error al eliminar");
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600 w-8 h-8" />
            <h1 className="text-2xl font-semibold text-gray-800">
              Historias Clínicas
            </h1>
          </div>
          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5" /> Nueva Historia
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white border rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Paciente
          </label>
          <select
            className="w-full md:w-96 border border-gray-300 rounded-lg p-2"
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

        {/* Lista de Historias */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {historias.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay historias clínicas registradas
              {pacienteSeleccionado && " para este paciente"}.
            </p>
          ) : (
            <div className="space-y-4">
              {historias.map((historia) => (
                <div
                  key={historia.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header de la historia */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {new Date(historia.fecha_consulta).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
  <User className="w-4 h-4 inline mr-1" />
  Paciente: {getNombrePaciente(historia.paciente_id)}
</p>

<p className="text-sm text-gray-500">
  Kinesiólogo: {getNombreKinesiologo(historia.kinesiologo_id)}
</p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModalEditar(historia)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-yellow-600"
                      >
                        <Edit className="w-4 h-4" /> Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(historia.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Datos Vitales (si existen) */}
                  {(historia.peso || historia.presion_arterial || historia.temperatura) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 bg-blue-50 p-3 rounded">
                      {historia.peso && (
                        <div className="flex items-center gap-2">
                          <Weight className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">
                            <strong>Peso:</strong> {historia.peso} kg
                          </span>
                        </div>
                      )}
                      {historia.altura && (
                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">
                            <strong>Altura:</strong> {historia.altura} cm
                          </span>
                        </div>
                      )}
                      {historia.presion_arterial && (
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-600" />
                          <span className="text-sm">
                            <strong>Presión:</strong> {historia.presion_arterial}
                          </span>
                        </div>
                      )}
                      {historia.temperatura && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">
                            <strong>Temp:</strong> {historia.temperatura}°C
                          </span>
                        </div>
                      )}
                      {historia.frecuencia_cardiaca && (
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-green-600" />
                          <span className="text-sm">
                            <strong>FC:</strong> {historia.frecuencia_cardiaca} lpm
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contenido Clínico */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Motivo de Consulta</p>
                      <p className="text-sm text-gray-800">{historia.motivo_consulta}</p>
                    </div>

                    {historia.diagnostico && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Diagnóstico</p>
                        <p className="text-sm text-gray-800">{historia.diagnostico}</p>
                      </div>
                    )}

                    {historia.tratamiento && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Tratamiento</p>
                        <p className="text-sm text-gray-800">{historia.tratamiento}</p>
                      </div>
                    )}

                    {historia.evolucion && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Evolución</p>
                        <p className="text-sm text-gray-800">{historia.evolucion}</p>
                      </div>
                    )}

                    {historia.observaciones && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Observaciones</p>
                        <p className="text-sm text-gray-500 italic">{historia.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Creación/Edición */}
        <EditModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={editando ? "Editar Historia Clínica" : "Nueva Historia Clínica"}
          onSave={handleGuardar}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-700 mb-2">Datos Vitales</h4>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Presión (ej: 120/80)</label>
                  <input
                    type="text"
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temperatura (°C)</label>
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
