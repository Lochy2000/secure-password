import { useVault } from './hooks/useVault';
import MasterPasswordScreen from './components/MasterPasswordScreen';
import VaultScreen from './components/VaultScreen';

function App() {
  const {
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
    resetAutoLockTimer
  } = useVault();

  // Show master password screen if vault is locked or not initialized
  if (vaultState.isLocked || !vaultState.isInitialized) {
    return (
      <MasterPasswordScreen
        isInitialized={vaultState.isInitialized}
        onCreateVault={createVault}
        onUnlockVault={unlockVault}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  // Show vault screen when unlocked
  return (
    <VaultScreen
      entries={vaultState.entries}
      onAddEntry={addEntry}
      onUpdateEntry={updateEntry}
      onDeleteEntry={deleteEntry}
      onLockVault={lockVault}
      onResetAutoLock={resetAutoLockTimer}
      settings={settings}
      onUpdateSettings={updateSettings}
      isLoading={isLoading}
    />
  );
}

export default App;
