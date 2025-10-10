import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentKioskId, getCurrentKioskConfig } from '../types/kiosk';
import type { KioskConfig } from '../types/kiosk';

interface KioskContextType {
  currentKiosk: KioskConfig | null;
  kioskId: string | null;
  isKioskConfigured: boolean;
  isLoading: boolean;
  setKioskId: (id: string) => void;
  refreshKioskConfig: () => Promise<void>;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export const useKiosk = () => {
  const context = useContext(KioskContext);
  if (context === undefined) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
};

interface KioskProviderProps {
  children: React.ReactNode;
}

export const KioskProvider: React.FC<KioskProviderProps> = ({ children }) => {
  const [currentKiosk, setCurrentKiosk] = useState<KioskConfig | null>(null);
  const [kioskId, setKioskIdState] = useState<string | null>(null);
  const [isKioskConfigured, setIsKioskConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshKioskConfig = async () => {
    try {
      setIsLoading(true);
      const id = getCurrentKioskId();
      const config = await getCurrentKioskConfig();
      
      setKioskIdState(id);
      setCurrentKiosk(config);
      setIsKioskConfigured(!!config && !!id);
      
      console.log('🏭 Kiosk configuration loaded:', {
        id,
        config: config?.name,
        type: config?.type,
        isConfigured: !!config && !!id
      });
    } catch (error) {
      console.error('❌ Error loading kiosk configuration:', error);
      setIsKioskConfigured(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setKioskId = async (id: string) => {
    // This is handled by the kiosk selector component
    // We just need to refresh our state
    await refreshKioskConfig();
  };

  useEffect(() => {
    refreshKioskConfig();
  }, []);

  const value: KioskContextType = {
    currentKiosk,
    kioskId,
    isKioskConfigured,
    isLoading,
    setKioskId,
    refreshKioskConfig
  };

  return (
    <KioskContext.Provider value={value}>
      {children}
    </KioskContext.Provider>
  );
};