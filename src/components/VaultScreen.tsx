import { useState, useMemo } from 'react';
import type { PasswordEntry } from '../types';
import PasswordEntryCard from './PasswordEntryCard';
import AddEditEntryModal from './AddEditEntryModal';
import SettingsModal from './SettingsModal';

interface VaultScreenProps {
  entries: PasswordEntry[];
  onAddEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateEntry: (entry: PasswordEntry) => Promise<boolean>;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
  onLockVault: () => void;
  onResetAutoLock: () => void;
  settings: any;
  onUpdateSettings: (settings: any) => Promise<boolean>;
  isLoading: boolean;
}

export default function VaultScreen({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onLockVault,
  onResetAutoLock,
  settings,
  onUpdateSettings,
  isLoading
}: VaultScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt'>('title');

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = entries.filter(entry =>
        entry.title.toLowerCase().includes(term) ||
        entry.username.toLowerCase().includes(term) ||
        entry.url?.toLowerCase().includes(term) ||
        entry.notes?.toLowerCase().includes(term)
      );
    }

    // Sort entries
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
  }, [entries, searchTerm, sortBy]);

  const handleAddEntry = async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const success = await onAddEntry(entry);
    if (success) {
      setIsAddingEntry(false);
    }
    return success;
  };

  const handleUpdateEntry = async (entry: PasswordEntry) => {
    const success = await onUpdateEntry(entry);
    if (success) {
      setSelectedEntry(null);
    }
    return success;
  };

  const handleDeleteEntry = async (entryId: string) => {
    const success = await onDeleteEntry(entryId);
    if (success) {
      setSelectedEntry(null);
    }
    return success;
  };

  // Reset auto-lock timer on user interaction
  const handleUserInteraction = () => {
    onResetAutoLock();
  };

  return (
    <div className="min-h-screen bg-gray-50" onClick={handleUserInteraction}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Secure Password Manager</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <button
                onClick={onLockVault}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center"
                title="Lock Vault"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Lock
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'title' | 'createdAt' | 'updatedAt')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="title">Sort by Name</option>
                <option value="createdAt">Sort by Created</option>
                <option value="updatedAt">Sort by Updated</option>
              </select>

              <button
                onClick={() => setIsAddingEntry(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Password
              </button>
            </div>
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-4">
          {filteredAndSortedEntries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching passwords' : 'No passwords yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Get started by adding your first password.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsAddingEntry(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Password
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedEntries.map((entry) => (
                <PasswordEntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => setSelectedEntry(entry)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                  showPasswordByDefault={settings.showPasswordsByDefault}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isAddingEntry && (
        <AddEditEntryModal
          isOpen={isAddingEntry}
          onClose={() => setIsAddingEntry(false)}
          onSave={handleAddEntry}
          isLoading={isLoading}
        />
      )}

      {selectedEntry && (
        <AddEditEntryModal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onSave={handleUpdateEntry}
          entry={selectedEntry}
          isLoading={isLoading}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={onUpdateSettings}
        />
      )}
    </div>
  );
}