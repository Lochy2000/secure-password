import React, { useState, useRef, useEffect } from 'react';

interface MasterPasswordScreenProps {
  isInitialized: boolean;
  onCreateVault: (password: string) => Promise<boolean>;
  onUnlockVault: (password: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export default function MasterPasswordScreen({
  isInitialized,
  onCreateVault,
  onUnlockVault,
  isLoading,
  error
}: MasterPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const isCreating = !isInitialized;
  const isPasswordValid = password.length >= 8;
  const isConfirmValid = isCreating ? password === confirmPassword : true;
  const canSubmit = isPasswordValid && isConfirmValid && !isLoading;

  useEffect(() => {
    // Focus password input on mount
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const success = isCreating 
      ? await onCreateVault(password)
      : await onUnlockVault(password);

    if (!success) {
      // Clear passwords on failure
      setPassword('');
      setConfirmPassword('');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isCreating ? 'Create Your Vault' : 'Unlock Your Vault'}
          </h1>
          <p className="text-gray-600">
            {isCreating 
              ? 'Create a secure master password for your password vault'
              : 'Enter your master password to access your vault'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Master Password
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                placeholder="Enter your master password"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
            {isCreating && !isPasswordValid && password.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          {isCreating && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your master password"
                disabled={isLoading}
                autoComplete="new-password"
              />
              {!isConfirmValid && confirmPassword.length > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isCreating ? 'Creating Vault...' : 'Unlocking...'}
              </div>
            ) : (
              isCreating ? 'Create Vault' : 'Unlock Vault'
            )}
          </button>
        </form>

        {isCreating && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your master password cannot be recovered if lost. Make sure to remember it or store it safely.
                  All data is encrypted locally and never leaves your device.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}