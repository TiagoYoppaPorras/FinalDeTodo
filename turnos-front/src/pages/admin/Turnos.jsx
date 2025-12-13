import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { CalendarDays, PlusCircle, Edit, Trash2 } from "lucide-react";
import EditModal from "../../components/common/EditModal";

export default function Turnos() {
  const [turnos, setTurnos] = useState([]);
  const [nuevoTurno, setNuevoTurno] = useState({
    paciente_id: "",
    kinesiologo_id: "",
    servicio_id: "",
    sala_id: "",
    fecha: "",
    hora: "",
    motivo: "",
  });

  const [pacientes, setPacientes] = useState([]);
  const [kines, setKines] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // 🔹 Cargar todos los datos necesarios
  const fetchData = async () => {
    try {
      const [resTurnos, resPac, resKine, resServ, resSalas] = await Promise.all([
        api.get("/turnos/"),
        api.get("/pacientes/"),
        api.get("/kinesiologos/"),
        api.get("/servicios/"),
        api.get("/salas/"),
      ]);
      setTurnos(resTurnos.data);
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

  // 🔹 Crear turno
  const handleCrearTurno = async (e) => {
    e.preventDefault();

    // Validaciones mínimas
    if (!nuevoTurno.paciente_id || !nuevoTurno.kinesiologo_id) {
      alert("Debe seleccionar un paciente y un kinesiólogo");
      return;
    }

    try {
      const payload = {
        fecha: nuevoTurno.fecha,
        hora_inicio: nuevoTurno.hora,
        hora_fin: nuevoTurno.hora, // 🔹 simplificado, podrías ajustarlo luego
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
      setNuevoTurno({
        paciente_id: "",
        kinesiologo_id: "",
        servicio_id: "",
        sala_id: "",
        fecha: "",
        hora: "",
        motivo: "",
      });
      fetchData();
    } catch (err) {
      console.error("❌ Error al crear turno:", err);
      alert("Error al crear turno");
    }
  };

  // 🔹 Abrir modal de edición
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

  // 🔹 Guardar cambios de edición
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

  // 🔹 Cambiar estado del turno
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/turnos/${id}/estado?estado=${nuevoEstado}`);
      fetchData();
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  // 🔹 Eliminar turno
  const eliminarTurno = async (id) => {
    if (!confirm("¿Eliminar turno?")) return;
    try {
      await api.delete(`/turnos/${id}`);
      fetchData();
    } catch (err) {
      console.error("Error al eliminar turno:", err);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            Gestión de Turnos
          </h1>
        </div>

        {/* 🔹 Formulario nuevo turno */}
        <form
          onSubmit={handleCrearTurno}
          className="bg-white border rounded-lg shadow-sm p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Paciente */}
            <select
              className="border p-2 rounded"
              value={nuevoTurno.paciente_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, paciente_id: e.target.value })
              }
              required
            >
              <option value="">Seleccione Paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user?.nombre || `Paciente #${p.id}`}
                </option>
              ))}
            </select>

            {/* Kinesiólogo */}
            <select
              className="border p-2 rounded"
              value={nuevoTurno.kinesiologo_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, kinesiologo_id: e.target.value })
              }
              required
            >
              <option value="">Seleccione Kinesiólogo</option>
              {kines.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.user?.nombre || `Kinesiólogo #${k.id}`}
                </option>
              ))}
            </select>

            {/* Servicio */}
            <select
              className="border p-2 rounded"
              value={nuevoTurno.servicio_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, servicio_id: e.target.value })
              }
            >
              <option value="">Seleccione Servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>

            {/* Sala */}
            <select
              className="border p-2 rounded"
              value={nuevoTurno.sala_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, sala_id: e.target.value })
              }
            >
              <option value="">Seleccione Sala</option>
              {salas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.ubicacion})
                </option>
              ))}
            </select>

            {/* Fecha y hora */}
            <input
              type="date"
              className="border p-2 rounded"
              value={nuevoTurno.fecha}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, fecha: e.target.value })
              }
              required
            />
            <input
              type="time"
              className="border p-2 rounded"
              value={nuevoTurno.hora}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, hora: e.target.value })
              }
              required
            />

            {/* Motivo */}
            <input
              type="text"
              placeholder="Motivo del turno"
              className="border p-2 rounded md:col-span-3"
              value={nuevoTurno.motivo}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, motivo: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" /> Crear Turno
          </button>
        </form>

        {/* 🔹 Tabla de turnos */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {loading ? (
            <p className="text-gray-500">Cargando turnos...</p>
          ) : turnos.length === 0 ? (
            <p className="text-gray-500">No hay turnos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Paciente</th>
                    <th className="p-2 border">Kinesiólogo</th>
                    <th className="p-2 border">Servicio</th>
                    <th className="p-2 border">Sala</th>
                    <th className="p-2 border">Fecha</th>
                    <th className="p-2 border">Hora</th>
                    <th className="p-2 border">Estado</th>
                    <th className="p-2 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {turnos.map((t) => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 border text-center">{t.id}</td>
                      <td className="p-2 border">{t.paciente?.user?.nombre || "—"}</td>
                      <td className="p-2 border">{t.kinesiologo?.user?.nombre || "—"}</td>
                      <td className="p-2 border">{t.servicio?.nombre || "—"}</td>
                      <td className="p-2 border">{t.sala?.nombre || "—"}</td>
                      <td className="p-2 border">{t.fecha}</td>
                      <td className="p-2 border">{t.hora_inicio?.slice(0, 5) || "—"}</td>
                      <td className="p-2 border capitalize">{t.estado}</td>
                      <td className="p-2 border">
                        <div className="flex gap-1 justify-center flex-wrap">
                          <button
                            onClick={() => handleEdit(t)}
                            className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => cambiarEstado(t.id, "confirmado")}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => cambiarEstado(t.id, "cancelado")}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                          >
                            ✗
                          </button>
                          <button
                            onClick={() => eliminarTurno(t.id)}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
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
          title="Editar Turno"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paciente
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.paciente_id || ""}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, paciente_id: e.target.value })
                  }
                >
                  <option value="">Seleccione</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user?.nombre || `Paciente #${p.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kinesiólogo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kinesiólogo
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.kinesiologo_id || ""}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, kinesiologo_id: e.target.value })
                  }
                >
                  <option value="">Seleccione</option>
                  {kines.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.user?.nombre || `Kinesiólogo #${k.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicio
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.servicio_id || ""}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, servicio_id: e.target.value })
                  }
                >
                  <option value="">Seleccione</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sala */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sala
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.sala_id || ""}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, sala_id: e.target.value })
                  }
                >
                  <option value="">Seleccione</option>
                  {salas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.fecha || ""}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, fecha: e.target.value })
                  }
                />
              </div>

              {/* Hora inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.hora_inicio || ""}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, hora_inicio: e.target.value })
                  }
                />
              </div>

              {/* Hora fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.hora_fin || ""}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, hora_fin: e.target.value })
                  }
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={datosEdicion.estado || ""}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, estado: e.target.value })
                  }
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={datosEdicion.motivo || ""}
                onChange={(e) =>
                  setDatosEdicion({ ...datosEdicion, motivo: e.target.value })
                }
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2"
                rows="3"
                value={datosEdicion.observaciones || ""}
                onChange={(e) =>
                  setDatosEdicion({ ...datosEdicion, observaciones: e.target.value })
                }
              />
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}
