import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase config - make sure to match your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAob8CNz-KcDPE8OYy5GVRgFCKXzf5K_c4",
  authDomain: "tnt-applicator-fb226.firebaseapp.com",
  projectId: "tnt-applicator-fb226",
  storageBucket: "tnt-applicator-fb226.firebasestorage.app",
  messagingSenderId: "781445265594",
  appId: "1:781445265594:web:e062d7c78f615b9a25397f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findAndCleanupDuplicateUsers() {
  try {
    console.log('🔍 Loading all users...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📊 Total users found: ${users.length}`);
    
    // Group users by name to find duplicates
    const usersByName = {};
    users.forEach(user => {
      const name = user.name?.toLowerCase();
      if (!name) return;
      
      if (!usersByName[name]) {
        usersByName[name] = [];
      }
      usersByName[name].push(user);
    });
    
    // Find and display duplicates
    console.log('\n📋 All users:');
    users.forEach(user => {
      console.log(`👤 ${user.name} (${user.userCode}) - ${user.role} - Active: ${user.isActive} - ID: ${user.id}`);
    });
    
    console.log('\n🔍 Looking for duplicates...');
    let foundDuplicates = false;
    
    Object.keys(usersByName).forEach(name => {
      const duplicates = usersByName[name];
      if (duplicates.length > 1) {
        foundDuplicates = true;
        console.log(`\n⚠️  Found ${duplicates.length} users named "${duplicates[0].name}":`);
        duplicates.forEach((user, index) => {
          console.log(`   ${index + 1}. Role: ${user.role}, Code: ${user.userCode}, ID: ${user.id}`);
        });
      }
    });
    
    if (!foundDuplicates) {
      console.log('✅ No duplicate users found!');
      return;
    }
    
    console.log('\n💡 To remove duplicates:');
    console.log('1. Note the ID of the user you want to KEEP');
    console.log('2. Run: node cleanup-duplicate-users.mjs delete [USER_ID_TO_DELETE]');
    console.log('3. Example: node cleanup-duplicate-users.mjs delete abc123def456');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function deleteUser(userId) {
  try {
    console.log(`🗑️  Deleting user with ID: ${userId}`);
    await deleteDoc(doc(db, 'users', userId));
    console.log('✅ User deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  }
}

// Command line handling
const args = process.argv.slice(2);
const command = args[0];
const userId = args[1];

if (command === 'delete' && userId) {
  deleteUser(userId);
} else {
  findAndCleanupDuplicateUsers();
}