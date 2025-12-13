import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/Client";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 🔹 Verificar token guardado y cargar usuario ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("📝 No hay token guardado");
      setLoading(false);
      return;
    }

    console.log("📝 Token encontrado, cargando usuario...");

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.sub;
      
      console.log("📝 User ID del token:", userId);

      api
        .get(`/usuarios/${userId}`)
        .then((res) => {
          console.log("✅ RESPUESTA DEL BACKEND:", res.data);
          console.log("✅ ROLES RECIBIDOS:", res.data.roles);
          console.log("✅ TIPO DE ROLES:", typeof res.data.roles);
          console.log("✅ ES ARRAY?:", Array.isArray(res.data.roles));
          
          setUser(res.data);
          
          // CRÍTICO: Verificar que roles existe y es array
          if (res.data.roles && Array.isArray(res.data.roles)) {
            const rolesArray = res.data.roles.map((r) => r.name);
            console.log("✅ ROLES MAPEADOS:", rolesArray);
            setRoles(rolesArray);
          } else {
            console.error("❌ roles no es un array:", res.data.roles);
            setRoles([]);
          }
        })
        .catch((err) => {
          console.error("❌ Error al cargar usuario:", err);
          console.error("❌ Detalles:", err.response?.data);
          localStorage.removeItem("token");
          setUser(null);
          setRoles([]);
        })
        .finally(() => setLoading(false));
    } catch (err) {
      console.error("❌ Error decodificando token:", err);
      localStorage.removeItem("token");
      setLoading(false);
    }
  }, []);

  // --- 🔹 Login manual (al iniciar sesión) ---
  const login = async (token) => {
    console.log("🔐 INICIANDO LOGIN...");
    localStorage.setItem("token", token);

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.sub;

      console.log("🔐 User ID del token:", userId);

      const res = await api.get(`/usuarios/${userId}`);
      
      console.log("🔐 RESPUESTA COMPLETA:", res.data);
      console.log("🔐 ROLES EN RESPUESTA:", res.data.roles);
      console.log("🔐 TIPO:", typeof res.data.roles, "ES ARRAY?:", Array.isArray(res.data.roles));

      setUser(res.data);
      
      // CRÍTICO: Verificar que roles existe
      if (res.data.roles && Array.isArray(res.data.roles)) {
        const rolesArray = res.data.roles.map((r) => r.name);
        console.log("🔐 ROLES MAPEADOS:", rolesArray);
        console.log("🔐 CANTIDAD DE ROLES:", rolesArray.length);
        setRoles(rolesArray);
        
        // Guardar en localStorage para debugging
        localStorage.setItem('debugRoles', JSON.stringify(rolesArray));
      } else {
        console.error("❌ roles no es un array válido");
        setRoles([]);
      }

      console.log("✅ LOGIN COMPLETADO");

      return res.data;
    } catch (err) {
      console.error("❌ Error cargando usuario tras login:", err);
      console.error("❌ Response:", err.response?.data);
      console.error("❌ Status:", err.response?.status);
      throw err;
    }
  };

  // --- 🔹 Logout ---
  const logout = () => {
    console.log("🚪 Cerrando sesión...");
    localStorage.removeItem("token");
    localStorage.removeItem("debugRoles");
    setUser(null);
    setRoles([]);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, roles, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);