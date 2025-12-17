import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import DataTable from "../../components/common/DataTable";
import { CalendarDays, PlusCircle, Edit, Trash2, CheckCircle, XCircle, FileText } from "lucide-react";
import EditModal from "../../components/common/EditModal";
import { useNavigate } from "react-router-dom";

export default function Turnos() {
  const [turnos, setTurnos] = useState([]);
  const [nuevoTurno, setNuevoTurno] = useState({
    paciente_id: "", kinesiologo_id: "", servicio_id: "", sala_id: "", fecha: "", hora: "", motivo: "",
  });

  const [pacientes, setPacientes] = useState([]);
  const [kines, setKines] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  const fetchData = async () => {
    try {
      const [resTurnos, resPac, resKine, resServ, resSalas] = await Promise.all([
        api.get("/turnos/"),
        api.get("/pacientes/"),
        api.get("/kinesiologos/"),
        api.get("/servicios/"),
        api.get("/salas/"),
      ]);

      // 🔹 MODIFICACIÓN: Ordenar por ID descendente (el ID más alto es el último creado)
      const turnosOrdenados = resTurnos.data.sort((a, b) => b.id - a.id);
      
      setTurnos(turnosOrdenados);
      setPacientes(resPac.data);
      setKines(resKine.data);
      setServicios(resServ.data);
      setSalas(resSalas.data);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers (Crear, Editar, Borrar, Cambiar Estado) ---
  const handleCrearTurno = async (e) => {
    e.preventDefault();
    if (!nuevoTurno.paciente_id || !nuevoTurno.kinesiologo_id) {
      alert("Debe seleccionar un paciente y un kinesiólogo");
      return;
    }
    try {
      const payload = {
        fecha: nuevoTurno.fecha,
        hora_inicio: nuevoTurno.hora,
        hora_fin: nuevoTurno.hora,
        estado: "pendiente",
        motivo: nuevoTurno.motivo,
        observaciones: "",
        paciente_id: parseInt(nuevoTurno.paciente_id),
        kinesiologo_id: parseInt(nuevoTurno.kinesiologo_id),
        servicio_id: parseInt(nuevoTurno.servicio_id || 0),
        sala_id: parseInt(nuevoTurno.sala_id || 0),
      };
      await api.post("/turnos/", payload);
      alert("✅ Turno creado correctamente");
      setNuevoTurno({ paciente_id: "", kinesiologo_id: "", servicio_id: "", sala_id: "", fecha: "", hora: "", motivo: "" });
      fetchData();
    } catch (err) {
      console.error("❌ Error al crear turno:", err);
      alert("Error al crear turno");
    }
  };

  const handleEdit = (turno) => {
    setEditando(turno.id);
    setDatosEdicion({
      paciente_id: turno.paciente_id,
      kinesiologo_id: turno.kinesiologo_id,
      servicio_id: turno.servicio_id || "",
      sala_id: turno.sala_id || "",
      fecha: turno.fecha,
      hora_inicio: turno.hora_inicio?.slice(0, 5) || "",
      hora_fin: turno.hora_fin?.slice(0, 5) || "",
      estado: turno.estado,
      motivo: turno.motivo || "",
      observaciones: turno.observaciones || "",
    });
  };

  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      const payload = {
        paciente_id: parseInt(datosEdicion.paciente_id),
        kinesiologo_id: parseInt(datosEdicion.kinesiologo_id),
        servicio_id: datosEdicion.servicio_id ? parseInt(datosEdicion.servicio_id) : null,
        sala_id: datosEdicion.sala_id ? parseInt(datosEdicion.sala_id) : null,
        fecha: datosEdicion.fecha,
        hora_inicio: datosEdicion.hora_inicio,
        hora_fin: datosEdicion.hora_fin,
        estado: datosEdicion.estado,
        motivo: datosEdicion.motivo,
        observaciones: datosEdicion.observaciones,
      };
      await api.put(`/turnos/${editando}`, payload);
      alert("✅ Turno actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchData();
    } catch (err) {
      console.error("❌ Error actualizando turno:", err);
      alert("Error al actualizar turno");
    } finally {
      setIsLoadingSave(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/turnos/${id}/estado?estado=${nuevoEstado}`);
      fetchData();
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  const eliminarTurno = async (item) => {
    if (!confirm("¿Eliminar turno?")) return;
    try {
      await api.delete(`/turnos/${item.id}`);
      fetchData();
    } catch (err) {
      console.error("Error al eliminar turno:", err);
    }
  };

  // 🔹 DEFINICIÓN DE COLUMNAS PARA DATATABLE
  const columns = [
    { key: "id", label: "ID", render: (t) => <span className="text-gray-500">#{t.id}</span> },
    { key: "paciente", label: "Paciente", render: (t) => t.paciente?.user?.nombre || "—" },
    { key: "kinesiologo", label: "Kinesiólogo", render: (t) => t.kinesiologo?.user?.nombre || "—" },
    { key: "servicio", label: "Servicio", render: (t) => t.servicio?.nombre || "—" },
    { key: "sala", label: "Sala", render: (t) => t.sala?.nombre || "—" },
    { key: "fecha", label: "Fecha" },
    { key: "hora", label: "Hora", render: (t) => t.hora_inicio?.slice(0, 5) || "—" },
    { 
      key: "estado", 
      label: "Estado", 
      render: (t) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
          ${t.estado === 'confirmado' ? 'bg-green-100 text-green-700' : 
            t.estado === 'cancelado' ? 'bg-red-100 text-red-700' : 
            'bg-yellow-100 text-yellow-700'}`}>
          {t.estado}
        </span>
      )
    },
    { 
      key: "acciones", 
      label: "Acciones", 
      render: (t) => (
        <div className="flex gap-2 justify-end md:justify-start">
            <button onClick={() => handleEdit(t)} className="bg-yellow-100 text-yellow-700 p-1.5 rounded hover:bg-yellow-200" title="Editar">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => cambiarEstado(t.id, "confirmado")} className="bg-green-100 text-green-700 p-1.5 rounded hover:bg-green-200" title="Confirmar">
              <CheckCircle className="w-4 h-4" />
            </button>
            <button onClick={() => cambiarEstado(t.id, "cancelado")} className="bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200" title="Cancelar">
              <XCircle className="w-4 h-4" />
            </button>
            <button onClick={() => eliminarTurno(t)} className="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200" title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando turnos...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Gestión de Turnos
        </h1>

        {/* Formulario nuevo turno */}
        <form onSubmit={handleCrearTurno} className="bg-white border rounded-lg shadow-sm p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="border p-2 rounded w-full" value={nuevoTurno.paciente_id} onChange={(e) => setNuevoTurno({ ...nuevoTurno, paciente_id: e.target.value })} required>
              <option value="">Seleccione Paciente</option>
              {pacientes.map((p) => <option key={p.id} value={p.id}>{p.user?.nombre || `Paciente #${p.id}`}</option>)}
            </select>
            <select className="border p-2 rounded w-full" value={nuevoTurno.kinesiologo_id} onChange={(e) => setNuevoTurno({ ...nuevoTurno, kinesiologo_id: e.target.value })} required>
              <option value="">Seleccione Kinesiólogo</option>
              {kines.map((k) => <option key={k.id} value={k.id}>{k.user?.nombre || `Kinesiólogo #${k.id}`}</option>)}
            </select>
            <select className="border p-2 rounded w-full" value={nuevoTurno.servicio_id} onChange={(e) => setNuevoTurno({ ...nuevoTurno, servicio_id: e.target.value })}>
              <option value="">Seleccione Servicio</option>
              {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <select className="border p-2 rounded w-full" value={nuevoTurno.sala_id} onChange={(e) => setNuevoTurno({ ...nuevoTurno, sala_id: e.target.value })}>
              <option value="">Seleccione Sala</option>
              {salas.map((s) => <option key={s.id} value={s.id}>{s.nombre} ({s.ubicacion})</option>)}
            </select>
            <input type="date" className="border p-2 rounded w-full" value={nuevoTurno.fecha} onChange={(e) => setNuevoTurno({ ...nuevoTurno, fecha: e.target.value })} required />
            <input type="time" className="border p-2 rounded w-full" value={nuevoTurno.hora} onChange={(e) => setNuevoTurno({ ...nuevoTurno, hora: e.target.value })} required />
            <input type="text" placeholder="Motivo del turno" className="border p-2 rounded md:col-span-3 w-full" value={nuevoTurno.motivo} onChange={(e) => setNuevoTurno({ ...nuevoTurno, motivo: e.target.value })} />
          </div>
          <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full md:w-auto justify-center">
            <PlusCircle className="w-5 h-5" /> Crear Turno
          </button>
        </form>

        {/* 🔹 TABLA RESPONSIVE */}
        <DataTable 
          data={turnos} 
          columns={columns} 
          emptyMessage="No hay turnos registrados." 
        />

        {/* Modal de edición */}
        <EditModal
          isOpen={editando !== null}
          onClose={() => { setEditando(null); setDatosEdicion({}); }}
          title="Editar Turno"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select className="w-full border border-gray-300 rounded-lg p-2" value={datosEdicion.paciente_id || ""} onChange={(e) => setDatosEdicion({ ...datosEdicion, paciente_id: e.target.value })}>
                  <option value="">Seleccione</option>
                  {pacientes.map((p) => <option key={p.id} value={p.id}>{p.user?.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kinesiólogo</label>
                <select className="w-full border border-gray-300 rounded-lg p-2" value={datosEdicion.kinesiologo_id || ""} onChange={(e) => setDatosEdicion({ ...datosEdicion, kinesiologo_id: e.target.value })}>
                  <option value="">Seleccione</option>
                  {kines.map((k) => <option key={k.id} value={k.id}>{k.user?.nombre}</option>)}
                </select>
              </div>
              {/* Resto de campos del modal... */}
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                 <select className="w-full border border-gray-300 rounded-lg p-2" value={datosEdicion.estado || ""} onChange={(e) => setDatosEdicion({ ...datosEdicion, estado: e.target.value })}>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="completado">Completado</option>
                 </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg p-2" value={datosEdicion.fecha || ""} onChange={(e) => setDatosEdicion({ ...datosEdicion, fecha: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input type="time" className="w-full border border-gray-300 rounded-lg p-2" value={datosEdicion.hora_inicio || ""} onChange={(e) => setDatosEdicion({ ...datosEdicion, hora_inicio: e.target.value })} />
              </div>
            </div>
            {/* Botón Historia Clínica */}
            {turnos.find(t => t.id === editando) && (
                <button
                onClick={() => {
                    const t = turnos.find(item => item.id === editando);
                    navigate(`/historias-clinicas?paciente_id=${t?.paciente_id}&kinesiologo_id=${t?.kinesiologo_id}`);
                }}
                className="mt-4 w-full bg-green-500 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 hover:bg-green-600"
                >
                <FileText className="w-4 h-4" /> Ir a Historia Clínica
                </button>
            )}
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}