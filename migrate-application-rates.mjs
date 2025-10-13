import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDo3xG8_xCGq2zl9mZgDPQhMNhqbCQjjqQ",
  authDomain: "tntapp-f8a28.firebaseapp.com",
  projectId: "tntapp-f8a28",
  storageBucket: "tntapp-f8a28.firebasestorage.app",
  messagingSenderId: "764748842885",
  appId: "1:764748842885:web:48dc7e7de567f7e2c86de0",
  measurementId: "G-9H6VNY2HQL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateApplicationRates() {
  try {
    console.log('🔄 Starting application rate migration...\n');

    // Get all products first
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const productsMap = new Map();
    
    productsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      productsMap.set(doc.id, {
        id: doc.id,
        name: data.name,
        trailerRatePerGallon: data.trailerRatePerGallon || 0,
        backpackRatePerGallon: data.backpackRatePerGallon || 0,
        hoseRatePerGallon: data.hoseRatePerGallon || 0,
        cartRatePerGallon: data.cartRatePerGallon || 0
      });
    });

    console.log(`📦 Loaded ${productsMap.size} products\n`);

    // Get all applications
    const applicationsSnapshot = await getDocs(collection(db, 'applications'));
    
    for (const appDoc of applicationsSnapshot.docs) {
      const appData = appDoc.data();
      console.log(`\n🔧 Processing application: ${appData.name}`);
      
      if (!appData.products || appData.products.length === 0) {
        console.log('  ⚠️  No products in this application');
        continue;
      }

      // Update each product in the application
      const updatedProducts = appData.products.map(appProduct => {
        const productInfo = productsMap.get(appProduct.productId);
        
        if (!productInfo) {
          console.log(`  ❌ Product not found: ${appProduct.productName} (${appProduct.productId})`);
          return appProduct;
        }

        console.log(`  📝 Updating product: ${appProduct.productName}`);
        console.log(`     - Current hoseRate: ${appProduct.hoseRate || 0}`);
        console.log(`     - Current cartRate: ${appProduct.cartRate || 0}`);
        console.log(`     - Current trailerRate: ${appProduct.trailerRate || 'undefined'}`);
        console.log(`     - Current backpackRate: ${appProduct.backpackRate || 'undefined'}`);
        console.log(`     - Product trailerRate: ${productInfo.trailerRatePerGallon}`);
        console.log(`     - Product backpackRate: ${productInfo.backpackRatePerGallon}`);

        return {
          ...appProduct,
          trailerRate: appProduct.trailerRate !== undefined ? appProduct.trailerRate : productInfo.trailerRatePerGallon,
          backpackRate: appProduct.backpackRate !== undefined ? appProduct.backpackRate : productInfo.backpackRatePerGallon
        };
      });

      // Update the application in Firestore
      await updateDoc(doc(db, 'applications', appDoc.id), {
        products: updatedProducts
      });

      console.log(`  ✅ Updated application: ${appData.name}`);
    }

    console.log('\n\n🎉 Migration completed successfully!');
    console.log('All applications have been updated with trailer and backpack rates.');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  }
}

migrateApplicationRates();
