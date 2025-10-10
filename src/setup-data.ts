import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCopI_jKbudD3CM_TTOujiNeG0t2n_fqNk",
  authDomain: "tnt-app-cfced.firebaseapp.com",
  projectId: "tnt-app-cfced",
  storageBucket: "tnt-app-cfced.firebasestorage.app",
  messagingSenderId: "366696437511",
  appId: "1:366696437511:web:8fb32180f310212111d7a2",
  measurementId: "G-YSZF842SEZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupInitialData() {
  try {
    console.log('Setting up initial Firestore data...');

    // Create sample users
    const users = [
      {
        id: 'admin-1234',
        userCode: '1234',
        name: 'Admin User',
        role: 'admin',
        isActive: true
      },
      {
        id: 'applicator-2345',
        userCode: '2345',
        name: 'John Smith',
        role: 'applicator',
        isActive: true
      },
      {
        id: 'applicator-3456',
        userCode: '3456',
        name: 'Jane Doe',
        role: 'applicator',
        isActive: true
      },
      {
        id: 'applicator-4567',
        userCode: '4567',
        name: 'Mike Johnson',
        role: 'applicator',
        isActive: true
      }
    ];

    // Add users to Firestore
    for (const user of users) {
      await setDoc(doc(db, 'users', user.id), {
        userCode: user.userCode,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      });
      console.log(`Added user: ${user.name} (${user.userCode})`);
    }

    // Create sample products
    const products = [
      {
        name: 'Liquid Fertilizer 10-10-10',
        unit: 'gallons',
        category: 'fertilizer',
        isActive: true,
        color: '#4caf50',
        description: 'Balanced liquid fertilizer for general use'
      },
      {
        name: 'Nitrogen Fertilizer',
        unit: 'gallons',
        category: 'fertilizer',
        isActive: true,
        color: '#2196f3',
        description: 'High nitrogen content for leaf growth'
      },
      {
        name: 'Herbicide - Glyphosate',
        unit: 'gallons',
        category: 'herbicide',
        isActive: true,
        color: '#ff9800',
        description: 'Non-selective herbicide for weed control'
      },
      {
        name: 'Insecticide - Permethrin',
        unit: 'gallons',
        category: 'insecticide',
        isActive: true,
        color: '#f44336',
        description: 'Broad spectrum insecticide'
      }
    ];

    // Add products to Firestore
    for (const product of products) {
      const docRef = await addDoc(collection(db, 'products'), product);
      console.log(`Added product: ${product.name} (ID: ${docRef.id})`);
    }

    console.log('Initial data setup complete!');
    console.log('\nTest login codes:');
    users.forEach(user => {
      console.log(`${user.userCode} - ${user.name} (${user.role})`);
    });

  } catch (error) {
    console.error('Error setting up data:', error);
  }
}

// Run the setup if this script is executed directly
if (typeof window === 'undefined') {
  setupInitialData();
}

export { setupInitialData };