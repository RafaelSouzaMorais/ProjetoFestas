import axios from "axios";

// Monta base dinâmica para facilitar testes em outros dispositivos (mobile)
function resolveBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl; // prioridade para variável explícita

  // Em produção (build), usar /api relativo pois frontend e backend rodam na mesma porta (3100)
  if (import.meta.env.PROD) {
    return "/api";
  }

  // Em dev, permite acesso de outros dispositivos (mobile) usando o hostname
  if (typeof window !== "undefined") {
    const host = window.location.hostname; // ex: 192.168.0.15
    return `http://${host}:3100/api`;
  }

  return "http://localhost:3100/api";
}

const api = axios.create({
  baseURL: resolveBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (username, password) => {
  return api.post("/login", { username, password });
};

export const getUsers = () => {
  return api.get("/users");
};

export const createUser = (userData) => {
  return api.post("/users", userData);
};

export const updateUser = (id, userData) => {
  return api.put(`/users/${id}`, userData);
};

export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
};

export const getTables = () => {
  return api.get("/tables");
};

export const createTable = (tableData) => {
  return api.post("/tables", tableData);
};

export const deleteTable = (id) => {
  return api.delete(`/tables/${id}`);
};

export const getReservations = () => {
  return api.get("/reservations");
};

export const getChairsReservations = () => {
  return api.get("/reservations/chairs");
};

export const getAllReservations = () => {
  return api.get("/reservations/all");
};

export const getRelatorio = () => {
  return api.get("/relatorio");
};

export const createReservation = (reservationData) => {
  return api.post("/reservations", reservationData);
};

export const deleteReservation = (id) => {
  return api.delete(`/reservations/${id}`);
};

// Convidados
export const getGuests = () => {
  return api.get("/guests");
};

export const addGuest = (name) => {
  return api.post("/guests", { name });
};

export const removeGuest = (guestId) => {
  return api.delete(`/guests/${guestId}`);
};
export const getEventConfig = () => {
  return api.get("/event-config");
};

export const updateEventConfig = (config) => {
  return api.put("/event-config", config);
};

export const pingApi = () => api.get("/health");

export default api;
