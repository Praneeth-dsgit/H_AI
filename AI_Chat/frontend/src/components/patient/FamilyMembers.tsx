/**
 * Family Members Management Component
 * Manage family members linked to primary patient
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Plus, Edit, Trash2, User, Calendar } from 'lucide-react';
import { patientService, FamilyMember } from '../../services/patientService';

const FamilyMembers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    loadFamilyMembers();
    // Check if we should show the add form from navigation state
    if ((location.state as any)?.showAddForm) {
      setShowAddForm(true);
    }
  }, [location.state]);

  const loadFamilyMembers = async () => {
    setLoading(true);
    try {
      const result = await patientService.getFamilyMembers();
      if (result.success && result.family_members) {
        setFamilyMembers(result.family_members);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (memberData: any) => {
    try {
      const result = await patientService.addFamilyMember(memberData);
      if (result.success) {
        await loadFamilyMembers();
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding family member:', error);
    }
  };

  const handleUpdateMember = async (memberId: number, memberData: any) => {
    try {
      const result = await patientService.updateFamilyMember(memberId, memberData);
      if (result.success) {
        await loadFamilyMembers();
        setEditingMember(null);
      }
    } catch (error) {
      console.error('Error updating family member:', error);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!window.confirm('Are you sure you want to remove this family member?')) {
      return;
    }
    try {
      const result = await patientService.deleteFamilyMember(memberId);
      if (result.success) {
        await loadFamilyMembers();
      }
    } catch (error) {
      console.error('Error deleting family member:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            Your Family
          </h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Family Member
          </button>
        </div>

        {familyMembers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-12 text-center transition-all duration-300">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No family members added yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 text-white px-6 py-2 rounded-lg transition-all duration-200"
            >
              Add Your First Family Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {familyMembers.map((member) => (
              <div key={member.family_member_id} className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-3 mr-3">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.first_name} {member.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingMember(member)}
                      className="p-2 text-blue-600 hover:bg-blue-50 hover:shadow-md hover:scale-110 rounded transition-all duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.family_member_id)}
                      className="p-2 text-red-600 hover:bg-red-50 hover:shadow-md hover:scale-110 rounded transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">DOB:</span>{' '}
                    <span className="font-medium">
                      {new Date(member.date_of_birth).toLocaleDateString()}
                    </span>
                    {(() => {
                      const birthDate = new Date(member.date_of_birth);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return age >= 0 ? ` (${age} years)` : '';
                    })()}
                  </div>
                  <div>
                    <span className="text-gray-600">Gender:</span>{' '}
                    <span className="font-medium capitalize">{member.gender}</span>
                  </div>
                  {member.phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>{' '}
                      <span className="font-medium">{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium">{member.email}</span>
                    </div>
                  )}
                  {member.blood_type && (
                    <div>
                      <span className="text-gray-600">Blood Type:</span>{' '}
                      <span className="font-medium">{member.blood_type}</span>
                    </div>
                  )}
                  {(member.height_cm || member.weight_kg) && (
                    <div>
                      <span className="text-gray-600">Height/Weight:</span>{' '}
                      <span className="font-medium">
                        {member.height_cm ? `${member.height_cm} cm` : 'N/A'} / {member.weight_kg ? `${member.weight_kg} kg` : 'N/A'}
                      </span>
                    </div>
                  )}
                  {member.medical_history && (
                    <div>
                      <span className="text-gray-600">Medical History:</span>{' '}
                      <span className="font-medium text-xs">{member.medical_history.substring(0, 50)}{member.medical_history.length > 50 ? '...' : ''}</span>
                    </div>
                  )}
                  {member.allergies && (
                    <div>
                      <span className="text-gray-600">Allergies:</span>{' '}
                      <span className="font-medium text-xs">{member.allergies.substring(0, 50)}{member.allergies.length > 50 ? '...' : ''}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => navigate('/portal/appointments', { state: { familyMemberId: member.family_member_id } })}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <FamilyMemberForm
            member={null}
            onSave={handleAddMember}
            onClose={() => {
              setShowAddForm(false);
            }}
          />
        )}
        {editingMember && (
          <FamilyMemberForm
            member={editingMember}
            onSave={(memberData) => handleUpdateMember(editingMember.family_member_id, memberData)}
            onClose={() => {
              setEditingMember(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Family Member Form Component
interface FamilyMemberFormProps {
  member?: FamilyMember | null;
  onSave: (data: any) => void;
  onClose: () => void;
}

const FamilyMemberForm: React.FC<FamilyMemberFormProps> = ({ member, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    date_of_birth: member?.date_of_birth || '',
    gender: member?.gender || 'other',
    relationship: member?.relationship || 'other',
    phone: member?.phone || '',
    email: member?.email || '',
    blood_type: member?.blood_type || '',
    height_cm: member?.height_cm || undefined,
    weight_kg: member?.weight_kg || undefined,
    medical_history: member?.medical_history || '',
    allergies: member?.allergies || '',
  });

  // Calculate age from date of birth
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl hover:shadow-2xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto transition-all duration-300">
        <h2 className="text-xl font-semibold mb-4">
          {member ? 'Edit Family Member' : 'Add Family Member'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              required
            >
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="text"
                value={formData.date_of_birth ? `${calculateAge(formData.date_of_birth)} years` : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                disabled
                readOnly
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type (Optional)</label>
            <select
              value={formData.blood_type}
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm) (Optional)</label>
              <input
                type="number"
                value={formData.height_cm || ''}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="e.g., 170"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) (Optional)</label>
              <input
                type="number"
                value={formData.weight_kg || ''}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="e.g., 70"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical History (Optional)</label>
            <textarea
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              rows={3}
              placeholder="Enter any past medical conditions, surgeries, or chronic illnesses"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (Optional)</label>
            <textarea
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              rows={2}
              placeholder="Enter any known allergies (medications, food, environmental, etc.)"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 text-white py-2 rounded-lg transition-all duration-200"
            >
              {member ? 'Update' : 'Add'} Member
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 hover:shadow-md hover:scale-105 text-gray-700 py-2 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyMembers;

