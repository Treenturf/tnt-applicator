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

async function checkApplications() {
  try {
    console.log('🔍 Checking applications in Firestore...\n');
    
    const applicationsSnapshot = await getDocs(collection(db, 'applications'));
    
    if (applicationsSnapshot.empty) {
      console.log('❌ No applications found in Firestore');
      return;
    }
    
    console.log(`✅ Found ${applicationsSnapshot.size} application(s)\n`);
    
    applicationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('📦 Application ID:', doc.id);
      console.log('   Name:', data.name);
      console.log('   Category:', data.category);
      console.log('   Available Kiosks:', data.availableKiosks || 'NOT SET');
      console.log('   Application Category:', data.applicationCategory || 'NOT SET');
      console.log('   Is Active:', data.isActive);
      console.log('   Products:');
      
      if (data.products && data.products.length > 0) {
        data.products.forEach(product => {
          console.log(`     - ${product.productName} (${product.productType})`);
          console.log(`       Equipment Types: ${product.equipmentTypes || product.truckTypes || 'NOT SET'}`);
          console.log(`       Rates: H:${product.hoseRate} C:${product.cartRate} ${product.unit}/gal`);
        });
      } else {
        console.log('     (No products)');
      }
      
      console.log('');
      
      // Special attention to "3-way" or any application with CHem stik
      if (data.name && (data.name.toLowerCase().includes('3-way') || data.name.toLowerCase().includes('3 way'))) {
        console.log('🚨 FOUND 3-WAY APPLICATION! Current kiosk availability:', data.availableKiosks);
      }
      
      if (data.products) {
        data.products.forEach(product => {
          if (product.productName && product.productName.toLowerCase().includes('chem stik')) {
            console.log('🚨 FOUND CHem stik PRODUCT in application:', data.name);
            console.log('   Application kiosk availability:', data.availableKiosks);
            console.log('   Product equipment types:', product.equipmentTypes || product.truckTypes);
          }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkApplications();