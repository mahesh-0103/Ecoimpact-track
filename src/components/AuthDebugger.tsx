import { useState, useEffect } from 'react';
import { useSession, useDescope } from '@descope/react-sdk';
import { X, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';

const AuthDebugger = () => {
  const { isAuthenticated, isSessionLoading, user } = useSession();
  const { logout } = useDescope();
  const [isVisible, setIsVisible] = useState(false);
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    const loadAuthData = () => {
      const localStorageData: { [key: string]: any } = {};
      const sessionStorageData: { [key: string]: any } = {};

      // Get all localStorage data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('descope') || key.includes('auth') || key.includes('session'))) {
          try {
            localStorageData[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            localStorageData[key] = localStorage.getItem(key);
          }
        }
      }

      // Get all sessionStorage data
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('descope') || key.includes('auth') || key.includes('session'))) {
          try {
            sessionStorageData[key] = JSON.parse(sessionStorage.getItem(key) || '');
          } catch {
            sessionStorageData[key] = sessionStorage.getItem(key);
          }
        }
      }

      setAuthData({
        isAuthenticated,
        isSessionLoading,
        user,
        localStorage: localStorageData,
        sessionStorage: sessionStorageData,
        timestamp: new Date().toISOString()
      });
    };

    loadAuthData();
  }, [isAuthenticated, isSessionLoading, user]);

  const clearAllAuthData = () => {
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('descope') || key.includes('auth') || key.includes('session')) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('descope') || key.includes('auth') || key.includes('session')) {
        sessionStorage.removeItem(key);
      }
    });

    // Force logout
    logout();

    // Reload page
    window.location.reload();
  };

  const forceLogout = () => {
    logout();
    window.location.reload();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-full transition-all duration-300 z-50"
        title="Show Auth Debugger"
      >
        <Eye className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-terra-panel/95 backdrop-blur-md border border-terra-panel-light/50 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-terra-primary">Authentication Debugger</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-terra-secondary hover:text-terra-primary transition-colors duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Auth State */}
          <div className="backdrop-blur-md bg-terra-darker/50 border border-terra-panel-light/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-terra-primary mb-3">Current Authentication State</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-terra-secondary">Authenticated:</span>
                <span className={`ml-2 font-semibold ${isAuthenticated ? 'text-green-400' : 'text-red-400'}`}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-terra-secondary">Loading:</span>
                <span className={`ml-2 font-semibold ${isSessionLoading ? 'text-yellow-400' : 'text-green-400'}`}>
                  {isSessionLoading ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-terra-secondary">User:</span>
                <span className="ml-2 font-semibold text-terra-primary">
                  {user ? `${user.name || user.email || 'Unknown'}` : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Stored Data */}
          <div className="backdrop-blur-md bg-terra-darker/50 border border-terra-panel-light/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-terra-primary mb-3">Stored Authentication Data</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-terra-accent font-medium mb-2">localStorage:</h4>
                <pre className="bg-black/30 rounded p-3 text-xs text-terra-secondary overflow-x-auto">
                  {JSON.stringify(authData?.localStorage || {}, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-terra-accent font-medium mb-2">sessionStorage:</h4>
                <pre className="bg-black/30 rounded p-3 text-xs text-terra-secondary overflow-x-auto">
                  {JSON.stringify(authData?.sessionStorage || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="backdrop-blur-md bg-terra-darker/50 border border-terra-panel-light/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-terra-primary mb-3">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={clearAllAuthData}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-300"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Auth Data & Reload</span>
              </button>
              <button
                onClick={forceLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors duration-300"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Force Logout & Reload</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors duration-300"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="backdrop-blur-md bg-terra-darker/50 border border-terra-panel-light/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-terra-primary mb-3">Troubleshooting Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-terra-secondary">
              <li>Click "Clear All Auth Data & Reload" to remove all cached authentication</li>
              <li>You should be redirected to the login page</li>
              <li>Try authenticating with Google or email</li>
              <li>If it still bypasses, check the Descope configuration in your .env file</li>
              <li>Make sure VITE_DESCOPE_PROJECT_ID is correct</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;



