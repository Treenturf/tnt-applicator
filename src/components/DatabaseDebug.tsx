import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const DatabaseDebug: React.FC = () => {
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAllActivityLogs = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading ALL activity logs from database...');
      
      const logsSnapshot = await getDocs(collection(db, 'activityLogs'));
      const allLogs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('📊 Total activity logs found:', allLogs.length);
      console.log('📋 All logs:', allLogs);

      // Filter for specific users
      const user5555Logs = allLogs.filter(log => log.userCode === '5555');
      const user2222Logs = allLogs.filter(log => log.userCode === '2222');
      const calculationLogs = allLogs.filter(log => log.action === 'application_calculated');

      console.log('🔍 User 5555 logs:', user5555Logs.length, user5555Logs);
      console.log('🔍 User 2222 logs:', user2222Logs.length, user2222Logs);
      console.log('📊 All calculation logs:', calculationLogs.length, calculationLogs);

      // Check action types for these users
      const user5555Actions = user5555Logs.map((log: any) => log.action);
      const user2222Actions = user2222Logs.map((log: any) => log.action);
      const user5555CalcLogs = user5555Logs.filter((log: any) => log.action === 'application_calculated');
      const user2222CalcLogs = user2222Logs.filter((log: any) => log.action === 'application_calculated');

      console.log('🔍 User 5555 action types:', [...new Set(user5555Actions)]);
      console.log('🔍 User 2222 action types:', [...new Set(user2222Actions)]);
      console.log('✅ User 5555 calculation logs:', user5555CalcLogs.length, user5555CalcLogs);
      console.log('✅ User 2222 calculation logs:', user2222CalcLogs.length, user2222CalcLogs);

      // Check for any recent logs
      const today = new Date();
      const recentLogs = allLogs.filter((log: any) => {
        if (!log.timestamp) return false;
        const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        const daysDiff = Math.abs(today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // Within last week
      });

      console.log('📅 Recent logs (last 7 days):', recentLogs.length, recentLogs);

      setActivityLogs(allLogs);
    } catch (error) {
      console.error('❌ Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const user5555Logs = activityLogs.filter((log: any) => log.userCode === '5555');
  const user2222Logs = activityLogs.filter((log: any) => log.userCode === '2222');
  const calculationLogs = activityLogs.filter((log: any) => log.action === 'application_calculated');
  const user5555CalcLogs = user5555Logs.filter((log: any) => log.action === 'application_calculated');
  const user2222CalcLogs = user2222Logs.filter((log: any) => log.action === 'application_calculated');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Database Debug Tool
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={loadAllActivityLogs}
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? 'Loading...' : 'Load All Activity Logs'}
      </Button>

      <Typography variant="h6" gutterBottom>
        Summary: {activityLogs.length} total logs found
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        • User 5555: {user5555Logs.length} total logs, {user5555CalcLogs.length} calculation logs
      </Typography>
      <Typography variant="body1" gutterBottom>
        • User 2222: {user2222Logs.length} total logs, {user2222CalcLogs.length} calculation logs  
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        • All calculation logs: {calculationLogs.length}
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>User 5555 Logs ({user5555Logs.length} found)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(user5555Logs, null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>User 2222 Logs ({user2222Logs.length} found)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(user2222Logs, null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>All Calculation Logs ({calculationLogs.length} found)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(calculationLogs.slice(0, 10), null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>All User Codes Found</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {Array.from(new Set(activityLogs.map(log => log.userCode))).map(code => (
              <Typography key={code}>
                {code} ({activityLogs.filter(log => log.userCode === code).length} logs)
              </Typography>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DatabaseDebug;