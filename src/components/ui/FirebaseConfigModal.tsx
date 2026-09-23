import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { 
  activeFirebaseConfig, 
  saveRuntimeFirebaseConfig, 
  clearStoredFirebaseConfig,
  isFirebaseConfigured, 
  FirebaseClientConfig 
} from '../../firebase/config';
import { Database, Key, CheckCircle, ExternalLink, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState(activeFirebaseConfig.apiKey?.includes('PlaceHolder') ? '' : activeFirebaseConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(activeFirebaseConfig.authDomain || '');
  const [projectId, setProjectId] = useState(activeFirebaseConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(activeFirebaseConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(activeFirebaseConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(activeFirebaseConfig.appId || '');
  
  const [rawSnippet, setRawSnippet] = useState('');
  const [showRawInput, setShowRawInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to parse pasted Firebase JS snippet
  const handleParseSnippet = (text: string) => {
    setRawSnippet(text);
    setError(null);
    try {
      const cleanText = text.replace(/[\r\n]+/g, ' ');
      
      const extract = (key: string) => {
        const regex = new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
        const match = cleanText.match(regex);
        return match ? match[1].trim() : '';
      };

      const parsedApiKey = extract('apiKey');
      const parsedAuthDomain = extract('authDomain');
      const parsedProjectId = extract('projectId');
      const parsedStorageBucket = extract('storageBucket');
      const parsedMessagingSenderId = extract('messagingSenderId');
      const parsedAppId = extract('appId');

      if (parsedApiKey && parsedProjectId) {
        setApiKey(parsedApiKey);
        setAuthDomain(parsedAuthDomain);
        setProjectId(parsedProjectId);
        setStorageBucket(parsedStorageBucket);
        setMessagingSenderId(parsedMessagingSenderId);
        setAppId(parsedAppId);
        setShowRawInput(false);
      } else if (text.trim().length > 0) {
        setError('Could not auto-parse all keys. Please verify or type the fields manually below.');
      }
    } catch (e) {
      setError('Invalid format. Please copy the firebaseConfig object from Firebase Console.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    const cleanProjectId = projectId.trim().replace(/^["']|["']$/g, '');

    if (!cleanApiKey || cleanApiKey.length < 10) {
      setError('Please provide a valid Firebase API Key.');
      return;
    }
    if (!cleanProjectId) {
      setError('Please provide a valid Firebase Project ID.');
      return;
    }

    setIsSaving(true);
    const newConfig: FirebaseClientConfig = {
      apiKey: cleanApiKey,
      authDomain: (authDomain.trim() || `${cleanProjectId}.firebaseapp.com`).replace(/^["']|["']$/g, ''),
      projectId: cleanProjectId,
      storageBucket: (storageBucket.trim() || `${cleanProjectId}.appspot.com`).replace(/^["']|["']$/g, ''),
      messagingSenderId: messagingSenderId.trim().replace(/^["']|["']$/g, ''),
      appId: appId.trim().replace(/^["']|["']$/g, ''),
    };

    try {
      // Save to server .env via Vite plugin
      await fetch('/api/save-firebase-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      }).catch(err => console.warn('Could not save to .env file:', err));
    } catch (e) {
      console.warn('API save .env skipped:', e);
    }

    // Save to localStorage & reload
    saveRuntimeFirebaseConfig(newConfig);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Firebase Project"
      subtitle="Configure real-time Google Cloud Firestore and Google Authentication"
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {/* Helper instruction */}
        <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200 text-xs space-y-2 text-neutral-800">
          <div className="flex items-center gap-2 font-bold text-[#FF6B00]">
            <Sparkles className="w-4 h-4" />
            <span>How to get your Firebase configuration:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-neutral-600 pl-1">
            <li>Open <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#FF6B00] font-semibold underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> and select your project.</li>
            <li>In <strong>Project Settings → General</strong>, scroll down to <em>Your apps (Web app)</em> and copy the <code className="bg-white px-1.5 py-0.5 rounded border text-[11px]">firebaseConfig</code> snippet.</li>
            <li>In <strong>Authentication → Sign-in method</strong>, enable <strong>Google</strong>.</li>
            <li>In <strong>Cloud Firestore</strong>, create a database.</li>
          </ol>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Option to paste full SDK snippet */}
        <div>
          <button
            type="button"
            onClick={() => setShowRawInput(!showRawInput)}
            className="text-xs font-semibold text-[#FF6B00] hover:underline mb-2 block"
          >
            {showRawInput ? "− Enter fields manually" : "+ Quick Paste: Paste Firebase SDK snippet"}
          </button>

          {showRawInput && (
            <div className="mb-4">
              <textarea
                rows={4}
                value={rawSnippet}
                onChange={(e) => handleParseSnippet(e.target.value)}
                placeholder={'Paste snippet here, e.g.:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "orange-health-..."\n};'}
                className="w-full bg-[#F7F7F5] border border-neutral-300 rounded-xl p-3 text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          )}
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              API Key <span className="text-[#FF6B00]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Project ID <span className="text-[#FF6B00]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. orange-health-lab-123"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Auth Domain
            </label>
            <input
              type="text"
              placeholder="e.g. project-id.firebaseapp.com"
              value={authDomain}
              onChange={(e) => setAuthDomain(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Storage Bucket
            </label>
            <input
              type="text"
              placeholder="e.g. project-id.appspot.com"
              value={storageBucket}
              onChange={(e) => setStorageBucket(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Messaging Sender ID
            </label>
            <input
              type="text"
              placeholder="e.g. 123456789012"
              value={messagingSenderId}
              onChange={(e) => setMessagingSenderId(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              App ID
            </label>
            <input
              type="text"
              placeholder="e.g. 1:123456789012:web:abcdef"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div>
            {isFirebaseConfigured && (
              <button
                type="button"
                onClick={clearStoredFirebaseConfig}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Clear Configuration
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              size="md" 
              isLoading={isSaving}
              leftIcon={<Key className="w-4 h-4" />}
            >
              Save & Connect
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
