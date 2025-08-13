// ===============================================
// MEDIA UPLOAD TEST SCRIPT
// ===============================================
// Run this in your browser console to test media upload functionality

console.log('🧪 Starting Media Upload Test...');

// Test function to verify media upload functionality
async function testMediaUpload() {
    try {
        // Import required modules (run this in browser console where these are available)
        const { supabase } = window.supabaseClient || require('./client/src/lib/supabase');
        
        console.log('1. 📋 Checking Supabase connection...');
        
        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('❌ User not authenticated:', userError);
            return;
        }
        console.log('✅ User authenticated:', user.email);
        
        // Check if timeline-media bucket exists
        console.log('2. 🗂️ Checking storage bucket...');
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
            console.error('❌ Error checking buckets:', bucketError);
            return;
        }
        
        const mediaBucket = buckets.find(b => b.id === 'timeline-media');
        if (!mediaBucket) {
            console.error('❌ timeline-media bucket not found');
            return;
        }
        console.log('✅ timeline-media bucket exists:', mediaBucket);
        
        // Check media_files table structure
        console.log('3. 📊 Checking media_files table...');
        const { data: tableData, error: tableError } = await supabase
            .from('media_files')
            .select('*')
            .limit(1);
        
        if (tableError) {
            console.error('❌ Error accessing media_files table:', tableError);
            return;
        }
        console.log('✅ media_files table accessible');
        
        // Test file upload simulation
        console.log('4. 📤 Testing file upload simulation...');
        
        // Create a small test blob (1x1 pixel PNG)
        const testBlob = new Blob([
            new Uint8Array([
                137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 0, 0, 0, 1, 0, 1, 2, 117, 1, 24, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
            ])
        ], { type: 'image/png' });
        
        const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
        const fileName = `${user.id}/test/${Date.now()}.png`;
        
        // Upload test file
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('timeline-media')
            .upload(fileName, testFile);
        
        if (uploadError) {
            console.error('❌ File upload failed:', uploadError);
            return;
        }
        console.log('✅ File uploaded successfully:', uploadData);
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('timeline-media')
            .getPublicUrl(fileName);
        
        console.log('✅ Public URL generated:', publicUrl);
        
        // Clean up - delete test file
        const { error: deleteError } = await supabase.storage
            .from('timeline-media')
            .remove([fileName]);
        
        if (deleteError) {
            console.warn('⚠️ Could not delete test file:', deleteError);
        } else {
            console.log('✅ Test file cleaned up');
        }
        
        console.log('🎉 All media upload tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Instructions for running the test
console.log(`
📝 INSTRUCTIONS:
1. First, run the complete_media_system_fix.sql in your Supabase SQL editor
2. Open your React app in browser and login
3. Open browser dev tools console
4. Copy and paste this entire script
5. Run: testMediaUpload()

🔧 If tests fail, check:
- Supabase connection is working
- You're logged in
- SQL script was executed successfully
- Storage bucket exists and has correct policies
`);

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testMediaUpload };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.testMediaUpload = testMediaUpload;
}