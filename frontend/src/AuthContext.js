import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setIsLoggedIn(true);
      setUserId(storedUserId);
      console.log('User ID retrieved from localStorage:', storedUserId);
    }
  }, []);

  const login = (id) => {
    if (id) {
      setIsLoggedIn(true);
      setUserId(id.toString());
      localStorage.setItem('userId', id.toString());
      console.log('User logged in. ID set:', id);
    } else {
      console.error('Attempted to login with invalid ID:', id);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    localStorage.removeItem('userId');
    console.log('User logged out. ID cleared.');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

