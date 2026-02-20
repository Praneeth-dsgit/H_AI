import React from 'react';
import { Stethoscope } from 'lucide-react';

const AuthHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex justify-center gap-3 p-4">
      <div className="relative flex items-center justify-center">
        <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
      </div>
      <div>
        <h1 className="text-xl font-bold text-blue-600">
          Acufore Health
        </h1>
        <p className="text-xs text-gray-500">Healthcare Management</p>
      </div>
    </header>
  );
};

export default AuthHeader;
