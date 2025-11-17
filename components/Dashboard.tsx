import React, { useState, useMemo, FC } from 'react';
import { Doc, Category, GoogleUser } from '../types';
import { LogoutIcon, SearchIcon, LogoIcon, SyncIcon } from './icons';
import FileItem from './FileItem';

interface DashboardProps {
  user: GoogleUser;
  docs: Doc[];
  categories: Category[];
  onLogout: () => void;
  onUpdateDocCategory: (docId: string, categoryId: string) => void;
  onSync: () => void;
  isSyncing: boolean;
}

const Dashboard: FC<DashboardProps> = ({ user, docs, categories, onLogout, onUpdateDocCategory, onSync, isSyncing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const filteredDocs = useMemo(() => {
    return docs
      .filter(doc => {
        // '0' is the filter for uncategorized documents
        const matchesCategory = activeCategory === '0' ? !doc.categoryId : activeCategory ? doc.categoryId === activeCategory : true;
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  }, [docs, searchTerm, activeCategory]);
  
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  };

  return (
    <div className="flex h-screen bg-white">
      <nav className="w-64 bg-gray-50 border-r border-gray-200 p-5 hidden md:flex flex-col">
        <div className="flex items-center space-x-2 mb-8">
            <LogoIcon className="h-8 w-8 text-primary"/>
            <span className="font-bold text-xl text-gray-800">DocSync Hub</span>
        </div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h2>
        <ul className="space-y-1">
          <li>
            <button onClick={() => setActiveCategory(null)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${!activeCategory ? 'bg-primary-light text-primary' : 'text-gray-600 hover:bg-gray-200'}`}>
              All Documents
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat.id}>
              <button onClick={() => setActiveCategory(cat.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-primary-light text-primary' : 'text-gray-600 hover:bg-gray-200'}`}>
                {cat.name}
              </button>
            </li>
          ))}
          <li>
            <button onClick={() => setActiveCategory('0')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeCategory === '0' ? 'bg-primary-light text-primary' : 'text-gray-600 hover:bg-gray-200'}`}>
              Uncategorized
            </button>
          </li>
        </ul>
        <div className="mt-auto">
          <p className="text-sm text-gray-400">Your document categories are saved in your browser's local storage.</p>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="relative w-full max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
                <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full" />
                <span className="text-sm font-medium text-gray-600 hidden sm:inline">{user.name}</span>
             </div>
             <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <LogoutIcon className="h-6 w-6 text-gray-500" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeCategory === '0' ? 'Uncategorized' : activeCategory ? getCategoryName(activeCategory) : 'All Documents'}
            </h1>
            <button onClick={onSync} disabled={isSyncing} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
              <SyncIcon className={`h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {filteredDocs.length > 0 ? (
              filteredDocs.map(doc => (
                <FileItem 
                    key={doc.id} 
                    doc={doc} 
                    categoryName={getCategoryName(doc.categoryId)}
                    categories={categories}
                    onUpdateCategory={(newCatId) => onUpdateDocCategory(doc.id, newCatId)}
                />
              ))
            ) : (
              <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700">No documents found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters, or hit "Sync" to fetch your files from Google Drive.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
