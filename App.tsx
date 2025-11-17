import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import { Doc, Category, GoogleUser, CategoryMapping } from './types';
import { GoogleDocIcon, GoogleSheetIcon, LogoIcon } from './components/icons';
import { fetchFiles } from './services/googleApiService';
import { initGemini } from './services/geminiService';

// Credentials provided by the user.
const GOOGLE_CLIENT_ID = 'gen-lang-client-0146489783';
const GOOGLE_API_KEY = 'AIzaSyAc0PpJ9sQWhEWplLZ9raRDwfudHrIYnZ0';

const App: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenClient, setTokenClient] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load static categories and check for existing session
  useEffect(() => {
    const defaultCategories: Category[] = [
      { id: '1', name: 'Work' },
      { id: '2', name: 'Personal' },
      { id: '3', name: 'Projects' },
      { id: '4', name: 'Finance' },
    ];
    setCategories(defaultCategories);
  }, []);

  const syncData = useCallback(async () => {
    if (!user || !window.gapi?.client?.drive) return;
    setIsSyncing(true);
    try {
      const files = await fetchFiles(window.gapi);
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
      if ((error as any)?.result?.error?.code === 401) {
         tokenClient?.requestAccessToken({ prompt: '' });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user, tokenClient]);


  useEffect(() => {
    const initClients = () => {
      const gapiLoadedCallback = () => {
        try {
          if (!window.google) {
            setError("Google Identity Services script failed to load. Please try again.");
            setIsLoading(false);
            return;
          }

          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                console.error('Token response error:', tokenResponse.error);
                setError(`Google Sign-In failed: ${tokenResponse.error_description || tokenResponse.error}`);
                return;
              }

              if (tokenResponse.access_token) {
                window.gapi.client.setToken(tokenResponse);
                
                try {
                  // Set the API Key for the gapi client. This is required for discovery requests.
                  window.gapi.client.setApiKey(GOOGLE_API_KEY);
                  
                  // Now load the Drive API since we have a token
                  await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');

                  // Fetch user profile
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
                  });
                  if (!res.ok) throw new Error(`Failed to fetch user profile: ${res.statusText}`);
                  const profile = await res.json();
                  
                  const googleUser: GoogleUser = {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    picture: profile.picture
                  };
                  setUser(googleUser);

                } catch (apiError) {
                    console.error("Error loading Drive API or fetching profile:", apiError);
                    setError("Could not connect to Google Drive. Please try signing in again.");
                }
              }
            },
          });
          setTokenClient(client);
        } catch (e) {
            console.error("Initialization failed:", e);
            setError(e instanceof Error ? e.message : "An unknown error occurred during setup.");
        } finally {
            setIsLoading(false);
        }
      };

      const waitForGapi = () => {
        if (window.gapi && window.gapi.load) {
          window.gapi.load('client', gapiLoadedCallback);
        } else {
          setTimeout(waitForGapi, 100);
        }
      };
      
      initGemini(GOOGLE_API_KEY);
      waitForGapi();
    };

    initClients();
  }, []);

  useEffect(() => {
    if (user && window.gapi) {
      syncData();
    }
  }, [user, syncData]);


  const handleLogin = () => {
    if (tokenClient) {
      // Prompt for consent to ensure a new token is requested if needed
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        setError("Google Sign-In is not ready yet. Please wait a moment and try again.");
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
    
    setDocs(prevDocs => prevDocs.map(doc => doc.id === docId ? { ...doc, categoryId } : doc));
    
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

  if (error) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-red-50">
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
                  <p className="text-gray-700">{error}</p>
                  <button onClick={() => window.location.reload()} className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                      Try Again
                  </button>
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
          onSync={syncData}
          isSyncing={isSyncing}
        />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;