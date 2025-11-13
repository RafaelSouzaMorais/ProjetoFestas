import { useState, useEffect } from "react";
import { App as AntdApp } from "antd";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
// import AdminTableMap from "./pages/AdminTableMap";
import UserDashboard from "./pages/UserDashboard";
import { getMe } from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Hidratar usuário via backend para evitar estado desatualizado em localStorage
    (async () => {
      try {
        const { data } = await getMe();
        setUser(data);
      } catch (e) {
        // Token inválido/expirado
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  if (loading) return null; // opcional: poderia renderizar um spinner

  return (
    <AntdApp>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.is_admin ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <UserDashboard user={user} onLogout={handleLogout} />
      )}
    </AntdApp>
  );
}

export default App;
