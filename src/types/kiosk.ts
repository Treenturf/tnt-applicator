export interface KioskConfig {
  id: string;
  name: string;
  type: 'specialty' | 'fertilizer' | 'mixed';
  description: string;
  availableProducts: string[]; // Product IDs
  defaultTruckTypes: ('hose' | 'cart')[];
  calculationMode: 'liquid' | 'granular' | 'both';
  units: {
    primary: 'gallons' | 'pounds' | 'bags';
    secondary?: 'ounces' | 'tons' | 'pounds';
  };
  location?: string;
  lastActive?: Date;
}

export interface KioskProduct {
  id: string;
  name: string;
  type: 'liquid' | 'granular';
  category: 'herbicide' | 'insecticide' | 'fertilizer' | 'specialty';
  kioskTypes: ('specialty' | 'fertilizer' | 'mixed')[];
  unit: string;
  hoseRatePerGallon?: number;
  cartRatePerGallon?: number;
  bagsPerTon?: number;
  poundsPerBag?: number;
  active: boolean;
}

export const KIOSK_TYPES = {
  specialty: {
    name: 'Specialty Applications',
    description: 'Liquid chemicals, herbicides, insecticides',
    icon: '🧪',
    color: '#e91e63',
    defaultUnits: 'gallons',
    truckTypes: ['hose', 'cart']
  },
  fertilizer: {
    name: 'Bagged Fertilizer',
    description: 'Granular products, measured in bags/pounds', 
    icon: '🌾',
    color: '#4caf50',
    defaultUnits: 'bags',
    truckTypes: ['cart']
  },
  mixed: {
    name: 'Mixed Operations',
    description: 'Both liquid and granular products',
    icon: '🚛',
    color: '#2196f3',
    defaultUnits: 'gallons',
    truckTypes: ['hose', 'cart']
  }
} as const;

export const DEFAULT_KIOSKS: KioskConfig[] = [
  {
    id: 'main-terminal',
    name: 'Main Terminal',
    type: 'mixed',
    description: 'Primary loading station with all products',
    availableProducts: [], // Will be populated with all products
    defaultTruckTypes: ['hose', 'cart'],
    calculationMode: 'both',
    units: { primary: 'gallons', secondary: 'pounds' }
  },
  {
    id: 'specialty-kiosk',
    name: 'Specialty Applications Kiosk',
    type: 'specialty',
    description: 'Liquid chemicals and herbicides only',
    availableProducts: [], // Will be filtered to specialty products
    defaultTruckTypes: ['hose', 'cart'],
    calculationMode: 'liquid',
    units: { primary: 'gallons' }
  },
  {
    id: 'fertilizer-kiosk',
    name: 'Bagged Fertilizer Kiosk',
    type: 'fertilizer',
    description: 'Granular fertilizer products only',
    availableProducts: [], // Will be filtered to fertilizer products
    defaultTruckTypes: ['cart'],
    calculationMode: 'granular',
    units: { primary: 'bags', secondary: 'pounds' }
  }
];

// Utility functions
export const getCurrentKioskId = (): string | null => {
  return localStorage.getItem('tnt-current-kiosk-id');
};

export const setCurrentKioskId = (kioskId: string): void => {
  localStorage.setItem('tnt-current-kiosk-id', kioskId);
  localStorage.setItem('tnt-kiosk-last-set', new Date().toISOString());
};

export const getCurrentKioskConfig = async (): Promise<KioskConfig | null> => {
  const kioskId = getCurrentKioskId();
  if (!kioskId) return null;
  
  // Check admin-configured kiosks first
  const adminKiosks = localStorage.getItem('tnt-admin-kiosks');
  if (adminKiosks) {
    const kiosks = JSON.parse(adminKiosks);
    const found = kiosks.find((k: KioskConfig) => k.id === kioskId);
    if (found) return found;
  }
  
  // Fallback to default kiosks
  return DEFAULT_KIOSKS.find(k => k.id === kioskId) || null;
};

export const getKioskProducts = (kioskConfig: KioskConfig, allProducts: any[]): any[] => {
  if (!kioskConfig || !allProducts) return [];
  
  // If specific products are assigned, use those
  if (kioskConfig.availableProducts.length > 0) {
    return allProducts.filter(product => 
      kioskConfig.availableProducts.includes(product.id)
    );
  }
  
  // Otherwise filter by kiosk type
  return allProducts.filter(product => {
    if (kioskConfig.type === 'mixed') return true;
    if (kioskConfig.type === 'specialty') {
      // Main terminal should show all active products
      return product.isActive !== false;
    }
    if (kioskConfig.type === 'fertilizer') {
      return product.type === 'fertilizer';
    }
    return true;
  });
};