import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration - update with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAmnBFnShHN1THjgj4TKHkfAKd5mYdJhKs",
  authDomain: "tnt-react-app-24681.firebaseapp.com",
  projectId: "tnt-react-app-24681",
  storageBucket: "tnt-react-app-24681.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fertilizer products with correct pounds per 1000 sq ft rates
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
    name: 'Agricultural Lime',
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
      console.log(`✅ Added: ${product.name} (${product.poundsPer1000SqFt} lbs/1000 sq ft)`);
    }
    
    console.log('\n🎉 All fertilizer products added successfully!');
    console.log('These products use pounds per 1000 square feet application rates.');
  } catch (error) {
    console.error('❌ Error setting up fertilizer products:', error);
  }
}

setupFertilizerProducts();