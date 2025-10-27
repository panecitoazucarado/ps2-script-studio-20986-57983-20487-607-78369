import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WindowId = 'fileExplorer' | 'preview' | 'aiChat';

export type DockPosition = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'floating';

export interface WindowState {
  id: WindowId;
  docked: boolean;
  position: DockPosition;
  floatingPosition?: { x: number; y: number };
  size?: { width: number; height: number };
  visible: boolean;
  zIndex: number;
}

interface WindowDockingContextType {
  windows: Record<WindowId, WindowState>;
  dockingEnabled: boolean;
  toggleDocking: () => void;
  undockWindow: (id: WindowId, position: { x: number; y: number }) => void;
  dockWindow: (id: WindowId, position: DockPosition) => void;
  updateWindowPosition: (id: WindowId, position: { x: number; y: number }) => void;
  updateWindowSize: (id: WindowId, size: { width: number; height: number }) => void;
  bringToFront: (id: WindowId) => void;
  resetWindows: () => void;
  toggleWindowVisibility: (id: WindowId) => void;
}

const WindowDockingContext = createContext<WindowDockingContextType | undefined>(undefined);

const DEFAULT_WINDOWS: Record<WindowId, WindowState> = {
  fileExplorer: {
    id: 'fileExplorer',
    docked: true,
    position: 'left',
    visible: true,
    zIndex: 1,
  },
  preview: {
    id: 'preview',
    docked: true,
    position: 'right',
    visible: true,
    zIndex: 1,
  },
  aiChat: {
    id: 'aiChat',
    docked: true,
    position: 'right',
    visible: false,
    zIndex: 1,
  },
};

export function WindowDockingProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<Record<WindowId, WindowState>>(() => {
    const saved = localStorage.getItem('athena-window-states');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved state with defaults to ensure all windows exist
        return {
          ...DEFAULT_WINDOWS,
          ...parsed
        };
      } catch {
        return DEFAULT_WINDOWS;
      }
    }
    return DEFAULT_WINDOWS;
  });

  const [dockingEnabled, setDockingEnabled] = useState(() => {
    const saved = localStorage.getItem('athena-docking-enabled');
    return saved ? JSON.parse(saved) : true;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('athena-window-states', JSON.stringify(windows));
  }, [windows]);

  useEffect(() => {
    localStorage.setItem('athena-docking-enabled', JSON.stringify(dockingEnabled));
  }, [dockingEnabled]);

  const toggleDocking = () => {
    setDockingEnabled(prev => !prev);
  };

  const undockWindow = (id: WindowId, position: { x: number; y: number }) => {
    if (!dockingEnabled) return;
    
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        docked: false,
        position: 'floating',
        floatingPosition: position,
        size: prev[id].size || { 
          width: id === 'fileExplorer' ? 400 : 600, 
          height: 500 
        },
        zIndex: Math.max(...Object.values(prev).map(w => w.zIndex)) + 1,
      },
    }));
  };

  const dockWindow = (id: WindowId, position: DockPosition) => {
    if (!dockingEnabled) return;

    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        docked: true,
        position,
        floatingPosition: undefined,
      },
    }));
  };

  const updateWindowPosition = (id: WindowId, position: { x: number; y: number }) => {
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        floatingPosition: position,
      },
    }));
  };

  const updateWindowSize = (id: WindowId, size: { width: number; height: number }) => {
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        size,
      },
    }));
  };

  const bringToFront = (id: WindowId) => {
    setWindows(prev => {
      const maxZ = Math.max(...Object.values(prev).map(w => w.zIndex));
      return {
        ...prev,
        [id]: {
          ...prev[id],
          zIndex: maxZ + 1,
        },
      };
    });
  };

  const resetWindows = () => {
    setWindows(DEFAULT_WINDOWS);
  };

  const toggleWindowVisibility = (id: WindowId) => {
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        visible: !prev[id].visible,
      },
    }));
  };

  return (
    <WindowDockingContext.Provider
      value={{
        windows,
        dockingEnabled,
        toggleDocking,
        undockWindow,
        dockWindow,
        updateWindowPosition,
        updateWindowSize,
        bringToFront,
        resetWindows,
        toggleWindowVisibility,
      }}
    >
      {children}
    </WindowDockingContext.Provider>
  );
}

export function useWindowDocking() {
  const context = useContext(WindowDockingContext);
  if (!context) {
    throw new Error('useWindowDocking must be used within WindowDockingProvider');
  }
  return context;
}
