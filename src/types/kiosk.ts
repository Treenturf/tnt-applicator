import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface KioskConfig {
  id: string;
  name: string;
  type: 'specialty' | 'fertilizer' | 'mixed';
  description: string;
  availableProducts: string[]; // Product IDs
  availableApplications: string[]; // Application/Recipe IDs available for this kiosk
  defaultApplicationId?: string; // Default recipe/application ID for this kiosk
  defaultTruckTypes: ('hose' | 'cart' | 'trailer' | 'backpack')[];
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
    name: 'Main Terminal',
    description: 'Liquid chemicals, herbicides, insecticides',
    icon: '🧪',
    color: '#4caf50',
    defaultUnits: 'gallons',
    truckTypes: ['hose', 'cart']
  },
  fertilizer: {
    name: 'Dry Fertilizer',
    description: 'Granular products, measured in bags/pounds', 
    icon: '🌾',
    color: '#0288d1',
    defaultUnits: 'bags',
    truckTypes: ['cart']
  },
  mixed: {
    name: 'Mixed Operations',
    description: 'Both liquid and granular products',
    icon: '🚛',
    color: '#c62828',
    defaultUnits: 'gallons',
    truckTypes: ['hose', 'cart']
  }
} as const;

export const DEFAULT_KIOSKS: KioskConfig[] = [
  {
    id: 'main-terminal',
    name: 'Main Terminal',
    type: 'specialty',
    description: 'Liquid chemicals and herbicides only',
    availableProducts: [], // Will be filtered to specialty products
    availableApplications: [], // Will be populated with applications for specialty kiosks
    defaultTruckTypes: ['hose', 'cart'],
    calculationMode: 'liquid',
    units: { primary: 'gallons' }
  },
  {
    id: 'specialty-kiosk',
    name: 'Specialty Apps',
    type: 'mixed',
    description: 'Primary loading station with all products',
    availableProducts: [], // Will be populated with all products
    availableApplications: [], // Will be populated with applications for mixed kiosks
    defaultTruckTypes: ['trailer', 'backpack'],
    calculationMode: 'both',
    units: { primary: 'gallons', secondary: 'pounds' }
  },
  {
    id: 'fertilizer-kiosk',
    name: 'Dry Fertilizer',
    type: 'fertilizer',
    description: 'Granular fertilizer products only',
    availableProducts: [], // Will be filtered to fertilizer products
    availableApplications: [], // Will be populated with applications for fertilizer kiosks
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
  
  try {
    // Load from Firestore first
    const kioskDoc = await getDoc(doc(db, 'kiosks', kioskId));
    if (kioskDoc.exists()) {
      const firestoreData = { id: kioskDoc.id, ...kioskDoc.data() } as KioskConfig;
      console.log('📥 Loaded kiosk from Firestore:', firestoreData);
      return firestoreData;
    }
    
    // Fallback to default kiosks
    const defaultKiosk = DEFAULT_KIOSKS.find(k => k.id === kioskId);
    if (defaultKiosk) {
      console.log('📋 Using default kiosk config:', defaultKiosk);
      return defaultKiosk;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error loading kiosk from Firestore:', error);
    // Fallback to default kiosks on error
    return DEFAULT_KIOSKS.find(k => k.id === kioskId) || null;
  }
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
      return product.type === 'fertilizer' || product.category === 'fertilizer';
    }
    return true;
  });
};