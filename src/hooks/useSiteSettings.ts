import { useState, useEffect } from 'react';
import { getSiteSettingsOrDefault, applyTheme, applyCustomCSS, applyColorVariables } from '../utils/siteSettings';
import type { SiteSettings } from '../types';

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const siteSettings = await getSiteSettingsOrDefault();
      setSettings(siteSettings);
      
      // Apply settings
      applyTheme(siteSettings.theme);
      applyCustomCSS(siteSettings.customCSS);
      applyColorVariables(siteSettings.primaryColor, siteSettings.secondaryColor);
      
      setLoading(false);
    };
    loadSettings();
  }, []);

  const refreshSettings = async () => {
    const siteSettings = await getSiteSettingsOrDefault();
    setSettings(siteSettings);
    applyTheme(siteSettings.theme);
    applyCustomCSS(siteSettings.customCSS);
    applyColorVariables(siteSettings.primaryColor, siteSettings.secondaryColor);
  };

  // refreshSettings is exported for potential future use (e.g., after saving settings)
  return { settings, loading, refreshSettings };
}

