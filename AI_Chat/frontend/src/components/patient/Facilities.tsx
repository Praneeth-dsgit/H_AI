/**
 * Facilities Component - Search facilities and find doctors in preferred facilities
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, MapPin, Phone, Mail, Globe, Clock, Stethoscope, Calendar, User, Scan } from 'lucide-react';
import { facilityService, Facility } from '../../services/facilityService';
import { doctorService, Doctor } from '../../services/doctorService';

const Facilities: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [showDoctors, setShowDoctors] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      loadDoctorsForFacility(selectedFacility);
    } else {
      setDoctors([]);
      setShowDoctors(false);
    }
  }, [selectedFacility]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const result = await facilityService.searchFacilities({});
      if (result.success) {
        setFacilities(result.facilities || []);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await facilityService.searchFacilities({
        search: searchTerm || undefined,
        type: selectedFacilityType || undefined,
      });
      if (result.success) {
        setFacilities(result.facilities || []);
      }
    } catch (error) {
      console.error('Error searching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacilityType]);

  const loadDoctorsForFacility = async (facilityId: number) => {
    setLoading(true);
    try {
      const result = await doctorService.searchDoctors({
        facility_id: facilityId,
      });
      if (result.success) {
        setDoctors(result.doctors || []);
        setShowDoctors(true);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor: Doctor) => {
    navigate('/portal/appointments/book', { state: { doctorId: doctor.doctor_id } });
  };

  const handleFacilitySelect = (facilityId: number) => {
    setSelectedFacility(facilityId);
  };

  const handleBookRadiology = () => {
    navigate('/portal/radiology/book');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Facilities</h1>
        <p className="text-gray-600">Search for healthcare facilities, radiology centers, and find doctors available at your preferred locations</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 mb-6 transition-all duration-300">
        <div className="flex flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by facility name, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all duration-200"
            />
          </div>
          <div className="w-64">
            <select
              value={selectedFacilityType}
              onChange={(e) => setSelectedFacilityType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all duration-200"
            >
              <option value="">All Facility Types</option>
              <option value="hospital">Hospitals</option>
              <option value="clinic">Clinics</option>
              <option value="diagnostic_center">Radiology/Diagnostic Centers</option>
              <option value="pharmacy">Pharmacies</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results Section */}
      {loading && !showDoctors ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading facilities...</p>
        </div>
      ) : showDoctors && selectedFacility ? (
        /* Doctors View */
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => {
                  setShowDoctors(false);
                  setSelectedFacility(null);
                }}
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium mb-2 transition-all duration-200"
              >
                ← Back to Facilities
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Doctors at {facilities.find(f => f.facility_id === selectedFacility)?.name}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-12 text-center transition-all duration-300">
              <Stethoscope className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
              <p className="text-gray-600">No doctors are available at this facility</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <div
                  key={doctor.doctor_id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-full"
                >
                  <div className="flex-1">
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
                          <span>{doctor.experience_years} years</span>
                        </div>
                      )}
                      {doctor.consultation_fee && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Fee:</span> ₹{doctor.consultation_fee}
                        </div>
                      )}
                    </div>
                  </div>

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
      ) : facilities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-12 text-center transition-all duration-300">
          <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No facilities found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      ) : (
        /* Facilities List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <div
              key={facility.facility_id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      facility.type === 'diagnostic_center' 
                        ? 'bg-purple-100' 
                        : 'bg-blue-100'
                    }`}>
                      {facility.type === 'diagnostic_center' ? (
                        <Scan className="text-purple-600" size={24} />
                      ) : (
                        <Building2 className="text-blue-600" size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{facility.name}</h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                        facility.type === 'diagnostic_center' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {facility.type === 'diagnostic_center' ? 'RADIOLOGY CENTER' : facility.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {facility.is_active && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <span>{facility.address}, {facility.city}, {facility.state} {facility.zip_code}</span>
                  </div>
                  {facility.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} className="text-gray-400" />
                      <span>{facility.phone}</span>
                    </div>
                  )}
                  {facility.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} className="text-gray-400" />
                      <span>{facility.email}</span>
                    </div>
                  )}
                  {facility.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe size={16} className="text-gray-400" />
                      <a href={facility.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {facility.website}
                      </a>
                    </div>
                  )}
                </div>

                {facility.services && facility.services.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {facility.services.map((service, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {facility.type === 'diagnostic_center' ? (
                <button
                  onClick={handleBookRadiology}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 mt-auto"
                >
                  <Scan size={18} />
                  Book Radiology Scan
                </button>
              ) : (
                <button
                  onClick={() => handleFacilitySelect(facility.facility_id)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 mt-auto"
                >
                  <Stethoscope size={18} />
                  View Doctors at this Facility
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Facilities;

