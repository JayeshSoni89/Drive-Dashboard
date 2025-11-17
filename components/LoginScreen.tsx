import React from 'react';
import { LogoIcon, GoogleSheetIcon, GoogleDocIcon } from './icons';

interface LoginScreenProps {
  onLogin: () => void;
}

const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691c-1.229 2.194-1.954 4.708-1.954 7.309c0 2.601.725 5.114 1.954 7.309l-5.657 5.657C.883 31.383 0 27.886 0 24c0-3.886.883-7.383 2.306-10.309l5.657 5.657z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-5.657-5.657C30.046 35.547 27.268 37 24 37c-5.223 0-9.649-3.343-11.303-7.918l-5.657 5.657C10.14 41.523 16.591 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083L43.595 20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.657 5.657C42.843 36.331 46 30.723 46 24c0-2.115-.31-4.14-.852-6.09z" />
    </svg>
);


const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center animate-slide-up">
        <div className="flex justify-center mb-6">
          <LogoIcon className="w-16 h-16 text-primary"/>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to DocSync Hub</h1>
        <p className="text-gray-600 mb-8">Sync and organize your Google Docs & Sheets.</p>
        
        <div className="flex justify-center space-x-4 mb-8">
            <div className="p-4 bg-green-100 rounded-full">
                <GoogleSheetIcon className="w-8 h-8" />
            </div>
            <div className="p-4 bg-blue-100 rounded-full">
                <GoogleDocIcon className="w-8 h-8" />
            </div>
        </div>
        
        <button
            onClick={onLogin}
            className="w-full flex items-center justify-center bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-300 shadow-sm hover:shadow-lg"
        >
            <GoogleIcon />
            Sign in with Google
        </button>
        <p className="text-xs text-gray-400 mt-6">
            By continuing, you agree to grant read-only access to your Google Drive files.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;