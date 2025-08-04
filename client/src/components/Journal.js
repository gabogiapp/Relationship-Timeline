import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Download, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Journal = () => {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Load journals on component mount
  React.useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJournals(data || []);
    } catch (error) {
      console.error('Error loading journals:', error);
      toast.error('Failed to load journals');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid file type (TXT, PDF, DOC, DOCX)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('journals')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('journals')
        .getPublicUrl(fileName);

      // Save journal entry to database
      const { error: dbError } = await supabase
        .from('journals')
        .insert({
          user_id: user.id,
          title: file.name,
          file_path: fileName,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type
        });

      if (dbError) throw dbError;

      toast.success('Journal uploaded successfully!');
      loadJournals(); // Reload the list
    } catch (error) {
      console.error('Error uploading journal:', error);
      toast.error('Failed to upload journal');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteJournal = async (journalId, filePath) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('journals')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('journals')
        .delete()
        .eq('id', journalId);

      if (dbError) throw dbError;

      toast.success('Journal deleted successfully!');
      loadJournals(); // Reload the list
    } catch (error) {
      console.error('Error deleting journal:', error);
      toast.error('Failed to delete journal');
    }
  };

  const downloadJournal = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading journal:', error);
      toast.error('Failed to download journal');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal</h1>
          <p className="text-gray-600">Upload and manage your journal entries</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upload Journal</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              {uploading ? 'Uploading...' : 'Upload Journal'}
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="text-sm text-gray-600">
            <p>Supported formats: TXT, PDF, DOC, DOCX</p>
            <p>Maximum file size: 5MB</p>
          </div>
        </div>

        {/* Journals List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Journals</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading journals...</div>
          ) : journals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No journals uploaded yet.</p>
              <p className="text-sm">Upload your first journal to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {journals.map((journal) => (
                <div key={journal.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText size={20} className="text-blue-600" />
                        <h3 className="font-medium text-gray-900">{journal.title}</h3>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Uploaded: {formatDate(journal.created_at)}</p>
                        <p>Size: {formatFileSize(journal.file_size)}</p>
                        <p>Type: {journal.file_type}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadJournal(journal.file_url, journal.title)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      
                      <button
                        onClick={() => deleteJournal(journal.id, journal.file_path)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;