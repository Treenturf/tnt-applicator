// Simple JavaScript version to add sample data to Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';

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

async function addSampleUsers() {
  console.log('🚀 Adding sample users to Firestore...');
  
  try {
    // Add admin user
    await setDoc(doc(db, 'users', 'admin-1234'), {
      userCode: '1234',
      name: 'Admin User',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Added: Admin User (1234)');

    // Add applicator 1
    await setDoc(doc(db, 'users', 'applicator-2345'), {
      userCode: '2345',
      name: 'John Smith',
      role: 'applicator',
      isActive: true
    });
    console.log('✅ Added: John Smith (2345)');

    // Add applicator 2
    await setDoc(doc(db, 'users', 'applicator-3456'), {
      userCode: '3456',
      name: 'Jane Doe',
      role: 'applicator',
      isActive: true
    });
    console.log('✅ Added: Jane Doe (3456)');

    console.log('🎉 Sample users added successfully!');
    console.log('');
    console.log('Test these login codes:');
    console.log('- 1234 (Admin User)');
    console.log('- 2345 (John Smith)');
    console.log('- 3456 (Jane Doe)');
    
  } catch (error) {
    console.error('❌ Error adding users:', error);
  }
}

addSampleUsers();