/**
 * Floating Chat Bot Button
 * Opens the chat interface in a modal/overlay
 * Used in General Practitioner Dashboard - shows "General Medical Assistant"
 */

import React, { useState } from 'react';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import ChatInterface from './ChatInterface';

const FloatingChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const maximizeChat = () => {
    setIsMinimized(false);
  };

  const closeChat = () => {
    // Clear chat messages from localStorage when closing
    try {
      localStorage.removeItem('general_practitioner_chat_messages');
    } catch (error) {
      console.error('Error clearing chat messages:', error);
    }
    setIsOpen(false);
    setIsMinimized(false);
    setShowCloseConfirm(false);
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCloseConfirm(true);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full hover:rounded-2xl px-4 py-4 shadow-lg hover:shadow-xl transition-all duration-100 z-50 flex items-center justify-center group overflow-hidden"
          aria-label="Open AI Assistant"
        >
          <div className="flex items-center gap-0 group-hover:gap-3 transition-all duration-300">
            <MessageSquare 
              size={24} 
              className="group-hover:-rotate-12 transition-transform duration-300 flex-shrink-0" 
            />
            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] whitespace-nowrap transition-all duration-300 font-medium text-sm overflow-hidden">
              General Health Assistant
            </span>
          </div>
        </button>
      )}

      {/* Chat Interface Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
          <div
            className={`
              rounded-lg shadow-2xl hover:shadow-3xl flex flex-col overflow-hidden transition-all duration-300 pointer-events-auto
              ${isMinimized 
                ? 'w-[300px] h-[56px] cursor-pointer bg-blue-100 border-2 border-blue-300' 
                : 'w-[400px] h-[600px] bg-white shadow-2xl rounded-t-lg border-t border-l border-r border-gray-200'}
            `}
            onClick={() => isMinimized && maximizeChat()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b border-gray-200 bg-blue-50 ${
              isMinimized ? 'px-4 py-2' : 'p-4 bg-blue-600 text-white rounded-t-lg'
            }`}>
              <div className="flex items-center space-x-2">
                {isMinimized ? (
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={14} className="text-white" />
                  </div>
                ) : (
                  <MessageSquare size={20} />
                )}
                <h3 className={`font-semibold ${
                  isMinimized 
                    ? 'text-sm' 
                    : ''
                }`}>
                  {isMinimized ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 transition-all duration-200 hover:bg-blue-200 hover:text-blue-900 hover:shadow-md hover:scale-105">
                      General Health Assistant
                    </span>
                  ) : (
                    'General Health Assistant'
                  )}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMinimized) {
                      maximizeChat();
                    } else {
                      minimizeChat();
                    }
                  }}
                  className={`p-1 rounded-md transition-all duration-200 ${
                    isMinimized
                      ? 'text-gray-600 hover:text-white hover:bg-blue-400 hover:shadow-md hover:scale-110'
                      : 'hover:bg-blue-700 rounded text-white'
                  }`}
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                {!isMinimized && (
                  <button
                    onClick={handleCloseClick}
                    className="p-1 hover:bg-blue-700 rounded transition-colors text-white"
                    aria-label="Close"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Chat Content */}
            <div
              className={`flex-1 overflow-hidden relative transition-opacity duration-200
                ${isMinimized ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'}
              `}
            >
              <ChatInterface />
              
              {/* Close Confirmation Popup */}
              {showCloseConfirm && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl hover:shadow-2xl p-6 border transition-all duration-200">
                    <p className="text-sm mb-4 text-center">
                      Closing will clear chat history. Continue?
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setShowCloseConfirm(false)}
                        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 hover:shadow-md hover:scale-105 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={closeChat}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md hover:scale-105 transition-all duration-200"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && !isMinimized && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={minimizeChat}
        />
      )}
    </>
  );
};

export default FloatingChatBot;

