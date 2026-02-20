/**
 * Patient Profile Component
 * View and edit patient profile
 */

import React, { useState, useEffect } from 'react';
import { User, Save, Edit, X } from 'lucide-react';
import { patientService, Patient } from '../../services/patientService';

const PatientProfile: React.FC = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await patientService.getProfile();
      console.log('PatientProfile - Profile result:', result);
      if (result.success && result.patient) {
        setPatient(result.patient);
        setFormData(result.patient);
      } else {
        console.error('PatientProfile - Failed to load:', result.error);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await patientService.updateProfile(formData);
      if (result.success && result.patient) {
        setPatient(result.patient);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Patient profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <User className="h-8 w-8 mr-3 text-blue-600" />
            Patient Profile
          </h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
              <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">{patient.patient_id}</p>
            </div>
            <div>
              {/* Empty space */}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.first_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.last_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">
                  {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              {editing ? (
                <select
                  value={formData.gender || 'other'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{patient.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.phone || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.email || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
              {editing ? (
                <select
                  value={formData.blood_type || ''}
                  onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="">Select Blood Type</option>
                  <optgroup label="Common Blood Groups">
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </optgroup>
                  <optgroup label="Rare Blood Groups">
                    <option value="Bombay (hh)">Bombay (hh)</option>
                    <option value="Rh-null">Rh-null</option>
                    <option value="Duffy-null">Duffy-null</option>
                    <option value="Kell-null">Kell-null</option>
                    <option value="Kidd-null">Kidd-null</option>
                    <option value="MNS-null">MNS-null</option>
                    <option value="Lutheran-null">Lutheran-null</option>
                    <option value="Diego-null">Diego-null</option>
                    <option value="Colton-null">Colton-null</option>
                    <option value="Vel-negative">Vel-negative</option>
                    <option value="Lan-negative">Lan-negative</option>
                    <option value="Jr(a)-negative">Jr(a)-negative</option>
                    <option value="Ok(a)-negative">Ok(a)-negative</option>
                    <option value="Yt(a)-negative">Yt(a)-negative</option>
                    <option value="Other Rare">Other Rare</option>
                  </optgroup>
                </select>
              ) : (
                <p className="text-gray-900">{patient.blood_type || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.height_cm || ''}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.height_cm ? `${patient.height_cm} cm` : 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.weight_kg || ''}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.weight_kg ? `${patient.weight_kg} kg` : 'Not set'}</p>
              )}
            </div>
            {patient.bmi && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                <p className="text-gray-900">{patient.bmi.toFixed(1)}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.address || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.city || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              {editing ? (
                <select
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="">Select State</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Puducherry">Puducherry</option>
                </select>
              ) : (
                <p className="text-gray-900">{patient.state || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.emergency_contact_name || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              ) : (
                <p className="text-gray-900">{patient.emergency_contact_name || 'Not set'}</p>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 text-white px-6 py-2 rounded-lg flex items-center disabled:bg-gray-400 disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData(patient);
                }}
                className="bg-gray-200 hover:bg-gray-300 hover:shadow-md hover:scale-105 text-gray-700 px-6 py-2 rounded-lg flex items-center transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;

