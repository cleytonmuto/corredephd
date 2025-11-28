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
  } catch (error: any) {
    console.error('Error getting site settings:', error);
    // If it's a permission error, provide helpful message
    if (error?.code === 'permission-denied') {
      console.warn('Firestore permission denied. Please update your Firestore security rules. See FIRESTORE_RULES.md for details.');
    }
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
    
    // Get current settings to merge with (for fields not being updated)
    const currentSettings = await getSiteSettings();
    
    // Prepare the data to save
    const dataToSave: any = {
      // Include current settings as base (excluding id, updatedAt, updatedBy)
      siteTitle: settings.siteTitle ?? currentSettings?.siteTitle ?? DEFAULT_SETTINGS.siteTitle,
      siteDescription: settings.siteDescription ?? currentSettings?.siteDescription ?? DEFAULT_SETTINGS.siteDescription,
      theme: settings.theme ?? currentSettings?.theme ?? DEFAULT_SETTINGS.theme,
      primaryColor: settings.primaryColor ?? currentSettings?.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
      secondaryColor: settings.secondaryColor ?? currentSettings?.secondaryColor ?? DEFAULT_SETTINGS.secondaryColor,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };
    
    // Handle optional fields (can be explicitly set to empty string or undefined)
    if (settings.siteLogo !== undefined) {
      dataToSave.siteLogo = settings.siteLogo || null;
    } else if (currentSettings?.siteLogo !== undefined) {
      dataToSave.siteLogo = currentSettings.siteLogo || null;
    }
    
    if (settings.customCSS !== undefined) {
      dataToSave.customCSS = settings.customCSS || null;
    } else if (currentSettings?.customCSS !== undefined) {
      dataToSave.customCSS = currentSettings.customCSS || null;
    }
    
    await setDoc(settingsRef, dataToSave, { merge: true });
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    // If it's a permission error, provide helpful message
    if (error?.code === 'permission-denied') {
      const errorMessage = 'Permission denied. Please ensure:\n' +
        '1. Your Firestore security rules allow admin access to site/settings\n' +
        '2. Your user profile has profile: "admin"\n' +
        '3. See FIRESTORE_RULES.md for security rules setup';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
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

