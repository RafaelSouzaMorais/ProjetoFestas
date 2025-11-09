import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
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

export const getAllReservations = () => {
  return api.get("/reservations/all");
};

export const createReservation = (reservationData) => {
  return api.post("/reservations", reservationData);
};

export const deleteReservation = (id) => {
  return api.delete(`/reservations/${id}`);
};
export const getEventConfig = () => {
  return api.get("/event-config");
};

export const updateEventConfig = (config) => {
  return api.put("/event-config", config);
};

export default api;
