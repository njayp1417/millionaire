import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('millionaire_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (role) => {
    const userData = { role, name: role === 'host' ? 'NJAY' : 'Blessing' };
    localStorage.setItem('millionaire_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('millionaire_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
