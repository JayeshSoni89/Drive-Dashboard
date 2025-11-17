import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import { Doc, Category, GoogleUser, CategoryMapping } from './types';
import { GoogleDocIcon, GoogleSheetIcon, LogoIcon } from './components/icons';
import { fetchFiles, initGapiClient, initGisClient } from './services/googleApiService';

// These should be set in your environment variables.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const App: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // FIX: Change type to any to avoid namespace error for 'google'
  const [tokenClient, setTokenClient] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load static categories and check for existing session
  useEffect(() => {
    // These categories are static for now, but could be loaded from storage.
    const defaultCategories: Category[] = [
      { id: '1', name: 'Work' },
      { id: '2', name: 'Personal' },
      { id: '3', name: 'Projects' },
      { id: '4', name: 'Finance' },
    ];
    setCategories(defaultCategories);

    // No need to check localStorage for user, Google's library handles session.
    setIsLoading(false); 
  }, []);

  const syncData = useCallback(async (gapi: any, google: any) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const files = await fetchFiles(gapi);
      const savedCategories: CategoryMapping = JSON.parse(localStorage.getItem(`${user.id}-categories`) || '{}');
      
      const mergedDocs: Doc[] = files.map((file: any) => ({
        id: file.id,
        name: file.name,
        type: file.mimeType.includes('spreadsheet') ? 'sheet' : 'doc',
        categoryId: savedCategories[file.id] || null, // `null` for uncategorized
        url: file.webViewLink,
        lastModified: file.modifiedTime,
      }));

      setDocs(mergedDocs);
    } catch (error) {
      console.error("Failed to sync data:", error);
      // Handle token expiration or other errors
      if ((error as any)?.result?.error?.code === 401) {
         tokenClient?.requestAccessToken({ prompt: '' });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user, tokenClient]);


  useEffect(() => {
    const initClients = async () => {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
        console.error("Google Client ID or API Key is not configured.");
        setIsLoading(false);
        return;
      }

      const gapi = await initGapiClient();
      const google = await initGisClient();

      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: async (tokenResponse) => {
          if (tokenResponse.access_token) {
            gapi.client.setToken(tokenResponse);
            // Fetch user profile
            const profile = await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
            })).json();

            const googleUser: GoogleUser = {
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              picture: profile.picture
            };
            setUser(googleUser);
          }
        },
      });
      setTokenClient(client);
    };
    
    initClients();
  }, []);

  useEffect(() => {
    if (user && window.gapi && window.google) {
      syncData(window.gapi, window.google);
    }
  }, [user, syncData]);


  const handleLogin = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setDocs([]);
    if (window.google) {
      const userToken = window.gapi?.client?.getToken();
      if (userToken) {
          window.google.accounts.oauth2.revoke(userToken.access_token, () => {});
          window.gapi.client.setToken(null);
      }
    }
  };

  const updateDocCategory = (docId: string, categoryId: string | null) => {
    if (!user) return;
    
    // Update local state for immediate UI feedback
    setDocs(prevDocs => prevDocs.map(doc => doc.id === docId ? { ...doc, categoryId } : doc));
    
    // Update localStorage for persistence
    const savedCategories: CategoryMapping = JSON.parse(localStorage.getItem(`${user.id}-categories`) || '{}');
    if (categoryId) {
        savedCategories[docId] = categoryId;
    } else {
        delete savedCategories[docId];
    }
    localStorage.setItem(`${user.id}-categories`, JSON.stringify(savedCategories));
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="flex flex-col items-center animate-fade-in">
              <LogoIcon className="h-16 w-16 text-primary mb-4" />
              <div className="flex space-x-2">
                <GoogleSheetIcon className="h-8 w-8 animate-subtle-pulse" />
                <GoogleDocIcon className="h-8 w-8 animate-subtle-pulse" style={{ animationDelay: '0.2s' }}/>
              </div>
              <p className="mt-4 text-lg text-gray-600">Initializing DocSync Hub...</p>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {user ? (
        <Dashboard
          user={user}
          docs={docs}
          categories={categories}
          onLogout={handleLogout}
          onUpdateDocCategory={updateDocCategory}
          onSync={() => syncData(window.gapi, window.google)}
          isSyncing={isSyncing}
        />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
