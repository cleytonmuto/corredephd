import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { SiteSettings, Theme } from '../types';

const DEFAULT_SETTINGS: Omit<SiteSettings, 'id' | 'updatedAt' | 'updatedBy'> = {
  siteTitle: 'Corre de PhD',
  siteDescription: 'A modern blog platform',
  theme: 'default',
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
};

/**
 * Get site settings from Firestore
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const settingsRef = doc(db, 'site', 'settings');
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      return {
        id: settingsSnap.id,
        siteTitle: data.siteTitle || DEFAULT_SETTINGS.siteTitle,
        siteDescription: data.siteDescription || DEFAULT_SETTINGS.siteDescription,
        siteLogo: data.siteLogo,
        theme: data.theme || DEFAULT_SETTINGS.theme,
        customCSS: data.customCSS,
        primaryColor: data.primaryColor || DEFAULT_SETTINGS.primaryColor,
        secondaryColor: data.secondaryColor || DEFAULT_SETTINGS.secondaryColor,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        updatedBy: data.updatedBy || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting site settings:', error);
    return null;
  }
}

/**
 * Get site settings or return defaults
 */
export async function getSiteSettingsOrDefault(): Promise<SiteSettings> {
  const settings = await getSiteSettings();
  if (settings) {
    return settings;
  }
  
  return {
    id: 'settings',
    ...DEFAULT_SETTINGS,
    updatedAt: new Date(),
    updatedBy: '',
  };
}

/**
 * Update site settings
 */
export async function updateSiteSettings(
  settings: Partial<Omit<SiteSettings, 'id' | 'updatedAt' | 'updatedBy'>>,
  userId: string
): Promise<void> {
  try {
    const settingsRef = doc(db, 'site', 'settings');
    const currentSettings = await getSiteSettingsOrDefault();
    
    await setDoc(settingsRef, {
      ...currentSettings,
      ...settings,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    }, { merge: true });
  } catch (error) {
    console.error('Error updating site settings:', error);
    throw error;
  }
}

/**
 * Apply theme CSS to document
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('theme-default', 'theme-dark', 'theme-minimal', 'theme-modern', 'theme-classic');
  
  // Add new theme class
  root.classList.add(`theme-${theme}`);
}

/**
 * Apply custom CSS to document
 */
export function applyCustomCSS(css: string | undefined) {
  let styleElement = document.getElementById('custom-site-css');
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'custom-site-css';
    document.head.appendChild(styleElement);
  }
  
  if (css) {
    styleElement.textContent = css;
  } else {
    styleElement.textContent = '';
  }
}

/**
 * Apply CSS variables for colors
 */
export function applyColorVariables(primaryColor?: string, secondaryColor?: string) {
  const root = document.documentElement;
  
  if (primaryColor) {
    root.style.setProperty('--primary-color', primaryColor);
  } else {
    root.style.removeProperty('--primary-color');
  }
  
  if (secondaryColor) {
    root.style.setProperty('--secondary-color', secondaryColor);
  } else {
    root.style.removeProperty('--secondary-color');
  }
}

