import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { EncryptedEntry, AppSettings } from '../types';

/**
 * IndexedDB database for storing encrypted password entries
 * Uses Dexie for a better IndexedDB API
 */

interface StoredVault {
  id: 'main';
  salt: Uint8Array;
  encryptedVaultKey: string;
  vaultKeyIv: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredSettings {
  id: 'main';
  settings: AppSettings;
  updatedAt: Date;
}

class SecurePasswordDB extends Dexie {
  vault!: Table<StoredVault>;
  entries!: Table<EncryptedEntry>;
  settings!: Table<StoredSettings>;

  constructor() {
    super('SecurePasswordDB');
    
    this.version(1).stores({
      vault: 'id, createdAt, updatedAt',
      entries: 'id, createdAt, updatedAt',
      settings: 'id, updatedAt'
    });
  }
}

const db = new SecurePasswordDB();

/**
 * Storage service for managing encrypted data in IndexedDB
 */
export class StorageService {
  /**
   * Initialize the vault with master key salt and encrypted vault key
   */
  static async initializeVault(
    salt: Uint8Array,
    encryptedVaultKey: string,
    vaultKeyIv: string
  ): Promise<void> {
    const now = new Date();
    await db.vault.put({
      id: 'main',
      salt,
      encryptedVaultKey,
      vaultKeyIv,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Check if the vault is initialized
   */
  static async isVaultInitialized(): Promise<boolean> {
    const vault = await db.vault.get('main');
    return !!vault;
  }

  /**
   * Get vault metadata (salt and encrypted vault key)
   */
  static async getVaultMetadata(): Promise<StoredVault | undefined> {
    return await db.vault.get('main');
  }

  /**
   * Save an encrypted entry
   */
  static async saveEntry(entry: EncryptedEntry): Promise<void> {
    await db.entries.put(entry);
  }

  /**
   * Get all encrypted entries
   */
  static async getAllEntries(): Promise<EncryptedEntry[]> {
    return await db.entries.toArray();
  }

  /**
   * Get a specific encrypted entry by ID
   */
  static async getEntry(id: string): Promise<EncryptedEntry | undefined> {
    return await db.entries.get(id);
  }

  /**
   * Delete an entry
   */
  static async deleteEntry(id: string): Promise<void> {
    await db.entries.delete(id);
  }

  /**
   * Update an encrypted entry
   */
  static async updateEntry(entry: EncryptedEntry): Promise<void> {
    await db.entries.put({ ...entry, updatedAt: new Date() });
  }

  /**
   * Get application settings
   */
  static async getSettings(): Promise<AppSettings> {
    const storedSettings = await db.settings.get('main');
    
    // Return default settings if none exist
    if (!storedSettings) {
      return {
        autoLockTimeoutMinutes: 15,
        clipboardClearTimeoutSeconds: 30,
        showPasswordsByDefault: false
      };
    }
    
    return storedSettings.settings;
  }

  /**
   * Save application settings
   */
  static async saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put({
      id: 'main',
      settings,
      updatedAt: new Date()
    });
  }

  /**
   * Clear all data (used for reset/logout)
   */
  static async clearAll(): Promise<void> {
    await db.entries.clear();
    // Note: We don't clear vault metadata to keep salt, but we could add a flag for complete reset
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<{ entryCount: number; storageUsed: number }> {
    const entryCount = await db.entries.count();
    
    // Rough estimate of storage used (IndexedDB doesn't provide exact sizes easily)
    const entries = await db.entries.toArray();
    const storageUsed = entries.reduce((total, entry) => {
      return total + entry.encryptedData.length + entry.iv.length + 100; // rough overhead
    }, 0);

    return { entryCount, storageUsed };
  }

  /**
   * Export encrypted data (for backup purposes)
   */
  static async exportData(): Promise<{
    vault: StoredVault | undefined;
    entries: EncryptedEntry[];
    settings: AppSettings;
    exportedAt: Date;
  }> {
    const [vault, entries, settings] = await Promise.all([
      db.vault.get('main'),
      db.entries.toArray(),
      StorageService.getSettings()
    ]);

    return {
      vault,
      entries,
      settings,
      exportedAt: new Date()
    };
  }

  /**
   * Import encrypted data (for restore purposes)
   */
  static async importData(data: {
    vault?: StoredVault;
    entries: EncryptedEntry[];
    settings: AppSettings;
  }): Promise<void> {
    await db.transaction('rw', [db.vault, db.entries, db.settings], async () => {
      // Clear existing data
      await db.entries.clear();
      
      // Import vault metadata if provided
      if (data.vault) {
        await db.vault.put(data.vault);
      }

      // Import entries
      await db.entries.bulkPut(data.entries);

      // Import settings
      await StorageService.saveSettings(data.settings);
    });
  }
}

export default StorageService;