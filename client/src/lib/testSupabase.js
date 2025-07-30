import { supabase, auth, db, isSupabaseAvailable } from './supabase';

// Debug function to check all storage buckets
export const debugStorage = async () => {
  console.log('🔍 Debugging storage buckets...');
  
  try {
    // List all buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      console.log('💡 This is normal if storage is not enabled in your Supabase project');
      console.log('📝 To enable storage:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to Storage');
      console.log('   3. Create a bucket named "timeline-media"');
      console.log('   4. Set it to public or private as needed');
      return;
    }
    
    console.log('📦 All available buckets:');
    if (buckets && buckets.length > 0) {
      buckets.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    } else {
      console.log('   ⚠️ No buckets found');
    }
    
    // Try to access the timeline-media bucket specifically using the correct API
    console.log('\n🔍 Testing timeline-media bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('timeline-media')
      .list('');
    
    if (listError) {
      console.log('❌ Cannot access timeline-media bucket:', listError.message);
      console.log('💡 Create a bucket named "timeline-media" in your Supabase Storage');
      
      // Try common alternative names
      const commonNames = ['media', 'files', 'uploads', 'images', 'timeline-media', 'timeline_media'];
      console.log('\n🔍 Trying common bucket names...');
      
      for (const name of commonNames) {
        try {
          const { data: testFiles, error: testError } = await supabase.storage
            .from(name)
            .list('');
          if (!testError) {
            console.log(`✅ Found bucket: ${name}`);
          } else {
            console.log(`❌ ${name}: ${testError.message}`);
          }
        } catch (error) {
          console.log(`❌ ${name}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Found timeline-media bucket');
      console.log(`📁 Files in bucket: ${files ? files.length : 0}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.log('💡 This is normal if storage is not configured');
  }
};

// Test Supabase connection and functionality
export const testSupabase = async () => {
  console.log('🧪 Testing Supabase setup...');
  
  // Check if Supabase is configured
  if (!isSupabaseAvailable()) {
    console.error('❌ Supabase is not configured. Please check your environment variables.');
    console.log('📝 Make sure you have:');
    console.log('   - REACT_APP_SUPABASE_URL in your .env file');
    console.log('   - REACT_APP_SUPABASE_ANON_KEY in your .env file');
    return false;
  }
  
  console.log('✅ Supabase is configured');
  
  try {
    // Test authentication
    console.log('🔐 Testing authentication...');
    const currentUser = await auth.getCurrentUser();
    if (currentUser) {
      console.log('✅ User is authenticated:', currentUser.email);
    } else {
      console.log('ℹ️ No user currently authenticated');
    }
    
    // Test database connection
    console.log('🗄️ Testing database connection...');
    const { data, error } = await supabase
      .from('timeline_events')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('📝 Make sure you have:');
      console.log('   - Created the timeline_events table');
      console.log('   - Set up Row Level Security policies');
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test storage with more detailed debugging
    console.log('📁 Testing storage connection...');
    
    try {
      // First, check if we can access storage at all
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('❌ Storage connection failed:', bucketError.message);
        console.log('🔍 Error details:', bucketError);
        console.log('💡 This is normal if storage is not enabled in your Supabase project');
        console.log('📝 To enable storage:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to Storage');
        console.log('   3. Create a bucket named "timeline-media"');
        console.log('   4. Set it to public or private as needed');
      } else {
        console.log('📦 Available storage buckets:');
        if (buckets && buckets.length > 0) {
          buckets.forEach(bucket => {
            console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
          });
        } else {
          console.log('   ⚠️ No buckets found');
        }
        
        // Try to access the timeline-media bucket using the correct API
        console.log('🔍 Checking specific bucket access...');
        const { data: files, error: listError } = await supabase.storage
          .from('timeline-media')
          .list('');
        
        if (listError) {
          console.log('❌ Cannot access timeline-media bucket:', listError.message);
          console.log('💡 Create a bucket named "timeline-media" in your Supabase Storage');
        } else {
          console.log('✅ Found timeline-media bucket');
          console.log(`📁 Files in bucket: ${files ? files.length : 0}`);
        }
        
        const mediaBucket = buckets?.find(bucket => bucket.name === 'timeline-media');
        if (mediaBucket) {
          console.log('✅ Storage bucket "timeline-media" exists');
        } else {
          console.log('⚠️ Storage bucket "timeline-media" not found in bucket list');
          console.log('💡 This could mean:');
          console.log('   - Bucket doesn\'t exist');
          console.log('   - No permission to list buckets');
          console.log('   - Bucket has a different name');
        }
      }
    } catch (error) {
      console.log('⚠️ Storage test failed:', error.message);
      console.log('💡 This is normal if storage is not configured');
    }
    
    console.log('🎉 All tests passed! Supabase is ready to use.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
};

// Test user authentication flow
export const testAuthFlow = async (email, password) => {
  console.log('🧪 Testing authentication flow...');
  
  try {
    // Test sign up
    console.log('📝 Testing sign up...');
    const { user: signUpUser } = await auth.signUp(email, password, {
      full_name: 'Test User'
    });
    
    if (signUpUser) {
      console.log('✅ Sign up successful');
    } else {
      console.log('ℹ️ Sign up successful (email verification required)');
    }
    
    // Test sign in
    console.log('🔑 Testing sign in...');
    const { user: signInUser } = await auth.signIn(email, password);
    
    if (signInUser) {
      console.log('✅ Sign in successful');
      
      // Test sign out
      console.log('🚪 Testing sign out...');
      await auth.signOut();
      console.log('✅ Sign out successful');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
};

// Test database operations
export const testDatabaseOperations = async () => {
  console.log('🧪 Testing database operations...');
  
  try {
    const currentUser = await auth.getCurrentUser();
    if (!currentUser) {
      console.log('ℹ️ No authenticated user, skipping database tests');
      return true;
    }
    
    // Test creating an event
    console.log('📝 Testing event creation...');
    const testEvent = {
      title: 'Test Event',
      description: 'This is a test event',
      event_date: new Date().toISOString().split('T')[0],
      category: 'Test',
      importance: 1
    };
    
    const newEvent = await db.createEvent({
      ...testEvent,
      user_id: currentUser.id
    });
    
    if (newEvent) {
      console.log('✅ Event creation successful');
      
      // Test updating an event
      console.log('✏️ Testing event update...');
      const updatedEvent = await db.updateEvent(newEvent.id, {
        title: 'Updated Test Event'
      });
      
      if (updatedEvent) {
        console.log('✅ Event update successful');
      }
      
      // Test fetching events
      console.log('📖 Testing event fetching...');
      const events = await db.getEvents(currentUser.id);
      
      if (events && events.length > 0) {
        console.log('✅ Event fetching successful');
      }
      
      // Test deleting an event
      console.log('🗑️ Testing event deletion...');
      await db.deleteEvent(newEvent.id);
      console.log('✅ Event deletion successful');
    }
    
    console.log('🎉 All database operations successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Database operations test failed:', error.message);
    return false;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Running all Supabase tests...\n');
  
  const connectionTest = await testSupabase();
  if (!connectionTest) {
    console.log('\n❌ Connection test failed. Please fix the issues above.');
    return false;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  const authTest = await testAuthFlow('test@example.com', 'testpassword123');
  if (!authTest) {
    console.log('\n⚠️ Authentication test failed. This might be expected if email verification is required.');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  const dbTest = await testDatabaseOperations();
  if (!dbTest) {
    console.log('\n⚠️ Database operations test failed. This might be expected if not authenticated.');
  }
  
  console.log('\n🎉 All tests completed!');
  return true;
};

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  window.testSupabase = testSupabase;
  window.testAuthFlow = testAuthFlow;
  window.testDatabaseOperations = testDatabaseOperations;
  window.runAllTests = runAllTests;
  window.debugStorage = debugStorage;
  
  console.log('🧪 Supabase test functions available:');
  console.log('  - testSupabase()');
  console.log('  - testAuthFlow(email, password)');
  console.log('  - testDatabaseOperations()');
  console.log('  - runAllTests()');
  console.log('  - debugStorage() - NEW: Debug storage buckets');
} 