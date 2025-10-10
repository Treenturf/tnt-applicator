import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function testAdminPanelLogic() {
  try {
    console.log('🔍 Testing AdminPanel logic...');
    
    const productsSnapshot = await getDocs(collection(db, 'products'));
    console.log('📊 Got snapshot with', productsSnapshot.docs.length, 'documents');
    
    const productsData = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('📦 Mapped products:', productsData.length);
    
    // Test the filter that AdminPanel uses
    const activeProducts = productsData.filter((p) => p.isActive);
    console.log('✅ Active products after filter:', activeProducts.length);
    
    // Show which products pass the filter
    activeProducts.forEach(p => {
      console.log('  ✓', p.name, '- isActive:', p.isActive);
    });
    
    // Show which products fail the filter
    const inactiveProducts = productsData.filter((p) => !p.isActive);
    console.log('❌ Inactive products:', inactiveProducts.length);
    inactiveProducts.forEach(p => {
      console.log('  ✗', p.name, '- isActive:', p.isActive);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAdminPanelLogic();