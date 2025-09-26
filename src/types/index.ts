export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EncryptedEntry {
  id: string;
  encryptedData: string;
  iv: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VaultState {
  isLocked: boolean;
  isInitialized: boolean;
  entries: PasswordEntry[];
  masterPasswordHash?: string;
}

export interface CryptoKeys {
  masterKey: CryptoKey;
  vaultKey: CryptoKey;
}

export interface AppSettings {
  autoLockTimeoutMinutes: number;
  clipboardClearTimeoutSeconds: number;
  showPasswordsByDefault: boolean;
}