import React from 'react';
import { Activity } from 'lucide-react';

interface AuthHeaderProps {
  onNavigateToHome: () => void;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ onNavigateToHome }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-center">
          <button 
            onClick={onNavigateToHome}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Activity className="h-8 w-8 text-primary-500" />
            <span className="font-bold text-3xl text-indigo-800">MedChat</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader; 