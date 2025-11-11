import { useState, useEffect } from "react";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.is_admin) {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return <UserDashboard user={user} onLogout={handleLogout} />;
}

export default App;
