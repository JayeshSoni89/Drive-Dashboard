import React, { useState, useCallback } from 'react';
import { Doc, Category } from '../types';
import { GoogleDocIcon, GoogleSheetIcon, SparklesIcon } from './icons';
import { suggestCategory } from '../services/geminiService';

interface FileItemProps {
  doc: Doc;
  categoryName: string;
  categories: Category[];
  onUpdateCategory: (categoryId: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({ doc, categoryName, categories, onUpdateCategory }) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState('');

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
  };

  const handleSuggestCategory = useCallback(async () => {
    setError('');
    setIsSuggesting(true);
    try {
        const existingCategoryNames = categories.map(c => c.name);
        const suggestedCategoryName = await suggestCategory(doc.name, existingCategoryNames);
        const matchedCategory = categories.find(c => c.name.toLowerCase() === suggestedCategoryName.toLowerCase());
        if (matchedCategory) {
            onUpdateCategory(matchedCategory.id);
        } else {
           setError(`Suggested category "${suggestedCategoryName}" not found.`);
        }
    } catch (err) {
        console.error(err);
        setError('Suggestion failed.');
    } finally {
        setIsSuggesting(false);
    }
  }, [doc.name, categories, onUpdateCategory]);

  const Icon = doc.type === 'sheet' ? GoogleSheetIcon : GoogleDocIcon;
  const categoryColor = doc.categoryId
    ? (doc.type === 'sheet' ? 'bg-google-sheet/10 text-google-sheet' : 'bg-google-doc/10 text-google-doc')
    : 'bg-gray-200 text-gray-600';

  return (
    <div
      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-primary transition-all duration-200 animate-fade-in"
    >
      <div className="flex items-center space-x-4">
        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <Icon className="h-8 w-8" />
        </a>
        <div className="flex-1 min-w-0">
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
            <p className="text-md font-semibold text-gray-800 truncate hover:underline">{doc.name}</p>
          </a>
          <div className="flex items-center text-sm text-gray-500 mt-1 space-x-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor}`}>
              {categoryName}
            </span>
            <span>&middot;</span>
            <span>Updated {timeAgo(doc.lastModified)}</span>
          </div>
        </div>
        {!doc.categoryId && (
          <div className="flex items-center space-x-2">
            <select
              value=""
              onChange={(e) => onUpdateCategory(e.target.value)}
              className="text-xs border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value="" disabled>Set category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
                type="button"
                onClick={handleSuggestCategory}
                disabled={isSuggesting}
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Suggest Category with AI"
            >
                <SparklesIcon className={`h-5 w-5 text-yellow-500 ${isSuggesting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-2 text-right">{error}</p>}
    </div>
  );
};

export default FileItem;
