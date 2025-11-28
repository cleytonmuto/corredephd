import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getSiteSettingsOrDefault, updateSiteSettings, applyTheme, applyCustomCSS, applyColorVariables } from '../utils/siteSettings';
import { isAdmin } from '../utils/userProfile';
import type { SiteSettings, Theme } from '../types';
import MediaUrlInput from '../components/MediaUrlInput';
import './SiteSettings.css';

export default function SiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminStatus = await isAdmin(currentUser.uid);
        setIsAdminUser(adminStatus);
        if (!adminStatus) {
          alert('Only administrators can access site settings.');
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAdminUser) {
      loadSettings();
    }
  }, [isAdminUser]);

  const loadSettings = async () => {
    try {
      const siteSettings = await getSiteSettingsOrDefault();
      setSettings(siteSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      alert('Failed to load site settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdminUser || !settings) {
      return;
    }

    setSaving(true);
    try {
      await updateSiteSettings({
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        siteLogo: settings.siteLogo,
        theme: settings.theme,
        customCSS: settings.customCSS,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
      }, user.uid);
      
      // Apply settings immediately
      applyTheme(settings.theme);
      applyCustomCSS(settings.customCSS);
      applyColorVariables(settings.primaryColor, settings.secondaryColor);
      
      alert('Site settings saved successfully!');
      // Reload settings to get updated timestamp
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save site settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SiteSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  if (loading || !isAdminUser) {
    return <div className="site-settings-container">Loading...</div>;
  }

  if (!settings) {
    return <div className="site-settings-container">Failed to load settings.</div>;
  }

  const themes: { value: Theme; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'dark', label: 'Dark' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
  ];

  return (
    <div className="site-settings-container">
      <div className="site-settings-card">
        <h2>Site Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="siteTitle">Site Title</label>
            <input
              type="text"
              id="siteTitle"
              value={settings.siteTitle}
              onChange={(e) => handleChange('siteTitle', e.target.value)}
              placeholder="Enter site title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="siteDescription">Site Description</label>
            <textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => handleChange('siteDescription', e.target.value)}
              placeholder="Enter site description"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Site Logo URL (Optional)</label>
            {settings.siteLogo && (
              <div className="logo-preview">
                <img src={settings.siteLogo} alt="Site Logo" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
                <button
                  type="button"
                  onClick={() => handleChange('siteLogo', '')}
                  className="remove-logo-btn"
                >
                  Remove
                </button>
              </div>
            )}
            <MediaUrlInput
              onUrlChange={(url) => handleChange('siteLogo', url)}
              placeholder="https://example.com/logo.png"
              value={settings.siteLogo || ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value as Theme)}
              className="form-select"
            >
              {themes.map(theme => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="primaryColor">Primary Color</label>
            <div className="color-input-group">
              <input
                type="color"
                id="primaryColor"
                value={settings.primaryColor || '#667eea'}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={settings.primaryColor || '#667eea'}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                placeholder="#667eea"
                className="color-text"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="secondaryColor">Secondary Color</label>
            <div className="color-input-group">
              <input
                type="color"
                id="secondaryColor"
                value={settings.secondaryColor || '#764ba2'}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={settings.secondaryColor || '#764ba2'}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                placeholder="#764ba2"
                className="color-text"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="customCSS">Custom CSS (Optional)</label>
            <textarea
              id="customCSS"
              value={settings.customCSS || ''}
              onChange={(e) => handleChange('customCSS', e.target.value)}
              placeholder="Enter custom CSS code..."
              rows={10}
              className="css-editor"
            />
            <small className="form-hint">
              Add custom CSS to style your site. This will be applied globally.
            </small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

