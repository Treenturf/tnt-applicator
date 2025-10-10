import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJpp3leonardo95rs18uWiL9RB5IKo3A",
  authDomain: "tnt-applicator.firebaseapp.com",
  projectId: "tnt-applicator",
  storageBucket: "tnt-applicator.firebasestorage.app",
  messagingSenderId: "518326498030",
  appId: "1:518326498030:web:5a8f742ef13ae2e1c83eb8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_KIOSKS = [
  {
    id: 'main-terminal',
    name: 'Main Terminal',
    type: 'specialty',
    description: 'Primary loading station with all products',
    availableProducts: [],
    defaultTruckTypes: ['hose', 'cart'],
    calculationMode: 'both',
    units: { primary: 'gallons', secondary: 'pounds' },
    location: 'Main Building'
  },
  {
    id: 'specialty-kiosk',
    name: 'Specialty Applications Kiosk',
    type: 'specialty',
    description: 'Liquid chemicals and herbicides only',
    availableProducts: [],
    defaultTruckTypes: ['hose', 'cart'],
    calculationMode: 'liquid',
    units: { primary: 'gallons' },
    location: 'Bay 1'
  },
  {
    id: 'fertilizer-kiosk',
    name: 'Bagged Fertilizer Kiosk',
    type: 'fertilizer',
    description: 'Granular fertilizer products only',
    availableProducts: [],
    defaultTruckTypes: ['cart'],
    calculationMode: 'granular',
    units: { primary: 'bags', secondary: 'pounds' },
    location: 'Bay 2'
  }
];

async function setupKiosks() {
  try {
    console.log('🏭 Starting kiosk setup...\n');

    // Check if kiosks already exist
    const kiosksSnapshot = await getDocs(collection(db, 'kiosks'));
    console.log(`📊 Found ${kiosksSnapshot.docs.length} existing kiosks\n`);

    if (kiosksSnapshot.docs.length > 0) {
      console.log('⚠️  Kiosks already exist:');
      kiosksSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name} (${data.type})`);
      });
      console.log('\n❓ Skipping creation. Delete existing kiosks first if you want to recreate them.\n');
      return;
    }

    // Get all products to assign to kiosks
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`📦 Found ${products.length} products\n`);

    // Filter products by type
    const fertilizerProducts = products.filter(p => p.type === 'fertilizer').map(p => p.id);
    const specialtyProducts = products.filter(p => p.type !== 'fertilizer').map(p => p.id);
    const allProductIds = products.map(p => p.id);

    console.log(`   - ${fertilizerProducts.length} fertilizer products`);
    console.log(`   - ${specialtyProducts.length} specialty products`);
    console.log(`   - ${allProductIds.length} total products\n`);

    // Create kiosks with appropriate products
    for (const kiosk of DEFAULT_KIOSKS) {
      const kioskData = {
        ...kiosk,
        availableProducts: kiosk.type === 'fertilizer' 
          ? fertilizerProducts 
          : kiosk.type === 'specialty'
          ? specialtyProducts
          : allProductIds,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'kiosks'), kioskData);
      console.log(`✅ Created kiosk: ${kiosk.name}`);
      console.log(`   ID: ${docRef.id}`);
      console.log(`   Type: ${kiosk.type}`);
      console.log(`   Products: ${kioskData.availableProducts.length}`);
      console.log(`   Location: ${kiosk.location}\n`);
    }

    console.log('🎉 Kiosk setup completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up kiosks:', error);
    process.exit(1);
  }
}

setupKiosks();
