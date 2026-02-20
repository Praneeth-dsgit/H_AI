/**
 * Patient Dashboard Component
 * Main dashboard for patient with Patient ID as central identifier
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Calendar, FileText, CreditCard, Users, 
  Clock, ArrowRight, Plus, Scan, Stethoscope, Brain, 
  Baby, Eye, Pill, Wind
} from 'lucide-react';
import { 
  Cardiology,
  Oncology,
  Gynecology,
  Orthopaedics,
  SkinCancer
} from 'healthicons-react';
import { patientService, Patient, FamilyMember } from '../../services/patientService';
import { appointmentService, Appointment } from '../../services/appointmentService';
import { radiologyService, RadiologyBooking } from '../../services/radiologyService';
import { doctorService, Specialty } from '../../services/doctorService';

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [upcomingRadiologyBookings, setUpcomingRadiologyBookings] = useState<RadiologyBooking[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingFamilyMembers, setLoadingFamilyMembers] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load patient profile
      const patientResult = await patientService.getProfile();
      console.log('Patient profile result:', patientResult);
      
      if (patientResult.success && patientResult.patient) {
        setPatient(patientResult.patient);
        // Store patient_id in localStorage if not already there
        if (!sessionStorage.getItem('patient_id')) {
          sessionStorage.setItem('patient_id', patientResult.patient.patient_id);
        }
      } else {
        console.error('Failed to load patient profile:', patientResult.error);
        // Show error message
        console.error('Patient ID from sessionStorage:', sessionStorage.getItem('patient_id'));
        console.error('User Email from sessionStorage:', sessionStorage.getItem('userEmail'));
      }

      // Load upcoming appointments
      const appointmentsResult = await appointmentService.getAppointments();
      if (appointmentsResult.success && appointmentsResult.appointments) {
        const now = new Date();
        const upcoming = appointmentsResult.appointments
          .filter(apt => {
            // Only show appointments that are scheduled/confirmed AND in the future
            const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
            return (apt.status === 'scheduled' || apt.status === 'confirmed') && appointmentDateTime > now;
          })
          .sort((a, b) => {
            const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
            const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5);
        setUpcomingAppointments(upcoming);
      }

      // Load upcoming radiology bookings
      const radiologyResult = await radiologyService.getBookings();
      if (radiologyResult.success && radiologyResult.bookings) {
        const upcoming = radiologyResult.bookings
          .filter(booking => {
            const bookingDate = new Date(booking.appointment_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate >= today && booking.status === 'scheduled';
          })
          .sort((a, b) => {
            const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
            const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5);
        setUpcomingRadiologyBookings(upcoming);
      }

      // Load family members
      await loadFamilyMembers();
      
      // Load specialties
      const specialtiesResult = await doctorService.getSpecialties();
      if (specialtiesResult.success && specialtiesResult.specialties) {
        setSpecialties(specialtiesResult.specialties);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    setLoadingFamilyMembers(true);
    try {
      const result = await patientService.getFamilyMembers();
      if (result.success && result.family_members) {
        setFamilyMembers(result.family_members);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoadingFamilyMembers(false);
    }
  };

  const handleViewFamilyMembers = () => {
    navigate('/portal/family');
  };

  const handleAddFamilyMember = () => {
    navigate('/portal/family', { state: { showAddForm: true } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-semibold mb-2">Patient profile not found.</p>
          <p className="text-yellow-700 text-sm mb-3">
            Your patient ID may not be linked correctly. Please try:
          </p>
          <ul className="text-yellow-700 text-sm list-disc list-inside mb-3 space-y-1">
            <li>Logout and login again</li>
            <li>Check browser console for errors</li>
            <li>Verify your patient_id in localStorage</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Completion Reminder */}
        {(!patient.first_name || !patient.last_name) && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-800 text-sm">
              💡 Complete your profile to personalize your experience. 
              <a href="/portal/profile" className="underline ml-1">Edit Profile</a>
            </p>
          </div>
        )}

        {/* Quick Actions - Horizontal */}
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 mb-6 transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/portal/appointments/book')}
              className="text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 flex items-center"
            >
              <Calendar className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
              <span className="font-medium text-gray-900">Book Appointment</span>
            </button>
            <button 
              onClick={() => navigate('/portal/radiology/book')}
              className="text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 flex items-center"
            >
              <Scan className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
              <span className="font-medium text-gray-900">Book Radiology</span>
            </button>
            <button 
              onClick={() => navigate('/portal/records')}
              className="text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 flex items-center"
            >
              <FileText className="h-5 w-5 mr-3 text-green-600 flex-shrink-0" />
              <span className="font-medium text-gray-900">Medical Records</span>
            </button>
            <button 
              onClick={() => navigate('/portal/billing')}
              className="text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 flex items-center"
            >
              <CreditCard className="h-5 w-5 mr-3 text-orange-600 flex-shrink-0" />
              <span className="font-medium text-gray-900">View Billing</span>
            </button>
          </div>
        </div>

        {/* Upcoming Appointments, Radiology Bookings, and Family Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 flex flex-col h-[450px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Appointments
              </h2>
              {upcomingAppointments.length > 0 && (
                <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                  {upcomingAppointments.length}
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 flex-1 flex flex-col items-center justify-center">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No upcoming appointments</p>
                  <button 
                    onClick={() => navigate('/portal/appointments/book')}
                    className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Book Appointment
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {upcomingAppointments.map((apt) => {
                      // Get family member name - prefer API data, fallback to local state
                      const bookedFor = apt.family_member_id 
                        ? (apt.family_member_first_name && apt.family_member_last_name
                            ? `${apt.family_member_first_name} ${apt.family_member_last_name}`
                            : (() => {
                                const familyMember = familyMembers.find(fm => fm.family_member_id === apt.family_member_id);
                                return familyMember ? `${familyMember.first_name} ${familyMember.last_name}` : 'Family Member';
                              })())
                        : 'Myself';
                      const doctorName = apt.doctor_first_name && apt.doctor_last_name
                        ? `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`
                        : 'Doctor';

                      return (
                        <div key={apt.appointment_id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {new Date(apt.appointment_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-600">{apt.appointment_time}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Doctor:</span> {doctorName}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">For:</span> {bookedFor}
                            </p>
                            {apt.facility_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                {apt.facility_name}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
                    <button
                      onClick={() => navigate('/portal/appointments')}
                      className="w-full text-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-md hover:scale-105 text-sm font-medium py-2 flex items-center justify-center rounded-lg transition-all duration-200"
                    >
                      View All {upcomingAppointments.length > 1 ? `${upcomingAppointments.length} Appointments` : 'Appointment'}
                      <ArrowRight className="inline h-4 w-4 ml-2" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upcoming Radiology Bookings */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 flex flex-col transition-all duration-300" style={{ minHeight: '400px' }}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Scan className="h-5 w-5 mr-2 text-purple-600" />
                Radiology
              </h2>
              {upcomingRadiologyBookings.length > 0 && (
                <span className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm font-semibold">
                  {upcomingRadiologyBookings.length}
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              {upcomingRadiologyBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500 flex-1 flex flex-col items-center justify-center">
                  <Scan className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No upcoming scans</p>
                  <button 
                    onClick={() => navigate('/portal/radiology/book')}
                    className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Book Scan
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {upcomingRadiologyBookings.map((booking) => {
                      const SCAN_TYPE_LABELS: Record<string, string> = {
                        mri: 'MRI',
                        ct: 'CT Scan',
                        xray: 'X-Ray',
                        ultrasound: 'Ultrasound',
                        mammography: 'Mammography',
                        pet_scan: 'PET Scan',
                        other: 'Other',
                      };
                      
                      const bookedFor = booking.family_member_id 
                        ? (booking.family_member_first_name && booking.family_member_last_name
                            ? `${booking.family_member_first_name} ${booking.family_member_last_name}`
                            : (() => {
                                const familyMember = familyMembers.find(fm => fm.family_member_id === booking.family_member_id);
                                return familyMember ? `${familyMember.first_name} ${familyMember.last_name}` : 'Family Member';
                              })())
                        : 'Myself';

                      return (
                        <div key={booking.booking_id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {SCAN_TYPE_LABELS[booking.scan_type] || booking.scan_type}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.appointment_date).toLocaleDateString()} at {booking.appointment_time}
                              </p>
                            </div>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {booking.status}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            {booking.body_part && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Body Part:</span> {booking.body_part}
                              </p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">For:</span> {bookedFor}
                            </p>
                            {booking.facility_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                {booking.facility_name}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
                    <button
                      onClick={() => navigate('/portal/radiology')}
                      className="w-full text-center text-purple-600 hover:text-purple-700 hover:bg-purple-50 hover:shadow-md hover:scale-105 text-sm font-medium py-2 flex items-center justify-center rounded-lg transition-all duration-200"
                    >
                      View All {upcomingRadiologyBookings.length > 1 ? `${upcomingRadiologyBookings.length} Bookings` : 'Booking'}
                      <ArrowRight className="inline h-4 w-4 ml-2" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Family Members */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 flex flex-col transition-all duration-300" style={{ minHeight: '400px' }}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Your Family
              </h2>
              <button 
                onClick={handleAddFamilyMember}
                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              {loadingFamilyMembers ? (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                  <div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading...</p>
                  </div>
                </div>
              ) : familyMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 flex-1 flex flex-col items-center justify-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No family members added</p>
                  <button 
                    onClick={handleAddFamilyMember}
                    className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Add Family Member
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {familyMembers.slice(0, 3).map((member) => (
                      <div 
                        key={member.family_member_id} 
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-200"
                        onClick={handleViewFamilyMembers}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-green-100 rounded-full p-2 mr-3">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.first_name} {member.last_name}
                              </p>
                              <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                            </div>
                          </div>
                          {member.date_of_birth && (
                            <p className="text-xs text-gray-500">
                              {new Date(member.date_of_birth).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
                    <button
                      onClick={handleViewFamilyMembers}
                      className="w-full text-center text-green-600 hover:text-green-700 hover:bg-green-50 hover:shadow-md hover:scale-105 text-sm font-medium py-2 flex items-center justify-center rounded-lg transition-all duration-200"
                    >
                      View All {familyMembers.length > 1 ? `${familyMembers.length} Family Members` : 'Family Member'}
                      <ArrowRight className="inline h-4 w-4 ml-2" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Specialty Icons */}
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 mb-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Find Doctors by Specialty</h2>
            {specialties.length > 8 && (
              <button
                onClick={() => navigate('/portal/appointments/book')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200 flex items-center gap-1"
                title="View All Specialties"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            {specialties.slice(0, 8).map((specialty) => {
              // Map specialty names to icons
              const getIcon = (name: string) => {
                const lowerName = name.toLowerCase();
                if (lowerName.includes('cardio') || lowerName.includes('heart')) return Cardiology;
                if (lowerName.includes('dermat') || lowerName.includes('skin')) return SkinCancer;
                if (lowerName.includes('gyneco') || lowerName.includes('obstet') || lowerName.includes('women')) return Gynecology;
                if (lowerName.includes('onco') || lowerName.includes('cancer')) return Oncology;
                if (lowerName.includes('ortho') || lowerName.includes('bone')) return Orthopaedics;
                if (lowerName.includes('neuro') || lowerName.includes('brain')) return Brain;
                if (lowerName.includes('pediatric') || lowerName.includes('child')) return Baby;
                if (lowerName.includes('ophthal') || lowerName.includes('eye')) return Eye;
                if (lowerName.includes('pulmo') || lowerName.includes('lung') || lowerName.includes('respiratory')) return Wind;
                if (lowerName.includes('pharma') || lowerName.includes('medicine')) return Pill;
                return Stethoscope;
              };
              
              const IconComponent = getIcon(specialty.name);
              const colors = [
                'bg-blue-100 text-blue-600 hover:bg-blue-200',
                'bg-green-100 text-green-600 hover:bg-green-200',
                'bg-purple-100 text-purple-600 hover:bg-purple-200',
                'bg-red-100 text-red-600 hover:bg-red-200',
                'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
                'bg-pink-100 text-pink-600 hover:bg-pink-200',
                'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
                'bg-teal-100 text-teal-600 hover:bg-teal-200',
              ];
              const colorIndex = specialty.specialty_id % colors.length;
              
              return (
                <div key={specialty.specialty_id} className="flex flex-col items-center">
                  <button
                    onClick={() => navigate(`/portal/appointments/book`, { state: { specialtyId: specialty.specialty_id } })}
                    className={`flex items-center justify-center w-20 h-20 rounded-full ${colors[colorIndex]} transition-all duration-200 hover:scale-110 hover:shadow-lg group`}
                    title={specialty.name}
                  >
                    <IconComponent className="h-8 w-8" />
                  </button>
                  <span className="text-xs font-medium text-gray-700 text-center mt-2 max-w-[80px] leading-tight">{specialty.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient Info Summary */}
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="font-medium text-gray-900">
                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-medium text-gray-900 capitalize">{patient.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{patient.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{patient.email || 'Not set'}</p>
            </div>
            {patient.blood_type && (
              <div>
                <p className="text-sm text-gray-600">Blood Type</p>
                <p className="font-medium text-gray-900">{patient.blood_type}</p>
              </div>
            )}
            {patient.bmi && (
              <div>
                <p className="text-sm text-gray-600">BMI</p>
                <p className="font-medium text-gray-900">{patient.bmi.toFixed(1)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

