/**
 * Edit Appointment Modal Component
 * Modal for editing appointment details
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, User } from 'lucide-react';
import { Appointment } from '../../services/appointmentService';

interface EditAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSave: (updates: Partial<Appointment>) => void;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({ appointment, onClose, onSave }) => {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState(appointment.appointment_type || 'consultation');
  const [reason, setReason] = useState(appointment.reason || '');
  const [notes, setNotes] = useState(appointment.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Format date for input (YYYY-MM-DD)
    if (appointment.appointment_date) {
      const date = new Date(appointment.appointment_date);
      setAppointmentDate(date.toISOString().split('T')[0]);
    }
    
    // Format time for input (HH:MM)
    if (appointment.appointment_time) {
      const timeStr = appointment.appointment_time.includes('T') 
        ? appointment.appointment_time.split('T')[1] 
        : appointment.appointment_time;
      setAppointmentTime(timeStr.substring(0, 5));
    }
  }, [appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const updates: Partial<Appointment> = {};
    if (appointmentDate) updates.appointment_date = appointmentDate;
    if (appointmentTime) updates.appointment_time = appointmentTime;
    if (appointmentType) updates.appointment_type = appointmentType as any;
    if (reason !== undefined) updates.reason = reason;
    if (notes !== undefined) updates.notes = notes;
    
    onSave(updates);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Info (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient
            </label>
            <div className="flex items-center space-x-2 text-gray-900">
              <User size={16} />
              <span>
                {appointment.family_member_first_name && appointment.family_member_last_name
                  ? `${appointment.family_member_first_name} ${appointment.family_member_last_name}`
                  : appointment.patient_first_name && appointment.patient_last_name
                  ? `${appointment.patient_first_name} ${appointment.patient_last_name}`
                  : appointment.patient_email
                  ? appointment.patient_email.split('@')[0]
                  : 'Patient'}
              </span>
              {appointment.patient_id && (
                <span className="text-xs text-gray-500">({appointment.patient_id})</span>
              )}
            </div>
          </div>

          {/* Appointment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-2" size={16} />
              Appointment Date
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Appointment Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline mr-2" size={16} />
              Appointment Time
            </label>
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Type
            </label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="consultation">Consultation</option>
              <option value="follow_up">Follow Up</option>
              <option value="emergency">Emergency</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for visit..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline mr-2" size={16} />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAppointmentModal;

