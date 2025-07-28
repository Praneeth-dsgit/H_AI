import React, { useState, useEffect, useRef } from 'react';
import { Search, Database, Users, TrendingUp, Calendar, FileText, Activity, Clock, ArrowUp, Bot, UserCircle, BrainCircuit} from 'lucide-react';

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
  patientName: string;
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
}

const PatientEngagement: React.FC = () => {
  const [query, setQuery] = useState('');
  const [queryMessages, setQueryMessages] = useState<QueryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch daily appointments on component mount
  useEffect(() => {
    fetchDailyAppointments();
  }, []);

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
        setDailyAppointments(data.appointments || []);
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

    const currentQuery = query.trim();
    setQuery('');
    setIsLoading(true);

    // Add user query message
    const userMessage: QueryMessage = {
      id: Date.now().toString(),
      query: currentQuery,
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



  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      
      <div className="flex-1 flex gap-6 p-4 min-h-0">
        {/* Left Panel - Daily Appointments */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Today's Appointments
            </h2>
            
            {loadingAppointments ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading appointments...</p>
                </div>
              </div>
            ) : dailyAppointments.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No appointments today</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{appointment.patientName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><span className="font-medium">Time:</span> {appointment.appointmentTime}</p>
                      <p><span className="font-medium">Doctor:</span> {appointment.doctorName}</p>
                      <p><span className="font-medium">Department:</span> {appointment.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Query Results and Input */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Results Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1 overflow-y-auto hide-scrollbar">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-600" />
              Query Results
            </h2>
            
            {queryMessages.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BrainCircuit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chat with your Hospital database.</p>
                </div>
              </div>
            )}

            {queryMessages.length > 0 && (
              <div className="space-y-4">
                {queryMessages.map((message) => (
                  <div key={message.id} className="space-y-3">
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
                      <div className="bg-blue-50 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                        {message.error ? (
                          <div className="text-red-700 text-sm">
                            <p className="font-medium">Query Error:</p>
                            <p>{message.error}</p>
                          </div>
                        ) : message.results.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700 mb-2">
                              Found {message.results.length} result{message.results.length !== 1 ? 's' : ''}
                            </p>
                            <div className="space-y-2">
                              {message.natural_results && message.natural_results.length > 0 ? (
                                // Use LLM-formatted natural language results
                                message.natural_results.map((naturalResult: string, index: number) => (
                                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="text-sm text-gray-900">
                                      {naturalResult}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                // Fallback to raw results if natural results not available
                                message.results.map((result: DatabaseResult, index: number) => (
                                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="text-sm text-gray-900">
                                      <pre className="whitespace-pre-wrap text-xs">
                                        {JSON.stringify(result, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                ))
                              )}
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
    </div>
  );
};

export default PatientEngagement; 