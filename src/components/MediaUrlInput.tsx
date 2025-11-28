import { useState } from 'react';
import './MediaUrlInput.css';

interface MediaUrlInputProps {
  onUrlChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  value?: string;
}

export default function MediaUrlInput({ 
  onUrlChange, 
  label = 'Media URL',
  placeholder = 'https://example.com/image.jpg',
  value = ''
}: MediaUrlInputProps) {
  const [url, setUrl] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError(null);
    
    // Basic URL validation
    if (newUrl && !isValidUrl(newUrl)) {
      setError('Please enter a valid URL');
      return;
    }
    
    onUrlChange(newUrl);
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <div className="media-url-input">
      {label && <label className="media-url-label">{label}</label>}
      <div className="media-url-controls">
        <input
          type="url"
          value={url}
          onChange={handleChange}
          placeholder={placeholder}
          className="media-url-field"
        />
      </div>
      {error && <div className="url-error">{error}</div>}
      <small className="url-hint">
        Enter a URL to an image, video, or other media file
      </small>
    </div>
  );
}

