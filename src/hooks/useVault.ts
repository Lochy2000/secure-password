import { useState, useEffect, useCallback, useRef } from 'react';
import type { PasswordEntry, VaultState, AppSettings } from '../types';
import { 
  deriveMasterKey, 
  generateSalt, 
  generateVaultKey, 
  deriveVaultKey, 
  encryptData, 
  decryptData,
  clearSensitiveData
} from '../utils/crypto';
import StorageService from '../utils/storage';

/**
 * Custom hook for managing vault state and operations
 */
export function useVault() {
  const [vaultState, setVaultState] = useState<VaultState>({
    isLocked: true,
    isInitialized: false,
    entries: []
  });
  
  const [settings, setSettings] = useState<AppSettings>({
    autoLockTimeoutMinutes: 15,
    clipboardClearTimeoutSeconds: 30,
    showPasswordsByDefault: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store the vault key in memory when unlocked
  const vaultKeyRef = useRef<CryptoKey | null>(null);
  const autoLockTimerRef = useRef<number | null>(null);

  /**
   * Initialize the hook by checking if vault exists and loading settings
   */
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        
        // Check if vault is initialized
        const isInitialized = await StorageService.isVaultInitialized();
        
        // Load settings
        const loadedSettings = await StorageService.getSettings();
        setSettings(loadedSettings);
        
        setVaultState(prev => ({
          ...prev,
          isInitialized
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize vault');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  /**
   * Set up auto-lock timer when vault is unlocked
   */
  const setupAutoLock = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }

    autoLockTimerRef.current = setTimeout(() => {
      lockVault();
    }, settings.autoLockTimeoutMinutes * 60 * 1000);
  }, [settings.autoLockTimeoutMinutes]);

  /**
   * Create a new vault with master password
   */
  const createVault = useCallback(async (masterPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate salt and derive master key
      const salt = generateSalt();
      const masterKey = await deriveMasterKey(masterPassword, salt);

      // Generate and encrypt vault key
      const vaultKey = await generateVaultKey();
      const exportedVaultKey = await crypto.subtle.exportKey('raw', vaultKey);
      const vaultKeyString = Array.from(new Uint8Array(exportedVaultKey))
        .map(b => String.fromCharCode(b))
        .join('');

      // Derive encryption key for vault key
      const encryptionKey = await deriveVaultKey(masterKey, salt);
      const { encryptedData: encryptedVaultKey, iv: vaultKeyIv } = await encryptData(vaultKeyString, encryptionKey);

      // Store in IndexedDB
      await StorageService.initializeVault(salt, encryptedVaultKey, vaultKeyIv);

      // Update state
      setVaultState({
        isLocked: false,
        isInitialized: true,
        entries: []
      });

      // Store vault key in memory
      vaultKeyRef.current = vaultKey;
      
      // Set up auto-lock
      setupAutoLock();

      // Clear sensitive data
      clearSensitiveData(masterPassword);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vault');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setupAutoLock]);

  /**
   * Unlock existing vault with master password
   */
  const unlockVault = useCallback(async (masterPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get vault metadata
      const vaultMetadata = await StorageService.getVaultMetadata();
      if (!vaultMetadata) {
        throw new Error('Vault not found');
      }

      // Derive master key
      const masterKey = await deriveMasterKey(masterPassword, vaultMetadata.salt);

      // Derive encryption key and decrypt vault key
      const encryptionKey = await deriveVaultKey(masterKey, vaultMetadata.salt);
      const decryptedVaultKeyString = await decryptData(
        vaultMetadata.encryptedVaultKey,
        vaultMetadata.vaultKeyIv,
        encryptionKey
      );

      // Import vault key
      const vaultKeyBuffer = new Uint8Array(decryptedVaultKeyString.split('').map(c => c.charCodeAt(0)));
      const vaultKey = await crypto.subtle.importKey(
        'raw',
        vaultKeyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );

      // Load and decrypt all entries
      const encryptedEntries = await StorageService.getAllEntries();
      const decryptedEntries: PasswordEntry[] = [];

      for (const encryptedEntry of encryptedEntries) {
        try {
          const decryptedData = await decryptData(
            encryptedEntry.encryptedData,
            encryptedEntry.iv,
            vaultKey
          );
          const entry: PasswordEntry = JSON.parse(decryptedData);
          decryptedEntries.push(entry);
        } catch (entryError) {
          console.error('Failed to decrypt entry:', encryptedEntry.id, entryError);
          // Skip corrupted entries but continue with others
        }
      }

      // Update state
      setVaultState({
        isLocked: false,
        isInitialized: true,
        entries: decryptedEntries
      });

      // Store vault key in memory
      vaultKeyRef.current = vaultKey;
      
      // Set up auto-lock
      setupAutoLock();

      // Clear sensitive data
      clearSensitiveData(masterPassword);
      clearSensitiveData(decryptedVaultKeyString);

      return true;
    } catch (err) {
      setError('Invalid master password or corrupted vault');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setupAutoLock]);

  /**
   * Lock the vault
   */
  const lockVault = useCallback(() => {
    // Clear vault key from memory
    vaultKeyRef.current = null;
    
    // Clear auto-lock timer
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }

    // Update state
    setVaultState(prev => ({
      ...prev,
      isLocked: true,
      entries: []
    }));
  }, []);

  /**
   * Add a new password entry
   */
  const addEntry = useCallback(async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!vaultKeyRef.current) {
      setError('Vault is locked');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const newEntry: PasswordEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };

      // Encrypt and store
      const { encryptedData, iv } = await encryptData(JSON.stringify(newEntry), vaultKeyRef.current);
      await StorageService.saveEntry({
        id: newEntry.id,
        encryptedData,
        iv,
        createdAt: now,
        updatedAt: now
      });

      // Update state
      setVaultState(prev => ({
        ...prev,
        entries: [...prev.entries, newEntry]
      }));

      // Reset auto-lock timer
      setupAutoLock();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setupAutoLock]);

  /**
   * Update an existing password entry
   */
  const updateEntry = useCallback(async (updatedEntry: PasswordEntry): Promise<boolean> => {
    if (!vaultKeyRef.current) {
      setError('Vault is locked');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const entryWithTimestamp = {
        ...updatedEntry,
        updatedAt: new Date()
      };

      // Encrypt and store
      const { encryptedData, iv } = await encryptData(JSON.stringify(entryWithTimestamp), vaultKeyRef.current);
      await StorageService.updateEntry({
        id: entryWithTimestamp.id,
        encryptedData,
        iv,
        createdAt: updatedEntry.createdAt,
        updatedAt: entryWithTimestamp.updatedAt
      });

      // Update state
      setVaultState(prev => ({
        ...prev,
        entries: prev.entries.map(entry => 
          entry.id === updatedEntry.id ? entryWithTimestamp : entry
        )
      }));

      // Reset auto-lock timer
      setupAutoLock();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setupAutoLock]);

  /**
   * Delete a password entry
   */
  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      await StorageService.deleteEntry(entryId);

      // Update state
      setVaultState(prev => ({
        ...prev,
        entries: prev.entries.filter(entry => entry.id !== entryId)
      }));

      // Reset auto-lock timer
      setupAutoLock();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setupAutoLock]);

  /**
   * Update settings
   */
  const updateSettings = useCallback(async (newSettings: AppSettings): Promise<boolean> => {
    try {
      await StorageService.saveSettings(newSettings);
      setSettings(newSettings);
      
      // Update auto-lock timer if timeout changed
      if (!vaultState.isLocked && newSettings.autoLockTimeoutMinutes !== settings.autoLockTimeoutMinutes) {
        setupAutoLock();
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      return false;
    }
  }, [vaultState.isLocked, settings.autoLockTimeoutMinutes, setupAutoLock]);

  /**
   * Reset auto-lock timer (call when user interacts with app)
   */
  const resetAutoLockTimer = useCallback(() => {
    if (!vaultState.isLocked) {
      setupAutoLock();
    }
  }, [vaultState.isLocked, setupAutoLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current);
      }
    };
  }, []);

  return {
    vaultState,
    settings,
    isLoading,
    error,
    createVault,
    unlockVault,
    lockVault,
    addEntry,
    updateEntry,
    deleteEntry,
    updateSettings,
    resetAutoLockTimer,
    clearError: () => setError(null)
  };
}