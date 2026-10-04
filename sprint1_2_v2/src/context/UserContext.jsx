import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);

  // Load user and accounts from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('bioqc_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    const storedAccounts = localStorage.getItem('bioqc_accounts');
    if (storedAccounts) {
      setAccounts(JSON.parse(storedAccounts));
    }
  }, []);

  // Register a new account
  const registerUser = (email, fullName, password) => {
    // Check if email already exists
    const emailExists = accounts.some(acc => acc.email === email);
    if (emailExists) {
      return { success: false, message: 'Email already registered' };
    }

    // Create new account
    const newAccount = { email, fullName, password };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem('bioqc_accounts', JSON.stringify(updatedAccounts));
    
    return { success: true, message: 'Account created successfully' };
  };

  // Validate and login user
  const loginUser = (email, password) => {
    // Find account with matching email and password
    const account = accounts.find(acc => acc.email === email && acc.password === password);
    
    if (!account) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Login successful
    const userData = { email: account.email, fullName: account.fullName };
    setUser(userData);
    localStorage.setItem('bioqc_user', JSON.stringify(userData));
    
    return { success: true, message: 'Login successful' };
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('bioqc_user');
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser, registerUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
