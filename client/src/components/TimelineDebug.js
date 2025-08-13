import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { timelineAPI, userSharingAPI } from '../lib/timelineSharing';
import { supabase } from '../lib/supabase';

const TimelineDebug = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      runDebugTests();
    }
  }, [user]);

  const cleanupInactiveShares = async () => {
    try {
      const { data, error } = await supabase
        .from('timeline_shares')
        .delete()
        .eq('is_active', false)
        .select();

      if (error) {
        console.error('Error cleaning up inactive shares:', error);
        alert('Error cleaning up inactive shares: ' + error.message);
      } else {
        console.log('Cleaned up inactive shares:', data);
        alert(`Successfully cleaned up ${data?.length || 0} inactive shares`);
        runDebugTests(); // Refresh debug info
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
      alert('Error: ' + error.message);
    }
  };

  const resetAllShares = async () => {
    if (!window.confirm('This will DELETE ALL timeline sharing data. Are you sure?')) {
      return;
    }

    try {
      // Delete in order to avoid foreign key constraints
      await supabase.from('timeline_notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('timeline_activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('timeline_share_links').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { data, error } = await supabase.from('timeline_shares').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('Error resetting shares:', error);
        alert('Error resetting shares: ' + error.message);
      } else {
        console.log('Reset all sharing data');
        alert('Successfully reset all timeline sharing data');
        runDebugTests(); // Refresh debug info
      }
    } catch (error) {
      console.error('Error in reset:', error);
      alert('Error: ' + error.message);
    }
  };

  const runDebugTests = async () => {
    const debug = {};
    
    try {
      // Test 1: Basic user info
      debug.user = {
        id: user.id,
        email: user.email,
        username: user.username
      };

      // Test 2: Check if tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('timelines')
        .select('count')
        .limit(1);
      debug.tablesExist = !tablesError;
      if (tablesError) debug.tablesError = tablesError.message;

      // Test 3: Get owned timelines directly
      const { data: ownedTimelines, error: ownedError } = await supabase
        .from('timelines')
        .select('*')
        .eq('owner_id', user.id);
      debug.ownedTimelines = {
        count: ownedTimelines?.length || 0,
        data: ownedTimelines,
        error: ownedError?.message
      };

      // Test 4: Get ALL shared timelines (ignoring is_active filter)
      const { data: allShares, error: allSharesError } = await supabase
        .from('timeline_shares')
        .select('*');
      debug.allShares = {
        count: allShares?.length || 0,
        data: allShares,
        error: allSharesError?.message
      };

      // Test 4b: Get shared timelines directly (with is_active filter)
      const { data: sharedTimelines, error: sharedError } = await supabase
        .from('timeline_shares')
        .select(`
          *,
          timelines (*)
        `)
        .eq('is_active', true)
        .eq('shared_with_user_id', user.id);
      debug.sharedTimelines = {
        count: sharedTimelines?.length || 0,
        data: sharedTimelines,
        error: sharedError?.message
      };

      // Test 5: Get shared timelines by email
      const { data: sharedByEmail, error: emailError } = await supabase
        .from('timeline_shares')
        .select(`
          *,
          timelines (*)
        `)
        .eq('is_active', true)
        .eq('shared_with_email', user.email);
      debug.sharedByEmail = {
        count: sharedByEmail?.length || 0,
        data: sharedByEmail,
        error: emailError?.message
      };

      // Test 6: Test the getUserTimelines API function
      const apiTimelines = await timelineAPI.getUserTimelines(user.id);
      debug.apiTimelines = {
        count: apiTimelines?.length || 0,
        data: apiTimelines
      };

      // Test 7: Check for UUID format issues
      const { data: uuidTestShares, error: uuidError } = await supabase
        .from('timeline_shares')
        .select('*')
        .or(`shared_with_user_id.eq."${user.id}",shared_with_email.eq."${user.email}"`);
      debug.uuidTestShares = {
        count: uuidTestShares?.length || 0,
        data: uuidTestShares,
        error: uuidError?.message
      };

      // Test 8: Check notifications
      const { data: notifications, error: notifError } = await supabase
        .from('timeline_notifications')
        .select('*')
        .eq('user_id', user.id)
        .limit(10);
      debug.notifications = {
        count: notifications?.length || 0,
        data: notifications,
        error: notifError?.message
      };

    } catch (error) {
      debug.generalError = error.message;
    }

    setDebugInfo(debug);
    setLoading(false);
  };

  if (loading) {
    return <div>Running debug tests...</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h2>Timeline Debug Information</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Actions</h3>
        <button 
          onClick={runDebugTests} 
          style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🔄 Refresh Debug Info
        </button>
        <button 
          onClick={cleanupInactiveShares} 
          style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🧹 Clean Up Inactive Shares
        </button>
        <button 
          onClick={resetAllShares} 
          style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          💥 Reset All Sharing Data
        </button>
      </div>

      <pre style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', overflow: 'auto', maxHeight: '600px' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

export default TimelineDebug;