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
      const userId = decoded.sub;

      api
        .get(`/usuarios/${userId}`, { params: { token } })
        .then((res) => {
          setUser(res.data);
          setRoles(res.data.roles.map((r) => r.name));
        })
        .catch(() => {
          console.warn("⚠️ Token inválido o expirado al inicializar sesión.");
          localStorage.removeItem("token");
          setUser(null);
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
    localStorage.setItem("token", token);

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.sub;

      const res = await api.get(`/usuarios/${userId}`, { params: { token } });
      setUser(res.data);
      setRoles(res.data.roles.map((r) => r.name));

      return res.data;
    } catch (err) {
      console.error("❌ Error cargando usuario tras login:", err);
      throw err;
    }
  };

  // --- 🔹 Logout ---
  const logout = () => {
    console.log("🚪 Cerrando sesión...");
    localStorage.removeItem("token");
    setUser(null);
    setRoles([]);
    window.location.href = "/login"; // 🔁 redirección limpia
  };

  return (
    <AuthContext.Provider value={{ user, roles, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
