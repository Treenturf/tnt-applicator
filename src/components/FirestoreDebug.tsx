import React, { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, TextField, Box, Typography, Paper } from '@mui/material';

const FirestoreDebug: React.FC = () => {
  const [testCode, setTestCode] = useState('1234');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFirestore = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      console.log('Testing Firestore connection...');
      
      // Test 1: Get all users
      console.log('Fetching all users...');
      const usersRef = collection(db, 'users');
      const allUsersSnapshot = await getDocs(usersRef);
      
      const allUsers = allUsersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('All users found:', allUsers);
      
      // Test 2: Query specific user code
      console.log(`Querying for userCode: ${testCode}`);
      const q = query(usersRef, where('userCode', '==', testCode), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const foundUser = querySnapshot.empty ? null : {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      };
      
      console.log('Query result:', foundUser);
      
      setResults({
        allUsers,
        foundUser,
        queryCode: testCode,
        success: true
      });
      
    } catch (error) {
      console.error('Firestore test error:', error);
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>
        Firestore Debug Tool
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Test User Code"
          value={testCode}
          onChange={(e) => setTestCode(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button 
          variant="contained" 
          onClick={testFirestore}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Firestore'}
        </Button>
      </Box>

      {results && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Test Results:
          </Typography>
          
          {results.success ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                All Users in Database:
              </Typography>
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
                {JSON.stringify(results.allUsers, null, 2)}
              </pre>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Query Result for code "{results.queryCode}":
              </Typography>
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
                {JSON.stringify(results.foundUser, null, 2)}
              </pre>
              
              {results.foundUser ? (
                <Typography color="success.main" sx={{ mt: 1 }}>
                  ✅ User found! Login should work.
                </Typography>
              ) : (
                <Typography color="error.main" sx={{ mt: 1 }}>
                  ❌ No user found with code "{results.queryCode}" or user is inactive.
                </Typography>
              )}
            </>
          ) : (
            <Typography color="error.main">
              Error: {results.error}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FirestoreDebug;