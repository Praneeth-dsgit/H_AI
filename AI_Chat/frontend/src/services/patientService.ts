/**
 * Patient Service - API calls for patient-related operations
 * Uses Patient ID as the central identifier
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL + '/api';

export interface Patient {
  patient_id: string;
  user_id?: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  blood_type?: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  is_active: boolean;
  created_at: string;
}

export interface FamilyMember {
  family_member_id: number;
  primary_patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  phone?: string;
  email?: string;
  blood_type?: string;
  height_cm?: number;
  weight_kg?: number;
  medical_history?: string;
  allergies?: string;
  is_active: boolean;
}

class PatientService {
  private getPatientId(): string | null {
    return localStorage.getItem('patient_id');
  }

  private getAuthHeaders(): HeadersInit {
    const patientId = this.getPatientId();
    const userEmail = localStorage.getItem('userEmail');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (patientId) {
      headers['X-Patient-ID'] = patientId;
    }
    if (userEmail) {
      headers['X-User-Email'] = userEmail;
    }
    return headers;
  }

  // Patient Profile
  async getProfile(): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Use patient_id if available, otherwise use user email
      const patientId = this.getPatientId();
      if (patientId) {
        headers['X-Patient-ID'] = patientId;
        console.log('Fetching profile with Patient ID:', patientId);
      } else if (userEmail) {
        headers['X-User-Email'] = userEmail;
        console.log('Fetching profile with User Email:', userEmail);
      } else {
        console.error('No patient_id or userEmail found in localStorage');
        return { success: false, error: 'No authentication information found. Please login again.' };
      }
      
      const response = await fetch(`${API_BASE}/patient/profile`, {
        method: 'GET',
        headers: headers,
      });
      
      console.log('Profile API response status:', response.status);
      const data = await response.json();
      console.log('Profile API response data:', data);
      
      if (!response.ok) {
        console.error('Profile API error:', data);
        return { success: false, error: data.error || 'Failed to fetch profile' };
      }
      
      return data;
    } catch (error) {
      console.error('Network error fetching profile:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async updateProfile(patientData: Partial<Patient>): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Use patient_id if available, otherwise use user email
      const patientId = this.getPatientId();
      if (patientId) {
        headers['X-Patient-ID'] = patientId;
      } else if (userEmail) {
        headers['X-User-Email'] = userEmail;
      }
      
      const response = await fetch(`${API_BASE}/patient/profile`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(patientData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Family Members
  async getFamilyMembers(): Promise<{ success: boolean; family_members?: FamilyMember[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/patient/family-members`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async addFamilyMember(memberData: Omit<FamilyMember, 'family_member_id' | 'primary_patient_id' | 'is_active'>): Promise<{ success: boolean; family_member?: FamilyMember; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/patient/family-members`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async updateFamilyMember(memberId: number, memberData: Partial<FamilyMember>): Promise<{ success: boolean; family_member?: FamilyMember; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/patient/family-members/${memberId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async deleteFamilyMember(memberId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/patient/family-members/${memberId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get list of all patients (for doctors)
  // If doctorId is provided, only returns patients who have appointments with that doctor
  async listPatients(search?: string, doctorId?: number): Promise<{ success: boolean; patients?: Array<{patient_id: string; first_name: string; last_name: string; date_of_birth: string; gender: string; age?: number; email?: string; phone?: string}>; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (doctorId) queryParams.append('doctor_id', doctorId.toString());

      const userEmail = localStorage.getItem('userEmail');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (userEmail) {
        headers['X-User-Email'] = userEmail;
      }

      const response = await fetch(`${API_BASE}/patient/list?${queryParams}`, {
        method: 'GET',
        headers: headers,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get patient by ID (for auto-fill)
  async getPatientById(patientId: string): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/patient/profile?patient_id=${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Patient-ID': patientId,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export const patientService = new PatientService();

