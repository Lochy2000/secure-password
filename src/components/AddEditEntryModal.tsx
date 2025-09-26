import React, { useState, useEffect } from 'react';
import type { PasswordEntry } from '../types';
import { generatePassword } from '../utils/crypto';

interface AddEditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => Promise<boolean>;
  entry?: PasswordEntry;
  isLoading: boolean;
}

export default function AddEditEntryModal({
  isOpen,
  onClose,
  onSave,
  entry,
  isLoading
}: AddEditEntryModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!entry;

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        username: entry.username,
        password: entry.password,
        url: entry.url || '',
        notes: entry.notes || ''
      });
    } else {
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: ''
      });
    }
  }, [entry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(passwordLength, includeSymbols);
    setFormData(prev => ({ ...prev, password: newPassword }));
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    
    try {
      let success;
      if (isEditing && entry) {
        success = await onSave({
          ...entry,
          ...formData
        });
      } else {
        success = await onSave(formData);
      }
      
      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = formData.title.trim() && formData.password.trim() && !isLoading && !isSaving;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Password' : 'Add New Password'}
            </h2>
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
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Gmail, Facebook, Banking"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username / Email
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="username or email@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="space-y-3">
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter or generate password"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-r-lg transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Password Generator */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Generate Password</span>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label htmlFor="passwordLength" className="block text-gray-600 mb-1">
                      Length: {passwordLength}
                    </label>
                    <input
                      id="passwordLength"
                      type="range"
                      min="8"
                      max="64"
                      value={passwordLength}
                      onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="includeSymbols"
                      type="checkbox"
                      checked={includeSymbols}
                      onChange={(e) => setIncludeSymbols(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeSymbols" className="ml-2 text-gray-600">
                      Include symbols
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              placeholder="Additional notes about this password..."
            />
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
              disabled={!canSave}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                canSave
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isEditing ? 'Updating...' : 'Saving...'}
                </div>
              ) : (
                isEditing ? 'Update Password' : 'Save Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}