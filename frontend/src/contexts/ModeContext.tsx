import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAllModes, 
  Mode, 
  deleteMode,
  ModeType,
  setActiveMode as activateModeService
} from '../services/modeService';

// Define the shape of our context
interface ModeContextType {
  modes: Mode[];
  activeMode: Mode | null;
  loading: boolean;
  error: string | null;
  refreshModes: () => Promise<void>;
  activateMode: (modeId: number) => Promise<{success: boolean; message: string}>;
  deleteMode: (modeId: number) => Promise<{success: boolean; message: string}>;
  isModeEditable: (mode: Mode) => boolean;
  isModeDeletable: (mode: Mode) => boolean;
  isModeConfigurable: (mode: Mode) => boolean;
}

// Create the context with a default value
const ModeContext = createContext<ModeContextType | undefined>(undefined);

// Provider component
interface ModeProviderProps {
  children: ReactNode;
}

export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
  const [modes, setModes] = useState<Mode[]>([]);
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load modes on initial mount
  useEffect(() => {
    refreshModes();
  }, []);

  // Function to refresh modes data
  const refreshModes = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const modesData = await getAllModes();
      setModes(modesData);

      // Set the active mode
      const active = modesData.find(mode => mode.isActive);
      setActiveMode(active || null);
    } catch (err) {
      console.error('Failed to fetch modes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load modes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to activate a mode
  const activateMode = async (modeId: number): Promise<{success: boolean; message: string}> => {
    try {
      setError(null);

      const result = await activateModeService(modeId);
      if (result.success) {
        // Update the local state
        setModes(prevModes => 
          prevModes.map(mode => ({
            ...mode,
            isActive: mode.id === modeId
          }))
        );

        // Update the active mode
        const newActiveMode = modes.find(mode => mode.id === modeId);
        if (newActiveMode) {
          setActiveMode({...newActiveMode, isActive: true});
        }
      }

      return result;
    } catch (err) {
      console.error('Error activating mode:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const result = {
        success: false,
        message: `Failed to activate mode: ${errorMessage}`,
      };
      setError(result.message);
      return result;
    }
  };

  // Function to delete a mode
  const handleDeleteMode = async (modeId: number): Promise<{success: boolean; message: string}> => {
    try {
      setError(null);

      // Call the service to delete the mode
      const result = await deleteMode(modeId);

      if (result.success) {
        // Remove the mode from state
        setModes(prevModes => prevModes.filter(mode => mode.id !== modeId));

        // If the deleted mode was the active one, find a new active mode
        if (activeMode?.id === modeId) {
          const newActiveMode = modes.find(mode => mode.isActive && mode.id !== modeId);
          setActiveMode(newActiveMode || null);
        }
      }

      return result;
    } catch (err) {
      console.error('Error deleting mode:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const result = {
        success: false,
        message: `Failed to delete mode: ${errorMessage}`,
      };
      setError(result.message);
      return result;
    }
  };

  // Helper functions for mode type validation
  const isModeEditable = (mode: Mode): boolean => {
    return mode.modeType === ModeType.CUSTOM;
  };

  const isModeDeletable = (mode: Mode): boolean => {
    return mode.modeType === ModeType.CUSTOM;
  };

  const isModeConfigurable = (mode: Mode): boolean => {
    return mode.modeType !== ModeType.ARM_AWAY;
  };

  // Context value
  const contextValue: ModeContextType = {
    modes,
    activeMode,
    loading,
    error,
    refreshModes,
    activateMode,
    deleteMode: handleDeleteMode,
    isModeEditable,
    isModeDeletable,
    isModeConfigurable
  };

  return (
    <ModeContext.Provider value={contextValue}>
      {children}
    </ModeContext.Provider>
  );
};

// Custom hook to use the context
export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};