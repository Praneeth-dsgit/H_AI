/**
 * Doctors Component - Search and browse doctors by specialty/department
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Stethoscope, MapPin, Clock, DollarSign, User, Calendar } from 'lucide-react';
import { doctorService, Doctor, Specialty } from '../../services/doctorService';

const Doctors: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [selectedSpecialty]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [doctorsResult, specialtiesResult] = await Promise.all([
        doctorService.searchDoctors({}),
        doctorService.getSpecialties(),
      ]);

      if (doctorsResult.success) {
        setDoctors(doctorsResult.doctors || []);
      }
      if (specialtiesResult.success) {
        setSpecialties(specialtiesResult.specialties || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await doctorService.searchDoctors({
        search: searchTerm || undefined,
        specialty_id: selectedSpecialty || undefined,
      });
      if (result.success) {
        setDoctors(result.doctors || []);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor: Doctor) => {
    navigate('/portal/appointments/book', { state: { doctorId: doctor.doctor_id } });
  };

  const handleSpecialtyChange = (specialtyId: number | null) => {
    setSelectedSpecialty(specialtyId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Doctors</h1>
        <p className="text-gray-600">Search for doctors by specialty or department</p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 mb-6 transition-all duration-300">
        <div className="flex flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by doctor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all duration-200"
            />
          </div>

          {/* Specialty Filter */}
          <div className="w-64">
            <select
              value={selectedSpecialty || ''}
              onChange={(e) => handleSpecialtyChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all duration-200"
            >
              <option value="">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty.specialty_id} value={specialty.specialty_id}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium whitespace-nowrap"
          >
            Search Doctors
          </button>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading doctors...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-12 text-center transition-all duration-300">
          <Stethoscope className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.doctor_id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex-1">
                {/* Doctor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </h3>
                      {(doctor.specialty?.name || (doctor as any).specialty_name) && (
                        <p className="text-sm text-gray-600">
                          {doctor.specialty?.name || (doctor as any).specialty_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {doctor.is_available && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      Available
                    </span>
                  )}
                </div>

                {/* Doctor Details */}
                <div className="space-y-2 mb-4">
                  {doctor.qualification && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Stethoscope size={16} className="text-gray-400" />
                      <span>{doctor.qualification}</span>
                    </div>
                  )}
                  {doctor.experience_years && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-gray-400" />
                      <span>{doctor.experience_years} years of experience</span>
                    </div>
                  )}
                  {doctor.facility_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      <span>{doctor.facility_name}</span>
                    </div>
                  )}
                  {doctor.consultation_fee && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign size={16} className="text-gray-400" />
                      <span>₹{doctor.consultation_fee}</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {doctor.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doctor.bio}</p>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleBookAppointment(doctor)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 mt-auto"
              >
                <Calendar size={18} />
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Doctors;

