import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface UserProfile {
  userCode: string;
  name: string;
  role: 'admin' | 'manager' | 'applicator';
  isActive: boolean;
  canAccessReports?: boolean; // Optional permission for managers to access reports
}

interface AuthContextType {
  user: UserProfile | null;
  login: (userCode: string) => Promise<boolean>;
  logout: (reason?: string) => Promise<void>;
  loading: boolean;
  saveCurrentSession: (calculationData: any) => void; // New function to store session data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSessionData, setCurrentSessionData] = useState<any>(null);

  // Auto-logout functionality
  const IDLE_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Track user activity
  const resetIdleTimer = () => {
    setLastActivity(Date.now());
  };

  // Set up activity listeners and idle timer
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners for user activity
    const resetTimer = () => resetIdleTimer();
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Set up interval to check for idle timeout
    const interval = setInterval(() => {
      if (user && Date.now() - lastActivity > IDLE_TIME) {
        console.log('🕐 User has been idle for 10 minutes, logging out...');
        logout('Automatic logout - 10 minutes of inactivity');
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      clearInterval(interval);
    };
  }, [user, lastActivity]);

  // Check if user is stored in localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('tnt-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        resetIdleTimer(); // Reset timer when user is loaded from storage
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('tnt-user');
      }
    }
  }, []);

  const login = async (userCode: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('🔍 Starting login process for code:', userCode);
      
      // Query Firestore for user with this code
      const usersRef = collection(db, 'users');
      console.log('📊 Querying users collection...');
      
      const q = query(usersRef, where('userCode', '==', userCode), where('isActive', '==', true));
      console.log('🔎 Query created, executing...');
      
      const querySnapshot = await getDocs(q);
      console.log('📝 Query executed. Empty?', querySnapshot.empty);
      console.log('📊 Documents found:', querySnapshot.size);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserProfile;
        console.log('✅ User found:', userData);
        
        // Debug manager reports permission
        if (userData.role === 'manager') {
          console.log('👔 Manager user logged in - canAccessReports:', userData.canAccessReports);
        }
        
        setUser(userData);
        localStorage.setItem('tnt-user', JSON.stringify(userData));
        resetIdleTimer(); // Start idle timer on successful login
        
        // Log the login activity
        console.log('📊 Logging activity...');
        await logActivity(userData, 'Login', 'User logged in');
        console.log('✅ Login successful!');
        
        return true;
      } else {
        console.error('❌ Invalid user code or inactive user');
        
        // Let's also try to see what users exist
        const allUsersSnapshot = await getDocs(usersRef);
        console.log('📊 All users in database:', allUsersSnapshot.size);
        allUsersSnapshot.docs.forEach(doc => {
          console.log('👤 User:', doc.id, doc.data());
        });
        
        return false;
      }
    } catch (error) {
      console.error('💥 Error during login:', error);
      console.error('Error details:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (reason = 'Manual logout') => {
    console.log('🚪 Starting logout process...', reason);
    try {
      if (user) {
        console.log('📊 Logging logout activity for user:', user.name);
        
        // Save current application session if data exists
        if (currentSessionData && currentSessionData.calculations && currentSessionData.calculations.length > 0) {
          console.log('💾 Saving current application session...');
          await saveApplicationOnLogout(user, currentSessionData, reason);
        }
        
        await logActivity(user, 'Logout', reason);
      }
    } catch (error) {
      console.error('❌ Error logging logout activity:', error);
    }
    
    console.log('🧹 Clearing user state and localStorage...');
    setUser(null);
    setCurrentSessionData(null); // Clear session data
    localStorage.removeItem('tnt-user');
    
    // Clear all localStorage items that might be related
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('tnt') || key.includes('user') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Logout complete');
  };

  // Function to save current session data from Calculator
  const saveCurrentSession = useCallback((calculationData: any) => {
    setCurrentSessionData(calculationData);
  }, []);

  // Function to save application data on logout
  const saveApplicationOnLogout = async (user: UserProfile, sessionData: any, logoutReason: string) => {
    try {
      const applicationData = {
        userCode: user.userCode,
        userName: user.name,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        timestamp: serverTimestamp(),
        calculations: sessionData.calculations,
        gallons: sessionData.gallons,
        tankSelection: sessionData.tankSelection,
        tank1Gallons: sessionData.tank1Gallons,
        tank2Gallons: sessionData.tank2Gallons,
        truckType: sessionData.truckType,
        logoutReason: logoutReason,
        autoSaved: true,
        
        // Summary information
        totalProducts: sessionData.calculations.length,
        productList: sessionData.calculations.map((calc: any) => ({
          productName: calc.product.name,
          productType: calc.product.type,
          amount: calc.totalAmount,
          unit: calc.product.unit || 'units'
        }))
      };

      await addDoc(collection(db, 'applications'), applicationData);
      console.log('✅ Application data saved successfully on logout');
    } catch (error) {
      console.error('❌ Error saving application data on logout:', error);
    }
  };

  // Helper function to log activities
  const logActivity = async (user: UserProfile, action: string, details: string) => {
    try {
      await addDoc(collection(db, 'activityLogs'), {
        userCode: user.userCode,
        userName: user.name,
        action,
        details,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    saveCurrentSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};