import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { OrangeHealthLogo } from '../components/ui/OrangeHealthLogo';
import { Sparkles, ShieldCheck, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Retrieve destination from previous route or default to dashboard
  const destination = (location.state as any)?.from?.pathname || '/';

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      toast.success('Welcome to Lab Hiring', 'Successfully authenticated with Google.');
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in popup was closed before completion. Please click Continue with Google to try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain (localhost) is not authorized in your Firebase project. In Firebase Console → Authentication → Settings → Authorized domains, add "localhost".');
      } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found' || err.message?.includes('CONFIGURATION_NOT_FOUND')) {
        setErrorMessage('Google Sign-in is not yet enabled in your Firebase Project. In Firebase Console → Authentication → Sign-in method, click Google, toggle Enable, and click Save.');
      } else if (
        err.code === 'auth/invalid-api-key' || 
        err.code === 'auth/api-key-not-valid'
      ) {
        setErrorMessage('Invalid Firebase API key or Project ID. Please verify your project credentials.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please verify your Google account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200 shadow-2xl space-y-7">
        {/* Brand Logo & Heading */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <OrangeHealthLogo variant="full" className="scale-125 my-2" />
          </div>
          
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF6B00]">Internal Diagnostics Portal</span>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight mt-0.5">
              Lab Hiring Command Center
            </h1>
          </div>

          <p className="text-sm text-neutral-600 max-w-xs mx-auto leading-relaxed">
            Track lab hiring requirements across locations, roles and teams.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Action Button: Continue with Google */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 text-neutral-900 border-2 border-neutral-200 hover:border-neutral-300 font-semibold py-3.5 px-5 rounded-2xl shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="text-sm font-bold">
              {isLoading ? "Authenticating..." : "Continue with Google"}
            </span>
          </button>
        </div>

        {/* Brand footer assurance */}
        <div className="pt-3 flex items-center justify-center gap-4 text-[11px] text-neutral-400 border-t border-neutral-100">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
            <span>Internal Orange Health System</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Speed Meets Science</span>
          </div>
        </div>
      </div>
    </div>
  );
};
