import { useState } from 'react';
import type { PasswordEntry } from '../types';
import { copyPassword, copyUsername } from '../utils/clipboard';

interface PasswordEntryCardProps {
  entry: PasswordEntry;
  onEdit: () => void;
  onDelete: () => void;
  showPasswordByDefault: boolean;
}

export default function PasswordEntryCard({
  entry,
  onEdit,
  onDelete,
  showPasswordByDefault
}: PasswordEntryCardProps) {
  const [showPassword, setShowPassword] = useState(showPasswordByDefault);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyUsername = async () => {
    await copyUsername(entry.username);
  };

  const handleCopyPassword = async () => {
    await copyPassword(entry.password);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      setIsDeleting(true);
      await onDelete();
      setIsDeleting(false);
    }
  };

  const openUrl = () => {
    if (entry.url) {
      let url = entry.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {entry.title}
            </h3>
            {entry.url && (
              <button
                onClick={openUrl}
                className="text-sm text-blue-600 hover:text-blue-800 truncate block mt-1"
                title={entry.url}
              >
                {entry.url}
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Username */}
        {entry.username && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Username
            </label>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <span className="flex-1 text-sm text-gray-900 font-mono break-all">
                {entry.username}
              </span>
              <button
                onClick={handleCopyUsername}
                className="ml-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                title="Copy username"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Password */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Password
          </label>
          <div className="flex items-center bg-gray-50 rounded-lg p-3">
            <span className="flex-1 text-sm text-gray-900 font-mono break-all">
              {showPassword ? entry.password : '•'.repeat(Math.min(entry.password.length, 12))}
            </span>
            <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
              <button
                onClick={handleCopyPassword}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                title="Copy password"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Notes
            </label>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {entry.notes}
              </p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 pt-4 border-t space-y-1">
          <div>Created: {formatDate(entry.createdAt)}</div>
          <div>Updated: {formatDate(entry.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}