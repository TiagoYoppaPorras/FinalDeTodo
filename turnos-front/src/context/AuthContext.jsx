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
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      
      // 🔴 CORRECCIÓN: Leemos el ID del campo 'id', no del 'sub' (que ahora es email)
      const userId = decoded.id; 
      
      console.log("📝 User ID del token:", userId);

      api
        .get(`/usuarios/${userId}`)
        .then((res) => {
          setUser(res.data);
          
          if (res.data.roles && Array.isArray(res.data.roles)) {
            const rolesArray = res.data.roles.map((r) => r.name);
            setRoles(rolesArray);
          } else {
            setRoles([]);
          }
        })
        .catch((err) => {
          console.error("❌ Error al cargar usuario:", err);
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

  // --- 🔹 Login manual ---
  const login = async (token) => {
    localStorage.setItem("token", token);

    try {
      const decoded = jwtDecode(token);
      
      // 🔴 CORRECCIÓN: Leemos el ID del campo 'id'
      const userId = decoded.id;

      const res = await api.get(`/usuarios/${userId}`);
      
      setUser(res.data);
      
      if (res.data.roles && Array.isArray(res.data.roles)) {
        const rolesArray = res.data.roles.map((r) => r.name);
        setRoles(rolesArray);
        localStorage.setItem('debugRoles', JSON.stringify(rolesArray));
      } else {
        setRoles([]);
      }

      return res.data;
    } catch (err) {
      console.error("❌ Error login:", err);
      throw err;
    }
  };

  const logout = () => {
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