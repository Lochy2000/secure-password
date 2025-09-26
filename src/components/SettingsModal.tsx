import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<boolean>;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave
}: SettingsModalProps) {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
               : type === 'number' ? parseInt(value) || 0 
               : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Auto Lock Timeout */}
          <div>
            <label htmlFor="autoLockTimeoutMinutes" className="block text-sm font-medium text-gray-700 mb-2">
              Auto-lock timeout
            </label>
            <select
              id="autoLockTimeoutMinutes"
              name="autoLockTimeoutMinutes"
              value={formData.autoLockTimeoutMinutes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
              <option value={-1}>Never</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              Automatically lock the vault after this period of inactivity
            </p>
          </div>

          {/* Clipboard Clear Timeout */}
          <div>
            <label htmlFor="clipboardClearTimeoutSeconds" className="block text-sm font-medium text-gray-700 mb-2">
              Clipboard clear timeout
            </label>
            <select
              id="clipboardClearTimeoutSeconds"
              name="clipboardClearTimeoutSeconds"
              value={formData.clipboardClearTimeoutSeconds}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={-1}>Never</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              Automatically clear clipboard after copying passwords
            </p>
          </div>

          {/* Show Passwords by Default */}
          <div>
            <div className="flex items-center">
              <input
                id="showPasswordsByDefault"
                name="showPasswordsByDefault"
                type="checkbox"
                checked={formData.showPasswordsByDefault}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="showPasswordsByDefault" className="ml-2 text-sm font-medium text-gray-700">
                Show passwords by default
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-1 ml-6">
              Display passwords in plain text instead of hiding them with dots
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Security Information</h4>
                <p className="text-sm text-blue-700 mt-1">
                  All your data is encrypted with military-grade AES-256 encryption and stored locally on your device.
                  Nothing is ever sent to external servers. Your master password is used to derive encryption keys using
                  Argon2id, making it extremely resistant to brute-force attacks.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </div>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}