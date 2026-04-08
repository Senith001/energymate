import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // When the app loads, verify if the token in localStorage is still valid
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const response = await api.get("/users/me");
          setUser(response.data.user);
        } catch (error) {
          console.error("Token invalid or expired");
          logout(); // Clear bad tokens
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  // Call this function when the user successfully logs in
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("token", userToken);
  };

  // Call this to log out
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily grab auth data anywhere in the app
export const useAuth = () => {
  return useContext(AuthContext);
};