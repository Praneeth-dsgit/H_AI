import { Message } from '../types';

const STORAGE_KEY = 'medchat-messages';
const SESSIONS_KEY = 'medchat-sessions';
const CURRENT_SESSION_KEY = 'medchat-current-session';

// Get user-specific storage keys
function getUserEmail(): string {
  return localStorage.getItem('userEmail') || 'anonymous';
}

function getUserStorageKey(baseKey: string): string {
  return `${getUserEmail()}_${baseKey}`;
}

export function saveMessages(messages: Message[]): void {
  try {
    localStorage.setItem(getUserStorageKey(STORAGE_KEY), JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages to localStorage:', error);
  }
}

export function getInitialMessages(): Message[] {
  try {
    const saved = localStorage.getItem(getUserStorageKey(STORAGE_KEY));
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error retrieving messages from localStorage:', error);
    return [];
  }
}

export function clearMessages(): void {
  try {
    localStorage.removeItem(getUserStorageKey(STORAGE_KEY));
  } catch (error) {
    console.error('Error clearing messages from localStorage:', error);
  }
}

export function saveSessions(sessions: any[]): void {
  try {
    localStorage.setItem(getUserStorageKey(SESSIONS_KEY), JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving sessions to localStorage:', error);
  }
}

export function getSessions(): any[] {
  try {
    const saved = localStorage.getItem(getUserStorageKey(SESSIONS_KEY));
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error retrieving sessions from localStorage:', error);
    return [];
  }
}

export function setCurrentSessionId(sessionId: string): void {
  try {
    localStorage.setItem(getUserStorageKey(CURRENT_SESSION_KEY), sessionId);
  } catch (error) {
    console.error('Error setting current session id:', error);
  }
}

export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(getUserStorageKey(CURRENT_SESSION_KEY));
  } catch (error) {
    console.error('Error getting current session id:', error);
    return null;
  }
}

export function removeSession(sessionId: string): void {
  try {
    const sessions = getSessions();
    const filtered = sessions.filter((s: any) => s.id !== sessionId);
    saveSessions(filtered);
  } catch (error) {
    console.error('Error removing session:', error);
  }
}

// Clear all user-specific data (for logout)
export function clearUserData(): void {
  try {
    const userEmail = getUserEmail();
    const keysToRemove: string[] = [];
    
    // Find all keys that belong to this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${userEmail}_`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove user-specific keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also clean up session capabilities
    const sessionCapabilities = JSON.parse(localStorage.getItem('sessionCapabilities') || '{}');
    const cleanedCapabilities: any = {};
    Object.keys(sessionCapabilities).forEach(sessionId => {
      // Keep capabilities that don't belong to sessions we're clearing
      const sessions = getSessions();
      if (!sessions.find(s => s.id === sessionId)) {
        delete sessionCapabilities[sessionId];
      }
    });
    localStorage.setItem('sessionCapabilities', JSON.stringify(sessionCapabilities));
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}