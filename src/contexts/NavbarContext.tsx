import React, { createContext, useState, useContext, ReactNode } from 'react';

interface NavbarContextType {
  isNavbarVisible: boolean;
  showNavbar: () => void;
  hideNavbar: () => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export const NavbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  const showNavbar = () => setIsNavbarVisible(true);
  const hideNavbar = () => setIsNavbarVisible(false);

  return (
    <NavbarContext.Provider value={{ isNavbarVisible, showNavbar, hideNavbar }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = (): NavbarContextType => {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
};
