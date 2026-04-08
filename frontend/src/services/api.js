import axios from "axios";

// Create an Axios instance pointing to your backend
const api = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach the JWT token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handler — redirect to login if token is invalid/expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Only redirect if not already on a login page
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/admin-portal")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;