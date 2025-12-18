import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Users, PlusCircle, Trash2, Edit, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EditModal from "../../components/common/EditModal";
import DataTable from "../../components/common/DataTable";
import { alertaExito, alertaError, confirmarAccion } from "../../utils/alerts";

// Componente InputConError fuera para evitar re-render
const InputConError = ({ type = "text", placeholder, value, onChange, error }) => (
    <div className="w-full">
        <div className="relative">
            <input 
                type={type} 
                placeholder={placeholder}
                className={`w-full border rounded p-2 outline-none transition-colors
                    ${error ? "border-red-500 bg-red-50 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                value={value} 
                onChange={onChange}
            />
            {error && <AlertCircle className="absolute right-3 top-2.5 h-5 w-5 text-red-500 pointer-events-none" />}
        </div>
        {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
);

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", email: "", password: "" });
  
  // Estado de errores
  const [errores, setErrores] = useState({});

  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  const [gestionandoRoles, setGestionandoRoles] = useState(null);
  const [rolesUsuario, setRolesUsuario] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const { loading, user } = useAuth();

  const fetchUsuarios = async () => {
    try {
      const res = await api.get("/usuarios/");
      setUsuarios(res.data);
    } catch (err) {
      console.error("❌ Error cargando usuarios:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles/");
      setRoles(res.data);
    } catch (err) {
      console.error("❌ Error cargando roles:", err);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchUsuarios();
      fetchRoles();
    }
  }, [loading, user]);

  const handleChangeNuevo = (campo, valor) => {
      setNuevoUsuario({ ...nuevoUsuario, [campo]: valor });
      if (errores[campo]) setErrores({ ...errores, [campo]: null });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrores({});

    try {
      await api.post("/auth/register", nuevoUsuario);
      alertaExito("Usuario creado correctamente");
      setNuevoUsuario({ nombre: "", email: "", password: "" });
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error creando usuario:", err);
      const detail = err.response?.data?.detail;

      // 🔴 LÓGICA MEJORADA PARA CAPTURAR ERRORES DE PYDANTIC (422)
      if (Array.isArray(detail)) {
          const nuevosErrores = {};
          detail.forEach(error => {
              // Pydantic devuelve: "Value error, La contraseña debe..." -> Limpiamos el prefijo
              const msgLimpio = error.msg.replace("Value error, ", "");
              
              // Mapeamos el campo que falló
              if (error.loc.includes("password")) nuevosErrores.password = msgLimpio;
              if (error.loc.includes("email")) nuevosErrores.email = msgLimpio;
              if (error.loc.includes("nombre")) nuevosErrores.nombre = msgLimpio;
          });
          setErrores(nuevosErrores);
      } else if (typeof detail === 'string') {
          // Errores simples (ej: "El usuario ya existe")
          if (detail.toLowerCase().includes("existe")) setErrores({ email: detail });
          else alertaError(detail);
      } else {
          alertaError("Error al crear usuario.");
      }
    }
  };

  const handleEdit = (usuario) => {
    setEditando(usuario.id);
    setDatosEdicion({
      nombre: usuario.nombre,
      email: usuario.email,
      activo: usuario.activo,
    });
  };

  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      await api.put(`/usuarios/${editando}`, datosEdicion);
      alertaExito("Usuario actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error actualizando usuario:", err);
      alertaError("Error al actualizar usuario.");
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmado = await confirmarAccion("¿Eliminar usuario?", "Esta acción no se puede deshacer.");
    if (!confirmado) return;

    try {
      await api.delete(`/usuarios/${id}`);
      fetchUsuarios();
      alertaExito("Usuario eliminado");
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      alertaError("Error al eliminar usuario.");
    }
  };

  const handleGestionarRoles = (usuario) => {
    setGestionandoRoles(usuario.id);
    setRolesUsuario(usuario.roles || []);
  };

  const handleAsignarRol = async (roleId) => {
    setIsLoadingRoles(true);
    try {
      await api.post(`/roles/${gestionandoRoles}/roles/${roleId}`);
      alertaExito("Rol asignado correctamente");
      const rol = roles.find(r => r.id === roleId);
      setRolesUsuario([...rolesUsuario, rol]);
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error asignando rol:", err);
      alertaError("Error al asignar rol");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleRemoverRol = async (roleId) => {
    const confirmado = await confirmarAccion("¿Remover rol?", "El usuario perderá los permisos asociados.");
    if (!confirmado) return;

    setIsLoadingRoles(true);
    try {
      await api.delete(`/roles/${gestionandoRoles}/roles/${roleId}`);
      alertaExito("Rol removido correctamente");
      setRolesUsuario(rolesUsuario.filter(r => r.id !== roleId));
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error removiendo rol:", err);
      alertaError("Error al remover rol");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const columns = [
    { key: "nombre", label: "Nombre" },
    { key: "email", label: "Email" },
    { 
      key: "roles", label: "Roles",
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles && u.roles.length > 0 ? (
            u.roles.map((rol) => (
              <span key={rol.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{rol.name}</span>
            ))
          ) : <span className="text-gray-400 text-xs">Sin roles</span>}
        </div>
      )
    },
    { key: "activo", label: "Activo", render: (u) => (u.activo ? "✅" : "❌") },
    {
      key: "acciones", label: "Acciones",
      render: (u) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <button onClick={() => handleEdit(u)} className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600" title="Editar"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleGestionarRoles(u)} className="bg-purple-500 text-white p-1.5 rounded hover:bg-purple-600" title="Roles"><Shield className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(u.id)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  if (loading) return <MainLayout><div className="p-6 text-gray-600">Cargando usuarios...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2"><Users className="text-blue-600 w-6 h-6" /> Gestión de Usuarios</h1>
        
        {/* FORMULARIO DE CREACIÓN MEJORADO */}
        <form onSubmit={handleCreate} className="bg-white p-4 md:p-6 rounded-lg shadow-sm border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputConError 
                placeholder="Nombre completo" 
                value={nuevoUsuario.nombre} 
                onChange={(e) => handleChangeNuevo("nombre", e.target.value)} 
                error={errores.nombre}
            />
            <InputConError 
                type="email"
                placeholder="Correo electrónico" 
                value={nuevoUsuario.email} 
                onChange={(e) => handleChangeNuevo("email", e.target.value)} 
                error={errores.email}
            />
            <InputConError 
                type="password"
                placeholder="Contraseña" 
                value={nuevoUsuario.password} 
                onChange={(e) => handleChangeNuevo("password", e.target.value)} 
                error={errores.password}
            />
          </div>
          <button type="submit" className="flex items-center justify-center md:justify-start gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto"><PlusCircle className="w-5 h-5" /> Crear Usuario</button>
        </form>

        <DataTable data={usuarios} columns={columns} emptyMessage="No hay usuarios registrados." />
        
        <EditModal isOpen={editando !== null} onClose={() => { setEditando(null); setDatosEdicion({}); }} title="Editar Usuario" onSave={handleUpdate} isLoading={isLoadingSave}>
            <div className="space-y-4">
                <input type="text" className="w-full border rounded p-2" value={datosEdicion.nombre || ""} onChange={e => setDatosEdicion({...datosEdicion, nombre: e.target.value})} placeholder="Nombre"/>
                <input type="email" className="w-full border rounded p-2" value={datosEdicion.email || ""} onChange={e => setDatosEdicion({...datosEdicion, email: e.target.value})} placeholder="Email"/>
                <label className="flex items-center gap-2"><input type="checkbox" checked={datosEdicion.activo || false} onChange={e => setDatosEdicion({...datosEdicion, activo: e.target.checked})}/> Usuario Activo</label>
            </div>
        </EditModal>

        <EditModal isOpen={gestionandoRoles !== null} onClose={() => { setGestionandoRoles(null); setRolesUsuario([]); }} title="Gestionar Roles" onSave={() => { setGestionandoRoles(null); setRolesUsuario([]); }} isLoading={false}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <h4 className="font-semibold">Asignados</h4>
                {rolesUsuario.map(r => (
                    <div key={r.id} className="flex justify-between bg-purple-50 p-2 rounded items-center">
                        <span>{r.name}</span>
                        <button onClick={() => handleRemoverRol(r.id)} disabled={isLoadingRoles} className="text-red-600 text-sm">Remover</button>
                    </div>
                ))}
                <h4 className="font-semibold mt-4">Disponibles</h4>
                {roles.filter(r => !rolesUsuario.find(ru => ru.id === r.id)).map(r => (
                    <div key={r.id} className="flex justify-between bg-gray-50 p-2 rounded items-center">
                        <span>{r.name}</span>
                        <button onClick={() => handleAsignarRol(r.id)} disabled={isLoadingRoles} className="text-purple-600 text-sm">Asignar</button>
                    </div>
                ))}
            </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}