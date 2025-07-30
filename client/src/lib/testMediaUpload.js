import { supabase, isSupabaseAvailable } from './supabase';
import MediaService from '../services/mediaService';

// Test media upload functionality
export const testMediaUpload = async () => {
  console.log('🧪 Testing Media Upload...');
  
  try {
    // Check if Supabase is available
    if (!isSupabaseAvailable()) {
      console.log('❌ Supabase not configured');
      return;
    }
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ User not authenticated:', userError?.message || 'No user found');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('🆔 User ID:', user.id);
    
    // Test MediaService
    const mediaService = new MediaService();
    console.log('✅ MediaService instantiated');
    
    // Test file validation
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    try {
      mediaService.validateFile(testFile);
      console.log('❌ File validation should have failed for text file');
    } catch (error) {
      console.log('✅ File validation working (rejected text file):', error.message);
    }
    
    // Test with a valid image file (mock)
    const mockImageFile = new File(['fake image data'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(mockImageFile, 'size', { value: 1024 }); // 1KB
    
    try {
      mediaService.validateFile(mockImageFile);
      console.log('✅ File validation passed for mock image');
    } catch (error) {
      console.log('❌ File validation failed for mock image:', error.message);
    }
    
    console.log('🎉 Media upload test completed!');
    
  } catch (error) {
    console.error('❌ Media upload test failed:', error);
  }
};

// Test storage bucket access
export const testStorageAccess = async () => {
  console.log('🔍 Testing Storage Access...');
  
  try {
    // List buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.log('❌ Error listing buckets:', bucketError.message);
      return;
    }
    
    console.log('📦 Available buckets:', buckets?.map(b => b.name) || []);
    
    // Check timeline-media bucket specifically
    const { data: files, error: listError } = await supabase.storage
      .from('timeline-media')
      .list('');
    
    if (listError) {
      console.log('❌ Cannot access timeline-media bucket:', listError.message);
      console.log('💡 Make sure the bucket exists and has proper policies');
    } else {
      console.log('✅ timeline-media bucket accessible');
      console.log(`📁 Files in bucket: ${files?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Storage access test failed:', error);
  }
}; 