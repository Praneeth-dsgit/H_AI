import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, Clock, ArrowUp, Bot, UserCircle, BrainCircuit, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatabaseResult {
  [key: string]: any;
}

interface QueryResult {
  success: boolean;
  results: DatabaseResult[];
  natural_results?: string[];
  error?: string;
  message?: string;
  count?: number;
}

interface DailyAppointment {
  id: string;
  appointmentDate: string;
  patientName: string;
  patientPhone: string;
  appointmentTime: string;
  doctorName: string;
  department: string;
  status: string;
}

interface QueryMessage { 
  id: string;
  query: string;
  results: DatabaseResult[];
  natural_results?: string[];
  timestamp: Date;
  error?: string;
  showBookingForm?: boolean;
}

interface AppointmentFormData {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  age?: string;
  gender: string;
  weight?: string;
  doctorId: string;
  departmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}

interface Doctor {
  id: number;
  name: string;
  department_id: number;
  department_name: string;
}

interface Department {
  id: number;
  name: string;
}

interface PatientEngagementProps {
  sessionId?: string | null;
}

const PatientEngagement: React.FC<PatientEngagementProps> = ({ sessionId }) => {
  const [query, setQuery] = useState('');
  const [queryMessages, setQueryMessages] = useState<QueryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentFormData, setAppointmentFormData] = useState<AppointmentFormData>({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    age: '',
    gender: '',
    weight: '',
    doctorId: '',
    departmentId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [conflictError, setConflictError] = useState<string>('');
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Record<string, Array<{time: string, displayTime: string}>>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateRangeOffset, setDateRangeOffset] = useState<number>(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load query messages from session storage on mount or session change
  useEffect(() => {
    if (sessionId) {
      try {
        const userEmail = sessionStorage.getItem('userEmail') || 'anonymous';
        const sessionsKey = `${userEmail}_medchat-sessions`;
        const savedSessions = localStorage.getItem(sessionsKey);
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          const currentSession = sessions.find((s: any) => s.id === sessionId);
          if (currentSession && currentSession.engagementMessages) {
            // Convert stored messages back to QueryMessage format
            const loadedMessages = currentSession.engagementMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setQueryMessages(loadedMessages);
          } else {
            // No saved messages for this session, start fresh
            setQueryMessages([]);
          }
        }
      } catch (error) {
        console.error('Error loading engagement messages from session:', error);
      }
    }
  }, [sessionId]);

  // Save query messages to session storage whenever they change
  useEffect(() => {
    if (sessionId) {
      try {
        const userEmail = sessionStorage.getItem('userEmail') || 'anonymous';
        const sessionsKey = `${userEmail}_medchat-sessions`;
        const savedSessions = localStorage.getItem(sessionsKey);
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          const updatedSessions = sessions.map((s: any) => {
            if (s.id === sessionId) {
              return {
                ...s,
                engagementMessages: queryMessages
              };
            }
            return s;
          });
          localStorage.setItem(sessionsKey, JSON.stringify(updatedSessions));
        } else if (queryMessages.length > 0) {
          // If no sessions exist yet but we have messages, create a session
          const newSession = {
            id: sessionId,
            name: `Session ${Date.now()}`,
            messages: [],
            engagementMessages: queryMessages
          };
          localStorage.setItem(sessionsKey, JSON.stringify([newSession]));
        }
      } catch (error) {
        console.error('Error saving engagement messages to session:', error);
      }
    }
  }, [queryMessages, sessionId]);

  // Fetch daily appointments on component mount
  useEffect(() => {
    fetchDailyAppointments();
  }, []);

  // Fetch doctors and departments when form is shown
  const fetchDoctorsAndDepartments = async () => {
    try {
      setLoadingDoctors(true);
      setLoadingDepartments(true);
      
      // Fetch doctors
      const doctorsResponse = await fetch('http://localhost:5000/api/patient-engagement/doctors');
      const doctorsData = await doctorsResponse.json();
      
      if (doctorsData.success) {
        setDoctors(doctorsData.doctors || []);
      }
      
      // Fetch departments
      const deptResponse = await fetch('http://localhost:5000/api/patient-engagement/departments');
      const deptData = await deptResponse.json();
      
      if (deptData.success) {
        setDepartments(deptData.departments || []);
      }
    } catch (err) {
      console.error('Error fetching doctors/departments:', err);
    } finally {
      setLoadingDoctors(false);
      setLoadingDepartments(false);
    }
  };

  // Fetch available slots for a specific doctor
  const fetchAvailableSlotsForDoctor = async (doctorId: string) => {
    if (!doctorId) {
      return;
    }

    try {
      setLoadingSlots(true);
      const response = await fetch('http://localhost:5000/api/patient-engagement/available-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: doctorId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.availableSlots || {});
        // Set first available date as selected
        const dates = Object.keys(data.availableSlots || {}).filter(date => 
          (data.availableSlots[date] || []).length > 0
        );
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
          setDateRangeOffset(0); // Reset date range offset
          // Automatically open the slot picker modal
          setShowSlotPicker(true);
        } else {
          // No slots available, show message but don't open modal
          setShowSlotPicker(false);
        }
      } else {
        console.error('Failed to fetch available slots:', data.error);
        setShowSlotPicker(false);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setShowSlotPicker(false);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch available slots for selected doctor (manual trigger via button)
  const fetchAvailableSlots = async () => {
    if (!appointmentFormData.doctorId) {
      alert('Please select a doctor first');
      return;
    }
    await fetchAvailableSlotsForDoctor(appointmentFormData.doctorId);
  };

  // Handle slot selection
  const handleSlotSelect = (date: string, time: string) => {
    setAppointmentFormData(prev => ({
      ...prev,
      appointmentDate: date,
      appointmentTime: time
    }));
    setShowSlotPicker(false);
    setConflictError('');
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [queryMessages, isLoading]);

  const fetchDailyAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const response = await fetch('http://localhost:5000/api/patient-engagement/daily-appointments');
      const data = await response.json();
      
      if (data.success) {
        // Transform backend data to match frontend interface
        const transformedAppointments = (data.appointments || []).map((appointment: any) => ({
          id: appointment.appointment_id?.toString() || '',
          appointmentDate: appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString() : '',
          patientName: appointment.patient_name || '',
          patientPhone: appointment.patient_phone || '',
          appointmentTime: appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          doctorName: appointment.doctor_name || '',
          department: appointment.department_name || '',
          status: appointment.status || ''
        }));
        
        setDailyAppointments(transformedAppointments);
        console.log('Transformed appointments:', transformedAppointments);
      } else {
        console.error('Failed to fetch daily appointments:', data.error);
      }
    } catch (err) {
      console.error('Error fetching daily appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query.trim().toLowerCase();
    
    // Check if user wants to book an appointment (more specific keywords)
    // Only show form for explicit booking requests, not queries about appointments
    const bookingKeywords = ['book appointment', 'schedule appointment', 'create appointment', 
                            'new appointment', 'make appointment', 'set appointment', 'consultation'];
    const isBookingRequest = bookingKeywords.some(keyword => currentQuery.includes(keyword)) ||
                           (currentQuery.includes('book') && currentQuery.includes('appointment')) ||
                           (currentQuery.includes('schedule') && currentQuery.includes('appointment'));
    
    // Don't show form for queries about appointments (list, show, get, find, etc.)
    const queryKeywords = ['list', 'show', 'get', 'find', 'search', 'display', 'view', 'see', 
                          'what', 'which', 'when', 'where', 'how many', 'count'];
    const isQueryRequest = queryKeywords.some(keyword => currentQuery.startsWith(keyword) || 
                                                  currentQuery.includes(` ${keyword} `));
    
    // Only show booking form for explicit booking requests, not queries
    if (isBookingRequest && !isQueryRequest) {
      // Check if the query contains enough information to book directly
      // Look for patient name, date/time indicators, and doctor/department
      const hasPatientName = /(?:for|patient|name)\s+([a-zA-Z]+)/i.test(query.trim());
      const hasTime = /(?:at|time)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|today|tomorrow)/i.test(query.trim());
      const hasDate = /(?:today|tomorrow|\d{1,2}[\/\-]\d{1,2})/i.test(query.trim());
      const hasDoctorOrDept = /(?:doctor|department|pediatrics|cardiology|orthopedics|any doctor)/i.test(query.trim());
      
      // If we have enough info, try to book directly
      if (hasPatientName && (hasTime || hasDate) && hasDoctorOrDept) {
        // Try natural language booking
        setIsLoading(true);
        const userMessage: QueryMessage = {
          id: Date.now().toString(),
          query: query.trim(),
          results: [],
          natural_results: [],
          timestamp: new Date()
        };
        setQueryMessages(prev => [...prev, userMessage]);
        setQuery('');
        
        try {
          const response = await fetch('http://localhost:5000/api/patient-engagement/extract-and-book', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query.trim() }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Update message with success
            setQueryMessages(prev => prev.map(msg => 
              msg.id === userMessage.id 
                ? { 
                    ...msg, 
                    natural_results: [`✅ ${data.message}`],
                    results: data.appointment ? [data.appointment] : []
                  }
                : msg
            ));
            // Refresh daily appointments
            fetchDailyAppointments();
          } else {
            // If extraction fails, show the form instead
            setQueryMessages(prev => prev.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, showBookingForm: true }
                : msg
            ));
            fetchDoctorsAndDepartments();
          }
        } catch (err) {
          console.error('Error booking appointment:', err);
          // On error, show the form
          setQueryMessages(prev => prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, showBookingForm: true }
              : msg
          ));
          fetchDoctorsAndDepartments();
        } finally {
          setIsLoading(false);
        }
        return;
      } else {
        // Not enough info, show form
        const userMessage: QueryMessage = {
          id: Date.now().toString(),
          query: query.trim(),
          results: [],
          natural_results: [],
          timestamp: new Date(),
          showBookingForm: true
        };
        setQueryMessages(prev => [...prev, userMessage]);
        setQuery('');
        // Fetch doctors and departments when form is shown
        fetchDoctorsAndDepartments();
        return;
      }
    }

    const currentQueryOriginal = query.trim();
    setQuery('');
    setIsLoading(true);

    // Add user query message
    const userMessage: QueryMessage = {
      id: Date.now().toString(),
      query: currentQueryOriginal,
      results: [],
      natural_results: [],
      timestamp: new Date()
    };
    setQueryMessages(prev => [...prev, userMessage]);

    try {
      // Build conversation context from recent messages
      const recentMessages = queryMessages.slice(-3); // Last 3 messages for context
      const conversationContext = recentMessages
        .map(msg => `${msg.query}: ${msg.natural_results?.join(' ') || ''}`)
        .join('\n');

      const response = await fetch('http://localhost:5000/api/patient-engagement/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: currentQuery,
          conversation_context: conversationContext
        }),
      });

      const data: QueryResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to query database');
      }

      // Handle the new response format
      if (data.success) {
        // Update the last message with results and natural results
        setQueryMessages(prev => prev.map(msg => 
          msg.id === userMessage.id 
            ? { 
                ...msg, 
                results: data.results || [],
                natural_results: data.natural_results || []
              }
            : msg
        ));
      } else {
        throw new Error(data.error || 'Query failed');
      }
    } catch (err) {
      // Update the last message with error
      setQueryMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, error: err instanceof Error ? err.message : 'An error occurred' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppointmentFormChange = async (field: keyof AppointmentFormData, value: string) => {
    setAppointmentFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear conflict error when user changes time/date/doctor
    if (field === 'appointmentDate' || field === 'appointmentTime' || field === 'doctorId') {
      setConflictError('');
    }
    
    // If doctor is selected, auto-fill department and fetch available slots
    if (field === 'doctorId') {
      if (value) {
        const selectedDoctor = doctors.find(d => d.id.toString() === value);
        if (selectedDoctor) {
          setAppointmentFormData(prev => ({
            ...prev,
            doctorId: value,
            departmentId: selectedDoctor.department_id.toString(),
            // Clear date/time when doctor changes
            appointmentDate: '',
            appointmentTime: ''
          }));
          // Automatically fetch and show available slots for the selected doctor
          await fetchAvailableSlotsForDoctor(value);
        }
      } else {
        // If doctor is cleared, clear date/time and close slot picker
        setAppointmentFormData(prev => ({
          ...prev,
          appointmentDate: '',
          appointmentTime: ''
        }));
        setShowSlotPicker(false);
      }
    }
    
    // Check for conflicts in real-time when date, time, or doctor changes
    if (field === 'appointmentDate' || field === 'appointmentTime') {
      // Wait a bit to avoid too many API calls, then check with updated data
      setTimeout(async () => {
        const updatedData = {
          ...appointmentFormData,
          [field]: value
        };
        if (updatedData.doctorId && updatedData.appointmentDate && updatedData.appointmentTime) {
          await checkAppointmentConflict(updatedData);
        }
      }, 800);
    }
  };

  const checkAppointmentConflict = async (formData?: AppointmentFormData): Promise<boolean> => {
    const dataToCheck = formData || appointmentFormData;
    
    if (!dataToCheck.doctorId || !dataToCheck.appointmentDate || !dataToCheck.appointmentTime) {
      return false;
    }

    try {
      const response = await fetch('http://localhost:5000/api/patient-engagement/check-appointment-conflict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: dataToCheck.doctorId,
          appointmentDate: dataToCheck.appointmentDate,
          appointmentTime: dataToCheck.appointmentTime
        }),
      });

      const data = await response.json();
      
      if (data.success && data.hasConflict) {
        setConflictError('This time slot is already booked. Please choose a different time.');
        return true;
      }
      
      setConflictError('');
      return false;
    } catch (err) {
      console.error('Error checking conflict:', err);
      return false;
    }
  };

  const handleAppointmentSubmit = async () => {
    // Validate required fields
    if (!appointmentFormData.patientName || !appointmentFormData.patientPhone || 
        !appointmentFormData.doctorId || !appointmentFormData.departmentId || 
        !appointmentFormData.appointmentDate || !appointmentFormData.appointmentTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Check for conflicts before submitting
    const hasConflict = await checkAppointmentConflict();
    if (hasConflict) {
      return; // Error message already set by checkAppointmentConflict
    }

    setIsSubmittingAppointment(true);

    try {
      const response = await fetch('http://localhost:5000/api/patient-engagement/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentFormData),
      });

      const data = await response.json();

      if (data.success) {
        // Show success status
        setBookingSuccess(true);
        
        // Update the message to hide form and show success
        setQueryMessages(prev => prev.map(msg => 
          msg.showBookingForm 
            ? { 
                ...msg, 
                showBookingForm: false,
                natural_results: [data.message || 'Appointment booked successfully!'],
                results: data.appointment ? [data.appointment] : []
              }
            : msg
        ));
        
        // Reset form after showing success
        setTimeout(() => {
          setAppointmentFormData({
            patientName: '',
            patientPhone: '',
            patientEmail: '',
            age: '',
            gender: '',
            weight: '',
            doctorId: '',
            departmentId: '',
            appointmentDate: '',
            appointmentTime: '',
            reason: ''
          });
          setConflictError('');
          setBookingSuccess(false);
        }, 3000); // Reset after 3 seconds

        // Refresh daily appointments
        fetchDailyAppointments();
      } else {
        alert(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      alert('Error booking appointment. Please try again.');
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      
      <div className="flex-1 flex gap-6 p-0 min-h-0 overflow-hidden">
        {/* Left Panel - Daily Appointments */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2 max-h-full">
          {/* Top Container - Appointment Carousel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h=36 p-3 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Clock className="h-3 w-3 mr-1.5 text-blue-600" />
              Today's Appointments
            </h2>
            
            {loadingAppointments ? (
              <div className="flex items-center justify-center h-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-1"></div>
                  <p className="text-gray-600 text-xs">Loading appointments...</p>
                </div>
              </div>
            ) : (
              <div className="h-36">
                <AppointmentCarousel appointments={dailyAppointments} />
              </div>
            )}
          </div>

          {/* Bottom Container - Appointment Booking Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-3 pt-3 pb-2 flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                <Calendar className="h-3 w-3 mr-1.5 text-blue-600" />
                Book Appointment
              </h2>
            </div>
            
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3 pt-2">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={appointmentFormData.patientName}
                  onChange={(e) => handleAppointmentFormChange('patientName', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={appointmentFormData.patientPhone}
                  onChange={(e) => handleAppointmentFormChange('patientPhone', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={appointmentFormData.patientEmail}
                  onChange={(e) => handleAppointmentFormChange('patientEmail', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter email"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={appointmentFormData.age}
                    onChange={(e) => handleAppointmentFormChange('age', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Age"
                    min="0"
                    max="150"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={appointmentFormData.gender}
                    onChange={(e) => handleAppointmentFormChange('gender', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={appointmentFormData.weight}
                  onChange={(e) => handleAppointmentFormChange('weight', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Weight"
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  value={appointmentFormData.doctorId}
                  onChange={(e) => handleAppointmentFormChange('doctorId', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loadingDoctors}
                  onFocus={() => {
                    if (doctors.length === 0) {
                      fetchDoctorsAndDepartments();
                    }
                  }}
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.department_name}
                    </option>
                  ))}
                </select>
                {loadingDoctors && (
                  <p className="text-xs text-gray-500 mt-0.5">Loading...</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={appointmentFormData.departmentId}
                  onChange={(e) => handleAppointmentFormChange('departmentId', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loadingDepartments}
                  onFocus={() => {
                    if (departments.length === 0) {
                      fetchDoctorsAndDepartments();
                    }
                  }}
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {loadingDepartments && (
                  <p className="text-xs text-gray-500 mt-0.5">Loading...</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={fetchAvailableSlots}
                  disabled={!appointmentFormData.doctorId || loadingSlots}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <span className="text-gray-700">
                    {appointmentFormData.appointmentDate && appointmentFormData.appointmentTime
                      ? `${new Date(appointmentFormData.appointmentDate).toLocaleDateString()} at ${new Date(`2000-01-01T${appointmentFormData.appointmentTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : appointmentFormData.doctorId
                        ? 'Click to view available slots'
                        : 'Select a doctor first'}
                  </span>
                  <Calendar className="h-3 w-3 text-gray-500" />
                </button>
                {loadingSlots && (
                  <p className="text-xs text-gray-500 mt-0.5">Loading available slots...</p>
                )}
                {appointmentFormData.appointmentDate && appointmentFormData.appointmentTime && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentFormData(prev => ({
                        ...prev,
                        appointmentDate: '',
                        appointmentTime: ''
                      }));
                      setConflictError('');
                    }}
                    className="text-xs text-red-600 hover:text-red-800 mt-1"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              {conflictError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2">
                  <p className="text-xs text-red-700">{conflictError}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={appointmentFormData.reason}
                  onChange={(e) => handleAppointmentFormChange('reason', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Enter appointment reason"
                  rows={2}
                />
              </div>
              <button
                onClick={handleAppointmentSubmit}
                disabled={isSubmittingAppointment || !!conflictError || bookingSuccess}
                className={`w-full py-2 px-3 rounded-md transition-colors flex items-center justify-center text-xs font-medium mt-2 ${
                  bookingSuccess 
                    ? 'bg-green-600 text-white cursor-default' 
                    : isSubmittingAppointment || conflictError
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {bookingSuccess ? (
                  <>
                    <svg className="h-3 w-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Done!
                  </>
                ) : isSubmittingAppointment ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="h-3 w-3 mr-1.5" />
                    Book Appointment
                  </>
                )}
              </button>
            </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Query Results and Input */}
        <div className="w-[950px] flex-shrink-0 flex flex-col min-h-0">
          {/* Results Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-600" />
              Query Results
            </h2>
            
            {queryMessages.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md">
                  <BrainCircuit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome to Patient Engagement
                  </h3>
                  <p className="text-gray-600 mb-6">
                    I can help you query patient data, manage appointments, and interact with your hospital database. 
                    Ask me anything about patients, appointments, or book a new appointment.
                  </p>
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => setQuery("Show today's appointments")}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Show today's appointments
                      </button>
                      <button
                        onClick={() => setQuery("List all patients")}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        List all patients
                      </button>
                      <button
                        onClick={() => setQuery("Show appointments for tomorrow")}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Tomorrow's appointments
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {queryMessages.length > 0 && (
              <div className="space-y-4 w-full min-w-0 overflow-x-hidden" style={{ maxWidth: '100%' }}>
                {queryMessages.map((message) => (
                  <div key={message.id} className="space-y-3 w-full min-w-0 overflow-x-hidden" style={{ maxWidth: '100%' }}>
                    {/* User Query */}
                    <div className="flex items-start space-x-3 justify-end">
                      <div className="flex-shrink-0 bg-orange-100 rounded-full p-2">
                        <UserCircle size={24} className="text-orange-600" />
                      </div>
                      <div className="bg-orange-50 rounded-lg rounded-tr-none p-3 max-w-[85%]">
                        <p className="text-gray-900 text-sm">{message.query}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Bot Response */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                        <Bot size={24} className="text-blue-600" />
                      </div>
                      <div className="bg-blue-50 rounded-lg rounded-tl-none p-3 max-w-[85%] min-w-0 overflow-x-hidden" style={{ maxWidth: '85%' }}>
                        {message.showBookingForm ? (
                          <div className="w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                              Book Appointment
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Patient Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={appointmentFormData.patientName}
                                  onChange={(e) => handleAppointmentFormChange('patientName', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter patient name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="tel"
                                  value={appointmentFormData.patientPhone}
                                  onChange={(e) => handleAppointmentFormChange('patientPhone', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter phone number"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Email (Optional)
                                </label>
                                <input
                                  type="email"
                                  value={appointmentFormData.patientEmail}
                                  onChange={(e) => handleAppointmentFormChange('patientEmail', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter email address"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Age (Optional)
                                  </label>
                                  <input
                                    type="number"
                                    value={appointmentFormData.age}
                                    onChange={(e) => handleAppointmentFormChange('age', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Age"
                                    min="0"
                                    max="150"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gender (Optional)
                                  </label>
                                  <select
                                    value={appointmentFormData.gender}
                                    onChange={(e) => handleAppointmentFormChange('gender', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Weight (kg)
                                  </label>
                                  <input
                                    type="number"
                                    value={appointmentFormData.weight}
                                    onChange={(e) => handleAppointmentFormChange('weight', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Weight"
                                    min="0"
                                    max="500"
                                    step="0.1"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Doctor <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={appointmentFormData.doctorId}
                                  onChange={(e) => handleAppointmentFormChange('doctorId', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={loadingDoctors}
                                >
                                  <option value="">Select a doctor</option>
                                  {doctors.map((doctor) => (
                                    <option key={doctor.id} value={doctor.id}>
                                      {doctor.name} - {doctor.department_name}
                                    </option>
                                  ))}
                                </select>
                                {loadingDoctors && (
                                  <p className="text-xs text-gray-500 mt-1">Loading doctors...</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Department <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={appointmentFormData.departmentId}
                                  onChange={(e) => handleAppointmentFormChange('departmentId', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={loadingDepartments}
                                >
                                  <option value="">Select a department</option>
                                  {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </option>
                                  ))}
                                </select>
                                {loadingDepartments && (
                                  <p className="text-xs text-gray-500 mt-1">Loading departments...</p>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="date"
                                    value={appointmentFormData.appointmentDate}
                                    onChange={(e) => handleAppointmentFormChange('appointmentDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={new Date().toISOString().split('T')[0]}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="time"
                                    value={appointmentFormData.appointmentTime}
                                    onChange={(e) => handleAppointmentFormChange('appointmentTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              {conflictError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <p className="text-sm text-red-700">{conflictError}</p>
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Reason (Optional)
                                </label>
                                <textarea
                                  value={appointmentFormData.reason}
                                  onChange={(e) => handleAppointmentFormChange('reason', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter appointment reason"
                                  rows={2}
                                />
                              </div>
                              <button
                                onClick={handleAppointmentSubmit}
                                disabled={isSubmittingAppointment || !!conflictError || bookingSuccess}
                                className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                                  bookingSuccess 
                                    ? 'bg-green-600 text-white cursor-default' 
                                    : isSubmittingAppointment || conflictError
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {bookingSuccess ? (
                                  <>
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Done!
                                  </>
                                ) : isSubmittingAppointment ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Booking...
                                  </>
                                ) : (
                                  <>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Book Appointment
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : message.error ? (
                          <div className="text-red-700 text-sm">
                            <p className="font-medium">Query Error:</p>
                            <p>{message.error}</p>
                          </div>
                        ) : message.results.length > 0 ? (
                          <div className="space-y-3 w-full min-w-0" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                            {/* Table display for structured data */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm w-full min-w-0" style={{ maxWidth: '100%' }}>
                              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold text-gray-800">
                                    📊 Results ({message.results.length} {message.results.length === 1 ? 'record' : 'records'})
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {message.results.length > 10 && (
                                      <span className="text-xs text-gray-500">Scroll to see all</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="overflow-x-auto max-h-96 overflow-y-auto" style={{ width: '100%', maxWidth: '100%' }}>
                                <table className="divide-y divide-gray-200" style={{ width: 'max-content', minWidth: '100%', tableLayout: 'auto' }}>
                                  <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                      {Object.keys(message.results[0] || {}).map((key) => (
                                        <th
                                          key={key}
                                          className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                                        >
                                          <div className="flex items-center space-x-1">
                                            <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                          </div>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {message.results.map((result: DatabaseResult, rowIndex: number) => (
                                      <tr 
                                        key={rowIndex} 
                                        className={`hover:bg-blue-50 transition-colors ${
                                          rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                        }`}
                                      >
                                        {Object.keys(message.results[0] || {}).map((key) => {
                                          const cellValue = result[key];
                                          let displayValue: React.ReactNode;
                                          
                                          if (cellValue === null || cellValue === undefined) {
                                            displayValue = <span className="text-gray-400 italic">—</span>;
                                          } else if (typeof cellValue === 'boolean') {
                                            displayValue = (
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                cellValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                              }`}>
                                                {cellValue ? 'Yes' : 'No'}
                                              </span>
                                            );
                                          } else if (typeof cellValue === 'object') {
                                            displayValue = (
                                              <span className="text-xs text-gray-500">
                                                {JSON.stringify(cellValue).substring(0, 50)}
                                                {JSON.stringify(cellValue).length > 50 ? '...' : ''}
                                              </span>
                                            );
                                          } else {
                                            const strValue = String(cellValue);
                                            // Format dates if they look like dates
                                            if (/^\d{4}-\d{2}-\d{2}/.test(strValue)) {
                                              try {
                                                const date = new Date(strValue);
                                                displayValue = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                              } catch {
                                                displayValue = strValue;
                                              }
                                            } else {
                                              displayValue = strValue;
                                            }
                                          }
                                          
                                          return (
                                            <td
                                              key={key}
                                              className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                                            >
                                              <div className="max-w-xs truncate" title={String(cellValue)}>
                                                {displayValue}
                                              </div>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ) : message.results.length === 0 && !isLoading ? (
                          <p className="text-sm text-gray-700">No results found for this query.</p>
                        ) : null}
                        <p className="text-xs text-gray-500 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                  <Bot size={24} className="text-blue-600" />
                </div>
                <div className="bg-blue-50 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-700">Querying database...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Query Input Container */}
          <div className="sticky bottom-0 bg-white p-1 border-t border-gray-200 flex-shrink-0">
            <form onSubmit={handleQuerySubmit} className="relative flex items-center">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about patient data (e.g., Show me all patients with diabetes)"
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none hide-scrollbar"
                rows={1}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuerySubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-3 bottom-3 p-1.5 rounded-full bg-orange-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors hover:bg-orange-600"
              >
                <ArrowUp size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Slot Picker Modal */}
      {showSlotPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Select Available Time Slot
              </h2>
              <button
                onClick={() => {
                  setShowSlotPicker(false);
                  setDateRangeOffset(0);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingSlots ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading available slots...</p>
                  </div>
                </div>
              ) : Object.keys(availableSlots).length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No available slots found for the next 2 weeks</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Date Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const dates = Object.keys(availableSlots).filter(date => 
                          (availableSlots[date] || []).length > 0
                        ).sort();
                        if (dateRangeOffset > 0) {
                          setDateRangeOffset(prev => prev - 1);
                          // Also update selected date to the first date in the new range
                          const newStartIndex = (dateRangeOffset - 1) * 7;
                          if (dates[newStartIndex]) {
                            setSelectedDate(dates[newStartIndex]);
                          }
                        }
                      }}
                      disabled={dateRangeOffset === 0}
                      className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex-1 mx-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {(() => {
                          const dates = Object.keys(availableSlots)
                            .filter(date => (availableSlots[date] || []).length > 0)
                            .sort();
                          const startIndex = dateRangeOffset * 7;
                          const endIndex = startIndex + 7;
                          const visibleDates = dates.slice(startIndex, endIndex);
                          
                          return visibleDates.map(date => (
                            <button
                              key={date}
                              onClick={() => setSelectedDate(date)}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                selectedDate === date
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const dates = Object.keys(availableSlots).filter(date => 
                          (availableSlots[date] || []).length > 0
                        ).sort();
                        const maxOffset = Math.floor((dates.length - 1) / 7);
                        if (dateRangeOffset < maxOffset) {
                          setDateRangeOffset(prev => prev + 1);
                          // Also update selected date to the first date in the new range
                          const newStartIndex = (dateRangeOffset + 1) * 7;
                          if (dates[newStartIndex]) {
                            setSelectedDate(dates[newStartIndex]);
                          }
                        }
                      }}
                      disabled={(() => {
                        const dates = Object.keys(availableSlots).filter(date => 
                          (availableSlots[date] || []).length > 0
                        ).sort();
                        const maxOffset = Math.floor((dates.length - 1) / 7);
                        return dateRangeOffset >= maxOffset;
                      })()}
                      className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Time Slots Grid */}
                  {selectedDate && availableSlots[selectedDate] && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Available slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots[selectedDate].map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => handleSlotSelect(selectedDate, slot.time)}
                            className="px-3 py-2 rounded-md border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
                          >
                            {slot.displayTime}
                          </button>
                        ))}
                      </div>
                      {availableSlots[selectedDate].length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">No available slots for this date</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowSlotPicker(false);
                  setDateRangeOffset(0);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Add new AppointmentCarousel component
const AppointmentCarousel: React.FC<{ appointments: DailyAppointment[] }> = ({ appointments }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextAppointment = () => {
    setCurrentIndex((prev) => (prev + 1) % appointments.length);
  };

  const prevAppointment = () => {
    setCurrentIndex((prev) => (prev - 1 + appointments.length) % appointments.length);
  };

  if (appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No appointments today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Navigation Buttons */}
      {appointments.length > 1 && (
        <>
          <button
            onClick={prevAppointment}
            className="absolute left-2 bottom-1 z-20 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextAppointment}
            className="absolute right-2 bottom-1 z-20 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div className="relative h-full overflow-hidden">
        {appointments.map((appointment, index) => {
          const isActive = index === currentIndex;
          const isNext = index === (currentIndex + 1) % appointments.length;
          const isPrev = index === (currentIndex - 1 + appointments.length) % appointments.length;
          
          let transformClass = '';
          let opacityClass = '';
          let zIndex = '';
          
          if (isActive) {
            transformClass = 'translate-x-0 scale-100';
            opacityClass = 'opacity-100';
            zIndex = 'z-10';
          } else if (isNext) {
            transformClass = 'translate-x-4 scale-90';
            opacityClass = 'opacity-60';
            zIndex = 'z-5';
          } else if (isPrev) {
            transformClass = '-translate-x-4 scale-90';
            opacityClass = 'opacity-60';
            zIndex = 'z-5';
          } else {
            transformClass = 'translate-x-0 scale-80';
            opacityClass = 'opacity-20';
            zIndex = 'z-0';
          }

          return (
            <div
              key={appointment.id}
              className={`absolute inset-0 transition-all duration-500 ease-out ${transformClass} ${opacityClass} ${zIndex}`}
            >
              <div className="bg-white border border-gray-200 rounded-lg p-2 h-full shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-semibold text-gray-900 text-xs truncate flex-1 mr-1">
                    {appointment.patientName}
                  </h3>
                  <span className={`px-1 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
                
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-600 truncate">Contact: {appointment.patientPhone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-600 truncate">Date: {appointment.appointmentDate}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-purple-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-600 truncate">Time: {appointment.appointmentTime}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-600 truncate">Doctor: {appointment.doctorName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-600 truncate">Dept: {appointment.department}</span>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-0.5">
                    {appointments.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1 h-1 rounded-full transition-all duration-300 ${
                          idx === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointment counter */}
      <div className="absolute top-1 right-1 bg-white/80 rounded-full px-1.5 py-0.5 text-xs text-gray-600 font-medium">
        {currentIndex + 1} / {appointments.length}
      </div>
    </div>
  );
};

export default PatientEngagement; 