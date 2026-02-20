/**
 * Patient Portal Layout Component
 * Separate layout for patient portal features (dashboard, appointments, etc.)
 * This is distinct from the Patient Engagement chat interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Scan, FileText, CreditCard,
  User, Users, LogOut, X, Stethoscope, Building2, Minus, Maximize2, Bell, ChevronDown
}from 'lucide-react';
import AiAssistantIcon from '../assets/ai_assistant_icon.png';  
import PatientDashboard from './patient/PatientDashboard';
import PatientProfile from './patient/PatientProfile';
import FamilyMembers from './patient/FamilyMembers';
import Doctors from './patient/Doctors';
import Facilities from './patient/Facilities';
import AppointmentList from './appointments/AppointmentList';
import AppointmentBooking from './appointments/AppointmentBooking';
import RadiologyBooking from './radiology/RadiologyBooking';
import RadiologyList from './radiology/RadiologyList';
import MedicalRecords from './records/MedicalRecords';
import BillingDashboard from './billing/BillingDashboard';
import PatientPortalChat from './patient/PatientPortalChat';
import Notifications from './patient/Notifications';
import { patientService } from '../services/patientService';
import { notificationService, Notification } from '../services/notificationService';


const PatientPortalLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen] = useState(true);
  // Persist chat visibility state across navigation
  const [showChat, setShowChat] = useState(() => {
    const saved = sessionStorage.getItem('patient_portal_chat_visible');
    return saved === 'true';
  });
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = sessionStorage.getItem('patient_portal_chat_minimized');
    return saved === 'true';
  });
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientId, setPatientId] = useState('');
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const lastNotificationIdRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const chatRef = React.useRef<{ clearMessages: () => void } | null>(null);

  // Persist chat state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('patient_portal_chat_visible', String(showChat));
  }, [showChat]);

  useEffect(() => {
    sessionStorage.setItem('patient_portal_chat_minimized', String(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    loadPatientName();
    loadNotifications();
    
    // Start polling for new notifications every 10 seconds
    pollingIntervalRef.current = window.setInterval(() => {
      checkForNewNotifications();
    }, 10000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadPatientName = async () => {
    setLoadingPatient(true);
    try {
      const result = await patientService.getProfile();
      if (result.success && result.patient) {
        setPatientFirstName(result.patient.first_name || '');
        setPatientLastName(result.patient.last_name || '');
        setPatientEmail(result.patient.email || '');
        setPatientId(result.patient.patient_id || '');
      }
    } catch (error) {
      console.error('Error loading patient name:', error);
    } finally {
      setLoadingPatient(false);
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const loadNotifications = async () => {
    try {
      const result = await notificationService.getNotifications(false);
      if (result.success && result.notifications) {
        const unread = result.notifications.filter(n => !n.is_read);
        setUnreadCount(unread.length);
        
        // Set the last notification ID to track new ones
        if (result.notifications.length > 0) {
          lastNotificationIdRef.current = result.notifications[0].notification_id;
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkForNewNotifications = async () => {
    try {
      const result = await notificationService.getNotifications(true); // Only unread
      if (result.success && result.notifications) {
        // Check if there are new notifications
        const newNotifications = result.notifications.filter(
          n => !lastNotificationIdRef.current || n.notification_id > lastNotificationIdRef.current
        );
        
        if (newNotifications.length > 0) {
          // Update unread count
          setUnreadCount(prev => prev + newNotifications.length);
          
          // Show popup for the most recent notification
          setCurrentNotification(newNotifications[0]);
          setShowNotificationPopup(true);
          
          // Update last notification ID
          lastNotificationIdRef.current = newNotifications[0].notification_id;
        }
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  const handleNotificationClose = async () => {
    if (currentNotification) {
      // Mark as read
      await notificationService.markAsRead(currentNotification.notification_id);
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    setShowNotificationPopup(false);
    setCurrentNotification(null);
  };

  const handleViewNotifications = () => {
    handleNotificationClose();
    navigate('/portal/notifications');
  };

  const handleLogout = () => {
    import('../services/authService').then((m) => m.clearAuth());
    navigate('/login');
  };

  const menuItems = [
    { path: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/portal/profile', icon: User, label: 'Profile' },
    { path: '/portal/family', icon: Users, label: 'Your Family' },
    { path: '/portal/doctors', icon: Stethoscope, label: 'Doctors' },
    { path: '/portal/facilities', icon: Building2, label: 'Facilities' },
    { path: '/portal/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/portal/radiology', icon: Scan, label: 'Radiology' },
    { path: '/portal/records', icon: FileText, label: 'Medical Records' },
    { path: '/portal/billing', icon: CreditCard, label: 'Billing' },
  ];

  // Get welcome message - always shown in header
  const getWelcomeMessage = () => {
    return patientFirstName || patientLastName
      ? `Welcome, ${patientFirstName || ''} ${patientLastName || ''}!`.trim()
      : 'Welcome to Your Patient Portal!';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-xl font-bold text-blue-600">Acufore Health</h1>
              <p className="text-xs text-gray-500">Healthcare Management</p>
          </div>
          <div className="h-12 w-px bg-gray-300"></div>
          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Patient ID: <span className="font-mono">{patientId || 'Loading...'}</span>
                </p>
              </div>
              {/* Top Right: Notifications and Profile */}
              <div className="flex items-center gap-4">
                {/* Notification Bell Button */}
                <button
                  onClick={() => navigate('/portal/notifications')}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title={`${unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}`}
                >
                  <Bell size={20} className="text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile/Account Info Container */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      {loadingPatient ? (
                        <div className="text-left hidden sm:block">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="text-left hidden sm:block">
                          <p className="text-sm font-medium text-gray-900">
                            {patientFirstName && patientLastName
                              ? `${patientFirstName} ${patientLastName}`
                              : patientFirstName || 'Patient'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {patientEmail || 'No email'}
                          </p>
            </div>
          )}
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-gray-200 sm:hidden">
                            <p className="text-sm font-medium text-gray-900">
                              {patientFirstName && patientLastName
                                ? `${patientFirstName} ${patientLastName}`
                                : patientFirstName || 'Patient'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {patientEmail || 'No email'}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigate('/portal/profile');
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <User className="w-4 h-4 mr-2" />
                            View Profile
                          </button>
          <button
                            onClick={() => {
                              handleLogout();
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-60' : 'w-20'} bg-white border-r border-gray-200 shadow-lg transition-all duration-300 flex flex-col`}>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/portal/appointments' && location.pathname.startsWith('/portal/appointments')) ||
              (item.path === '/portal/radiology' && location.pathname.startsWith('/portal/radiology')) ||
              (item.path === '/portal/doctors' && location.pathname.startsWith('/portal/doctors')) ||
              (item.path === '/portal/facilities' && location.pathname.startsWith('/portal/facilities')) ||
              (item.path === '/portal/notifications' && location.pathname === '/portal/notifications');

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md hover:shadow-lg' 
                    : 'text-gray-700 hover:bg-gray-100 hover:shadow-md hover:translate-x-1'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto relative">
          {location.pathname === '/portal/dashboard' || location.pathname === '/portal' ? (
            <PatientDashboard />
          ) : location.pathname === '/portal/profile' ? (
            <PatientProfile />
          ) : location.pathname === '/portal/family' ? (
            <FamilyMembers />
          ) : location.pathname === '/portal/doctors' ? (
            <Doctors />
          ) : location.pathname === '/portal/facilities' ? (
            <Facilities />
          ) : location.pathname === '/portal/appointments/book' ? (
            <AppointmentBooking />
          ) : location.pathname === '/portal/appointments' ? (
            <AppointmentList />
          ) : location.pathname === '/portal/radiology/book' ? (
            <RadiologyBooking />
          ) : location.pathname === '/portal/radiology' ? (
            <RadiologyList />
          ) : location.pathname === '/portal/records' ? (
            <MedicalRecords />
          ) : location.pathname === '/portal/billing' ? (
            <BillingDashboard />
          ) : location.pathname === '/portal/notifications' ? (
            <Notifications />
          ) : (
            <PatientDashboard />
          )}

          {/* Floating AI Chat Button */}
        {!showChat && (
          <button
          onClick={() => {
            setShowChat(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-1 right-8 z-50 items-center hover:scale-110 transition-all duration-300"
        >
          <img
            src={AiAssistantIcon}
            alt="AI Assistant"
            className="w-20 h-20 hover:scale-110 transition-all duration-300 drop-shadow-lg hover:drop-shadow-2xl rounded-full border-2 border-blue-900 hover:border-blue-700"
          />
          <span className="mt-2 text-lg font-bold bg-clip-text text-blue-900 hover:text-blue-700 transition-colors duration-200">
            Assistant
          </span>
        </button>        
        )}

        {/* Chat Window - Always mounted to preserve state across navigation */}
        <>
          {/* Overlay - only show when chat is open and not minimized */}
          {showChat && !isMinimized && (
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setIsMinimized(true)}
            />
          )}

          {/* Chat Widget - always mounted but conditionally visible */}
          <div
            className={`fixed bottom-0 right-0 rounded-lg shadow-2xl hover:shadow-3xl z-50 flex flex-col overflow-hidden transition-all duration-300
              ${!showChat ? 'hidden' : ''}
              ${isMinimized 
                ? 'w-[300px] h-[56px] cursor-pointer bg-blue-100 border-2 border-blue-300' 
                : 'w-[400px] h-[600px] bg-white'}
            `}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b border-gray-200 bg-blue-50 ${
              isMinimized ? 'px-4 py-2' : 'p-4'
            }`}>
              <h2 className="text-sm font-semibold">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 transition-all duration-200 hover:bg-blue-200 hover:text-blue-900 hover:shadow-md hover:scale-105">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={14} className="text-white" />
                  </div>
                  {patientFirstName
                    ? `${patientFirstName}'s Assistant`
                    : 'AI Health Assistant'}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMinimized) {
                      setIsMinimized(false);
                    } else {
                      setIsMinimized(true);
                    }
                  }}
                  title={isMinimized ? "Maximize" : "Minimize"}
                  className="p-1 rounded-md text-gray-600 hover:text-white hover:bg-blue-400 hover:shadow-md hover:scale-110 transition-all duration-200"
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minus size={18} />}
                </button>

                {showChat && !isMinimized && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCloseConfirm(true);
                    }}
                    title="Close"
                    className="p-1 rounded-md text-gray-600 hover:text-white hover:bg-red-400 hover:shadow-md hover:scale-110 transition-all duration-200"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Chat Body - always render but conditionally visible */}
            <div
              className={`flex-1 overflow-hidden relative transition-opacity duration-200
                ${isMinimized ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'}
              `}
            >
              <PatientPortalChat ref={chatRef} />

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
                        onClick={() => {
                          chatRef.current?.clearMessages();
                          setShowChat(false);
                          setShowCloseConfirm(false);
                        }}
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
        </>

        {/* Notification Popup */}
        {showNotificationPopup && currentNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{currentNotification.title}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(currentNotification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNotificationClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-gray-700 mb-6">{currentNotification.message}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleViewNotifications}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Notifications
                </button>
                <button
                  onClick={handleNotificationClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPortalLayout;
