import { supabase, isSupabaseAvailable, auth } from '../lib/supabase';

class MediaService {
  constructor() {
    this.bucketName = 'timeline-media';
  }

  // Upload a single file
  async uploadFile(file, eventId) {
    try {
      // Check if Supabase is available
      if (!isSupabaseAvailable() || !supabase) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      // Get current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${eventId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        path: fileName,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  // Upload multiple files
  async uploadFiles(files, eventId) {
    const uploadPromises = files.map(file => this.uploadFile(file, eventId));
    return Promise.all(uploadPromises);
  }

  // Delete a file
  async deleteFile(filePath) {
    try {
      if (!isSupabaseAvailable() || !supabase) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Get file URL
  getFileUrl(filePath) {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    return publicUrl;
  }

  // Validate file
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported');
    }

    return true;
  }

  // Compress image before upload (for better performance)
  async compressImage(file, quality = 0.8) {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920px width)
        const maxWidth = 1920;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate thumbnail for video/audio files
  async generateThumbnail(file) {
    if (!file.type.startsWith('video/')) {
      return null;
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = 320;
        canvas.height = 180;
        ctx.drawImage(video, 0, 0, 320, 180);
        
        canvas.toBlob((blob) => {
          const thumbnail = new File([blob], 'thumbnail.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(thumbnail);
        }, 'image/jpeg', 0.8);
      };

      video.src = URL.createObjectURL(file);
    });
  }
}

export default MediaService; 