import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCIthSdJ2S0CJfTy3VtEzpwWWTQMukG6SM",
  authDomain: "tnt-app-a5ab7.firebaseapp.com",
  projectId: "tnt-app-a5ab7",
  storageBucket: "tnt-app-a5ab7.firebasestorage.app",
  messagingSenderId: "393529809408",
  appId: "1:393529809408:web:f603aa43f30e880698e870"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkKiosks() {
  try {
    console.log('🔍 Checking kiosks in Firestore...\n');
    
    const kiosksSnapshot = await getDocs(collection(db, 'kiosks'));
    
    if (kiosksSnapshot.empty) {
      console.log('❌ No kiosks found in Firestore');
      return;
    }
    
    console.log(`✅ Found ${kiosksSnapshot.size} kiosk(s)\n`);
    
    kiosksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('📦 Kiosk ID:', doc.id);
      console.log('   Name:', data.name);
      console.log('   Type:', data.type);
      console.log('   Available Products:', data.availableProducts || []);
      console.log('   Product Count:', (data.availableProducts || []).length);
      console.log('   Description:', data.description);
      console.log('');
    });
    
    // Also check products
    console.log('\n🔍 Checking products in Firestore...\n');
    const productsSnapshot = await getDocs(collection(db, 'products'));
    
    if (productsSnapshot.empty) {
      console.log('❌ No products found in Firestore');
      return;
    }
    
    console.log(`✅ Found ${productsSnapshot.size} product(s)\n`);
    
    productsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('📦 Product ID:', doc.id);
      console.log('   Name:', data.name);
      console.log('   Category:', data.category);
      console.log('   Kiosk Types:', data.kioskTypes || []);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkKiosks();
