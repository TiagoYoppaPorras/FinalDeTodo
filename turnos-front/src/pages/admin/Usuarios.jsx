import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { Users, PlusCircle, Trash2, Edit, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EditModal from "../../components/common/EditModal";
import DataTable from "../../components/common/DataTable"; // 👈 Importamos el componente responsive

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // Estados para gestión de roles
  const [gestionandoRoles, setGestionandoRoles] = useState(null);
  const [rolesUsuario, setRolesUsuario] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const { loading, user } = useAuth();

  // --- 🔹 Obtener usuarios ---
  const fetchUsuarios = async () => {
    try {
      const res = await api.get("/usuarios/");
      setUsuarios(res.data);
    } catch (err) {
      console.error("❌ Error cargando usuarios:", err);
    }
  };

  // --- 🔹 Obtener roles disponibles ---
  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles/");
      setRoles(res.data);
    } catch (err) {
      console.error("❌ Error cargando roles:", err);
    }
  };

  // --- 🔹 Ejecutar fetch al cargar ---
  useEffect(() => {
    if (!loading && user) {
      fetchUsuarios();
      fetchRoles();
    }
  }, [loading, user]);

  // --- 🔹 Crear usuario ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
      });

      alert("✅ Usuario creado correctamente");
      setNuevoUsuario({ nombre: "", email: "", password: "" });
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error creando usuario:", err);
      alert("Error al crear usuario. Revisa la consola.");
    }
  };

  // --- 🔹 Abrir modal de edición ---
  const handleEdit = (usuario) => {
    setEditando(usuario.id);
    setDatosEdicion({
      nombre: usuario.nombre,
      email: usuario.email,
      activo: usuario.activo,
    });
  };

  // --- 🔹 Guardar cambios de edición ---
  const handleUpdate = async () => {
    setIsLoadingSave(true);
    try {
      await api.put(`/usuarios/${editando}`, datosEdicion);
      alert("✅ Usuario actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error actualizando usuario:", err);
      alert("Error al actualizar usuario. Revisa la consola.");
    } finally {
      setIsLoadingSave(false);
    }
  };

  // --- 🔹 Eliminar usuario ---
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar usuario?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      fetchUsuarios();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      alert("Error al eliminar usuario.");
    }
  };

  // --- 🔹 Abrir modal de gestión de roles ---
  const handleGestionarRoles = (usuario) => {
    setGestionandoRoles(usuario.id);
    setRolesUsuario(usuario.roles || []);
  };

  // --- 🔹 Asignar rol a usuario ---
  const handleAsignarRol = async (roleId) => {
    setIsLoadingRoles(true);
    try {
      await api.post(`/roles/${gestionandoRoles}/roles/${roleId}`);
      alert("✅ Rol asignado correctamente");
      
      const rol = roles.find(r => r.id === roleId);
      setRolesUsuario([...rolesUsuario, rol]);
      
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error asignando rol:", err);
      alert(err.response?.data?.detail || "Error al asignar rol");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // --- 🔹 Remover rol de usuario ---
  const handleRemoverRol = async (roleId) => {
    if (!confirm("¿Remover este rol?")) return;
    setIsLoadingRoles(true);
    try {
      await api.delete(`/roles/${gestionandoRoles}/roles/${roleId}`);
      alert("✅ Rol removido correctamente");
      
      setRolesUsuario(rolesUsuario.filter(r => r.id !== roleId));
      
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error removiendo rol:", err);
      alert(err.response?.data?.detail || "Error al remover rol");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // 🔹 DEFINICIÓN DE COLUMNAS PARA LA TABLA RESPONSIVE
  const columns = [
    { key: "nombre", label: "Nombre" },
    { key: "email", label: "Email" },
    { 
      key: "roles", 
      label: "Roles",
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles && u.roles.length > 0 ? (
            u.roles.map((rol) => (
              <span key={rol.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {rol.name}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs">Sin roles</span>
          )}
        </div>
      )
    },
    { 
      key: "activo", 
      label: "Activo",
      render: (u) => (u.activo ? "✅" : "❌")
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (u) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <button
            onClick={() => handleEdit(u)}
            className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleGestionarRoles(u)}
            className="bg-purple-500 text-white p-1.5 rounded hover:bg-purple-600"
            title="Gestionar Roles"
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(u.id)}
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
        <div className="p-6 text-gray-600">Cargando usuarios...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600 w-6 h-6" /> Gestión de Usuarios
        </h1>

        {/* 🔹 Formulario de creación */}
        <form
          onSubmit={handleCreate}
          className="bg-white p-4 md:p-6 rounded-lg shadow-sm border space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="border p-2 rounded w-full"
              value={nuevoUsuario.nombre}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              className="border p-2 rounded w-full"
              value={nuevoUsuario.email}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="border p-2 rounded w-full"
              value={nuevoUsuario.password}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center md:justify-start gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto"
          >
            <PlusCircle className="w-5 h-5" /> Crear Usuario
          </button>
        </form>

        {/* 🔹 Tabla Responsive (DataTable) */}
        <DataTable 
            data={usuarios} 
            columns={columns} 
            emptyMessage="No hay usuarios registrados."
        />

        {/* 🔹 Modal de edición */}
        <EditModal
          isOpen={editando !== null}
          onClose={() => {
            setEditando(null);
            setDatosEdicion({});
          }}
          title="Editar Usuario"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={datosEdicion.activo || false}
                  onChange={(e) =>
                    setDatosEdicion({ ...datosEdicion, activo: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Usuario Activo
                </span>
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Nota:</strong> Si deseas cambiar la contraseña, deja el
                campo vacío para mantener la actual.
              </p>
            </div>
          </div>
        </EditModal>

        {/* 🔹 Modal de gestión de roles */}
        <EditModal
          isOpen={gestionandoRoles !== null}
          onClose={() => {
            setGestionandoRoles(null);
            setRolesUsuario([]);
          }}
          title="Gestionar Roles de Usuario"
          onSave={() => {
            setGestionandoRoles(null);
            setRolesUsuario([]);
          }}
          isLoading={false}
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Roles actuales */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Roles Asignados
              </h4>
              {rolesUsuario.length === 0 ? (
                <p className="text-gray-500 text-sm">No tiene roles asignados</p>
              ) : (
                <div className="space-y-2">
                  {rolesUsuario.map((rol) => (
                    <div
                      key={rol.id}
                      className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-purple-800">{rol.name}</p>
                        {rol.description && (
                          <p className="text-xs text-purple-600">{rol.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoverRol(rol.id)}
                        disabled={isLoadingRoles}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agregar nuevo rol */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Agregar Rol</h4>
              <div className="space-y-2">
                {roles
                  .filter(rol => !rolesUsuario.find(r => r.id === rol.id))
                  .map((rol) => (
                    <div
                      key={rol.id}
                      className="flex items-center justify-between bg-gray-50 border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{rol.name}</p>
                        {rol.description && (
                          <p className="text-xs text-gray-600">{rol.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAsignarRol(rol.id)}
                        disabled={isLoadingRoles}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                      >
                        Asignar
                      </button>
                    </div>
                  ))}
                {roles.filter(rol => !rolesUsuario.find(r => r.id === rol.id)).length === 0 && (
                  <p className="text-gray-500 text-sm">Todos los roles ya están asignados</p>
                )}
              </div>
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}