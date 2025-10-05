/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const DockContext = createContext(null);

export function DockProvider({ children }) {
  const [extraItems, setExtraItems] = useState([]);

  const registerDockItem = useCallback((item) => {
    if (!item?.key) {
      throw new Error('Dock items must include a unique `key`.');
    }

    setExtraItems((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.key === item.key);
      if (existingIndex !== -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], ...item };
        return next;
      }
      return [...prev, item];
    });

    return () => {
      setExtraItems((prev) => prev.filter((entry) => entry.key !== item.key));
    };
  }, []);

  const value = useMemo(() => ({
    extraItems,
    registerDockItem,
  }), [extraItems, registerDockItem]);

  return (
    <DockContext.Provider value={value}>
      {children}
    </DockContext.Provider>
  );
}

DockProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within a DockProvider');
  }
  return context;
}
