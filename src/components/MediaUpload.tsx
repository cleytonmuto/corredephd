import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from 'firebase/storage';
import { storage } from '../firebase/config';
import './MediaUpload.css';

interface MediaUploadProps {
  onUploadComplete: (url: string, fileName: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function MediaUpload({ 
  onUploadComplete, 
  accept = 'image/*,video/*,.pdf,.doc,.docx',
  maxSizeMB = 10,
  label = 'Upload Media'
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `media/${fileName}`);

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progressPercent);
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Failed to upload file. Please try again.');
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(downloadURL, file.name);
          setUploading(false);
          setProgress(0);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="media-upload">
      <label className="media-upload-label">{label}</label>
      <div className="media-upload-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={uploading}
          className="media-upload-button"
        >
          {uploading ? 'Uploading...' : 'Choose File'}
        </button>
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
      {error && <div className="upload-error">{error}</div>}
      <small className="upload-hint">
        Accepted: Images, Videos, PDF, DOC (Max {maxSizeMB}MB)
      </small>
    </div>
  );
}

