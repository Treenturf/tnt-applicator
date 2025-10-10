import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZ3BhaRr7suy-RYqJBTJ6xGXCqXg1EVa0",
  authDomain: "tnt-applicator.firebaseapp.com",
  projectId: "tnt-applicator",
  storageBucket: "tnt-applicator.firebasestorage.app",
  messagingSenderId: "521751237733",
  appId: "1:521751237733:web:9bcac4f4b84e38838e85b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_KIOSKS = [
  {
    id: 'main-terminal',
    name: 'Main Terminal',
    type: 'specialty',
    description: 'Primary loading station - Admin access to all products and features',
    availableProducts: [], // Will show all products
    defaultTruckTypes: ['hose', 'cart'],
    calculationMode: 'both',
    units: { primary: 'gallons', secondary: 'pounds' },
    location: 'Main Office',
    isMainTerminal: true
  },
  {
    id: 'bagged-fertilizer-kiosk',
    name: 'Bagged Fertilizer Kiosk',
    type: 'fertilizer',
    description: 'Bagged fertilizer products only - Shows application rates per 1000 sq ft',
    availableProducts: [], // Will be filtered to fertilizer products
    defaultTruckTypes: ['cart'],
    calculationMode: 'granular',
    units: { primary: 'bags', secondary: 'pounds' },
    location: 'Fertilizer Bay'
  },
  {
    id: 'dry-fertilizer-kiosk',
    name: 'Dry Fertilizer Kiosk',
    type: 'fertilizer',
    description: 'Bulk dry fertilizer products',
    availableProducts: [], // Will be filtered to fertilizer products
    defaultTruckTypes: ['cart'],
    calculationMode: 'granular',
    units: { primary: 'bags', secondary: 'pounds' },
    location: 'Dry Storage'
  }
];

async function setupKiosks() {
  try {
    console.log('🏭 Setting up kiosks in Firestore...\n');

    // Check if kiosks already exist
    const kiosksSnapshot = await getDocs(collection(db, 'kiosks'));
    
    if (kiosksSnapshot.size > 0) {
      console.log(`⚠️  Found ${kiosksSnapshot.size} existing kiosk(s):`);
      kiosksSnapshot.forEach(doc => {
        console.log(`   - ${doc.data().name} (ID: ${doc.id})`);
      });
      console.log('\n🔄 Skipping kiosk creation to avoid duplicates.');
      console.log('💡 If you want to recreate kiosks, delete them in Firebase Console first.\n');
      return;
    }

    // Add each kiosk to Firestore
    for (const kiosk of DEFAULT_KIOSKS) {
      const kioskData = {
        ...kiosk,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const docRef = await addDoc(collection(db, 'kiosks'), kioskData);
      console.log(`✅ Created kiosk: ${kiosk.name}`);
      console.log(`   ID: ${docRef.id}`);
      console.log(`   Type: ${kiosk.type}`);
      console.log(`   Location: ${kiosk.location || 'Not specified'}`);
      console.log('');
    }

    console.log('🎉 All kiosks created successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - ${DEFAULT_KIOSKS.length} kiosks added to Firestore`);
    console.log('   - Main Terminal (specialty type) - Admin access');
    console.log('   - Bagged Fertilizer Kiosk (fertilizer type)');
    console.log('   - Dry Fertilizer Kiosk (fertilizer type)');
    console.log('\n✨ You can now select these kiosks in the app!');

  } catch (error) {
    console.error('❌ Error setting up kiosks:', error);
    process.exit(1);
  }

  process.exit(0);
}

setupKiosks();
