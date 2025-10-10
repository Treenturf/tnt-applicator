import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCopI_jKbudD3CM_TTOujiNeG0t2n_fqNk3",
  authDomain: "tnt-app-cfced.firebaseapp.com",
  projectId: "tnt-app-cfced",
  storageBucket: "tnt-app-cfced.firebasestorage.app",
  messagingSenderId: "366696437511",
  appId: "1:366696437511:web:8fb32180f310212111d7a2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fertilizer products for bagged fertilizer kiosk
const fertilizerProducts = [
  {
    name: '10-10-10 Balanced Fertilizer',
    type: 'fertilizer',
    hoseRatePerGallon: 0, // Not applicable for granular
    cartRatePerGallon: 0, // Not applicable for granular
    unit: 'pounds',
    poundsPer1000SqFt: 2.3, // Typical rate for balanced fertilizer
    poundsPerBag: 50,
    description: 'Balanced NPK fertilizer for general applications',
    isActive: true,
    kioskTypes: ['fertilizer', 'mixed']
  },
  {
    name: '46-0-0 Urea',
    type: 'fertilizer',
    hoseRatePerGallon: 0,
    cartRatePerGallon: 0,
    unit: 'pounds',
    poundsPer1000SqFt: 1.1, // High nitrogen - lower application rate
    poundsPerBag: 50,
    description: 'High nitrogen fertilizer',
    isActive: true,
    kioskTypes: ['fertilizer', 'mixed']
  },
  {
    name: '18-46-0 DAP',
    type: 'fertilizer',
    hoseRatePerGallon: 0,
    cartRatePerGallon: 0,
    unit: 'pounds',
    poundsPer1000SqFt: 1.7, // Phosphorus starter fertilizer
    poundsPerBag: 50,
    description: 'Diammonium phosphate starter fertilizer',
    isActive: true,
    kioskTypes: ['fertilizer', 'mixed']
  },
  {
    name: '0-0-60 Muriate of Potash',
    type: 'fertilizer',
    hoseRatePerGallon: 0,
    cartRatePerGallon: 0,
    unit: 'pounds',
    poundsPer1000SqFt: 1.0, // Potassium supplement
    poundsPerBag: 50,
    description: 'Potassium chloride fertilizer',
    isActive: true,
    kioskTypes: ['fertilizer', 'mixed']
  },
  {
    name: 'Lime (Calcium Carbonate)',
    type: 'fertilizer',
    hoseRatePerGallon: 0,
    cartRatePerGallon: 0,
    unit: 'pounds',
    poundsPer1000SqFt: 23.0, // Lime typically applied at higher rates
    poundsPerBag: 50,
    description: 'Agricultural lime for pH adjustment',
    isActive: true,
    kioskTypes: ['fertilizer', 'mixed']
  }
];

async function setupFertilizerProducts() {
  try {
    console.log('Setting up fertilizer products...');
    
    for (const product of fertilizerProducts) {
      await addDoc(collection(db, 'products'), product);
      console.log(`✅ Added: ${product.name}`);
    }
    
    console.log('🎉 Fertilizer products setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up fertilizer products:', error);
    process.exit(1);
  }
}

// Run the setup
setupFertilizerProducts();