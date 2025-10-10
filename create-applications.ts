import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration (matching current firebase.ts)
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

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  hoseRate: number;
  cartRate: number;
  isActive: boolean;
}

async function createApplications() {
  try {
    console.log('Creating basic applications...');

    // Get the products first
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products: Product[] = productsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Omit<Product, 'id'>
    }));
    
    console.log('Available products:', products.length);
    products.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id})`);
    });

    if (products.length === 0) {
      console.log('No products found! Please run setup-data.ts first.');
      return;
    }

    // Create some basic applications
    const applications = [
      {
        name: "Standard Field Treatment",
        description: "Basic field treatment with fertilizer and herbicide",
        products: [
          {
            productId: products[0].id,
            productName: products[0].name,
            hoseRate: 2.5,
            cartRate: 3.0
          },
          {
            productId: products[2].id, // Herbicide if it exists
            productName: products[2]?.name || products[1].name,
            hoseRate: 1.5,
            cartRate: 2.0
          }
        ],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Fertilizer Only",
        description: "Fertilizer application only",
        products: [
          {
            productId: products[0].id,
            productName: products[0].name,
            hoseRate: 3.0,
            cartRate: 3.5
          }
        ],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Only add the second product if we have at least 2 products
    if (products.length >= 2) {
      applications.push({
        name: "Full Treatment Package",
        description: "Complete treatment with all available products",
        products: products.slice(0, Math.min(3, products.length)).map((product, index) => ({
          productId: product.id,
          productName: product.name,
          hoseRate: 2.0 + (index * 0.5),
          cartRate: 2.5 + (index * 0.5)
        })),
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Add applications to Firestore
    for (const application of applications) {
      const docRef = await addDoc(collection(db, 'applications'), application);
      console.log(`✅ Added application: ${application.name} (ID: ${docRef.id})`);
    }

    console.log('\n🎉 Applications created successfully!');
    console.log('You can now:');
    console.log('1. Log in with code 1234 (admin)');
    console.log('2. Go to Application Management to see your applications');
    console.log('3. Use the calculator with the default application');

  } catch (error) {
    console.error('❌ Error creating applications:', error);
  }
}

createApplications();