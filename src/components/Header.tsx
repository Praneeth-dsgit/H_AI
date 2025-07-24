import React, { useState, useRef, useEffect } from 'react';
import { Activity, Trash2, User, LogIn, UserPlus, LogOut, ChevronDown, HelpCircle, PlusCircle } from 'lucide-react';
import AboutModal from './AboutModal';
import PrivacyModal from './PrivacyModal';
import HelpModal from './HelpModal';

interface HeaderProps {
  sessions: any[];
  currentSessionId: string | null;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  getSessionTopic: (session: any) => string;
  getSessionCapability?: (sessionId: string) => string;
  handleSessionSwitch: (sessionId: string) => void;
  handleDeleteSession: (sessionId: string) => void;
  handleNewSession: () => void;
  children?: React.ReactNode;
  capabilityInfo?: {
    name: string;
    color: string;
    bgColor: string;
  };
  onNavigateToLogin?: () => void;
  onNavigateToSignup?: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
  onSelectPrompt?: (prompt: string) => void;
  selectedCapability?: string | null;
}

const Header: React.FC<HeaderProps> = ({
  sessions,
  currentSessionId,
  showDropdown,
  setShowDropdown,
  dropdownRef,
  getSessionTopic,
  getSessionCapability,
  handleSessionSwitch,
  handleDeleteSession,
  handleNewSession,
  children,
  capabilityInfo,
  onNavigateToLogin,
  onNavigateToSignup,
  onLogout,
  isAuthenticated,
  onSelectPrompt,
  selectedCapability
}) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showFaqDropdown, setShowFaqDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const faqDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!showProfileDropdown && !showFaqDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (faqDropdownRef.current && !faqDropdownRef.current.contains(event.target as Node)) {
        setShowFaqDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown, showFaqDropdown]);

  // Get capability-specific prompts
  const getCapabilityPrompts = (capability: string | null) => {
    switch (capability) {
      case 'radiology':
        return [
          "How to interpret a chest X-ray?",
          "What are the signs of pneumonia on imaging?",
          "How to identify fractures on X-ray?",
          "What does a normal CT scan of the brain look like?",
          "How to read an MRI of the spine?",
          "What are the radiological signs of stroke?",
          "How to interpret abdominal ultrasound?",
          "What imaging is best for joint problems?",
          "How to identify kidney stones on CT?",
          "What are the signs of appendicitis on imaging?"
        ];
      
      case 'lab':
        return [
          "How to interpret CBC results?",
          "What do elevated liver enzymes mean?",
          "How to read lipid panel results?",
          "What are normal kidney function values?",
          "How to interpret thyroid function tests?",
          "What does high CRP indicate?",
          "How to read blood glucose levels?",
          "What are normal electrolyte ranges?",
          "How to interpret cardiac enzyme results?",
          "What does elevated troponin mean?"
        ];
      
      case 'general':
      default:
        return [
          "What are the symptoms of diabetes?",
          "How can I lower my blood pressure?",
          "What causes frequent headaches?",
          "What should I do if I have a fever?",
          "What are the side effects of paracetamol?",
          "How do I know if I have COVID-19?",
          "What is a normal heart rate?",
          "How much sleep do adults need?",
          "What are the signs of a heart attack?",
          "How can I treat a cold at home?"
        ];
    }
  };

  const getCapabilityLabel = (capability: string | null) => {
    switch (capability) {
      case 'radiology': return 'Radiology Quick Questions';
      case 'lab': return 'Lab Interpretation Quick Questions';
      case 'general': 
      default: return 'Medical FAQ';
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center space-x-4 min-w-[180px]">
                <Activity className="h-6 w-6 text-primary-500" />
                <span className="font-bold text-2xl text-indigo-800">MedChat</span>
                {capabilityInfo && (
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${capabilityInfo.bgColor} ${capabilityInfo.color}`}>
                      {capabilityInfo.name}
                    </div>
                    {selectedCapability && onSelectPrompt && (
                      <div className="relative" ref={faqDropdownRef}>
                        <button
                          onClick={() => setShowFaqDropdown(!showFaqDropdown)}
                          className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                          title={getCapabilityLabel(selectedCapability)}
                        >
                          <HelpCircle size={14} className="mr-1" />
                          FAQ
                          <ChevronDown size={12} className="ml-1" />
                        </button>
                        
                        {showFaqDropdown && (
                          <div className="absolute left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-gray-100">
                              <h3 className="text-sm font-medium text-gray-800">{getCapabilityLabel(selectedCapability)}</h3>
                              <p className="text-xs text-gray-500 mt-1">Click any question to add it to your chat</p>
                            </div>
                            <div className="p-2 space-y-1">
                              {getCapabilityPrompts(selectedCapability).map((prompt, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setShowFaqDropdown(false);
                                    onSelectPrompt(prompt);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-start transition-colors"
                                >
                                  <PlusCircle size={14} className="mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                                  <span>{prompt}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Session Dropdown and New Session Button aligned with chat window */}
              <div className="flex-grow flex items-center" style={{ marginLeft: 0 }}>
                <div className="relative" ref={dropdownRef}>
                  <div className="inline-block relative">
                    <button
                      className="px-3 py-1 rounded text-sm font-medium border bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center"
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      Chats
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {showDropdown && (
                      <div className="absolute left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg z-10">
                        {sessions.map((session) => (
                          <div key={session.id} className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-primary-50 ${currentSessionId === session.id ? 'bg-primary-100' : ''}`}
                            onClick={() => handleSessionSwitch(session.id)}
                          >
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="truncate text-sm font-medium">{getSessionTopic(session)}</span>
                              {getSessionCapability && (
                                <span className="text-xs text-gray-500">{getSessionCapability(session.id)}</span>
                              )}
                            </div>
                            {sessions.length > 1 && (
                              <button
                                className="ml-2 p-1 text-gray-400 hover:text-red-600 flex-shrink-0"
                                onClick={e => { e.stopPropagation(); handleDeleteSession(session.id); }}
                                title="Delete session"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="ml-2 px-3 py-1 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600"
                  onClick={handleNewSession}
                >
                  + New Chat
                </button>
                {children}
              </div>
            </div>
            <nav>
              <ul className="flex space-x-4 items-center">
                <li>
                  <button 
                    onClick={() => setShowAboutModal(true)}
                    className="text-sm text-gray-600 hover:text-primary-500 transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-sm text-gray-600 hover:text-primary-500 transition-colors"
                  >
                    Privacy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowHelpModal(true)}
                    className="text-sm text-gray-600 hover:text-primary-500 transition-colors"
                  >
                    Help
                  </button>
                </li>
                <li className="relative">
                  <div ref={profileDropdownRef}>
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      title={isAuthenticated ? "Profile" : "Login / Sign Up"}
                    >
                      <User size={18} className="text-gray-600" />
                    </button>
                    
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {isAuthenticated ? (
                          <>
                            <div className="px-4 py-2 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-700">Logged In</p>
                              <p className="text-xs text-gray-500">Healthcare Professional</p>
                            </div>
                            <button
                              onClick={() => {
                                setShowProfileDropdown(false);
                                onLogout && onLogout();
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <LogOut size={16} className="mr-2" />
                              Logout
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="px-4 py-2 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-700">Access Your Account</p>
                              <p className="text-xs text-gray-500">Sign in or create an account</p>
                            </div>
                            <button
                              onClick={() => {
                                setShowProfileDropdown(false);
                                onNavigateToLogin && onNavigateToLogin();
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <LogIn size={16} className="mr-2" />
                              Login
                            </button>
                            <button
                              onClick={() => {
                                setShowProfileDropdown(false);
                                onNavigateToSignup && onNavigateToSignup();
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <UserPlus size={16} className="mr-2" />
                              Sign Up
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </>
  );
};

export default Header;