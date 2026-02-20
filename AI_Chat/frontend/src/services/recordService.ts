/**
 * Medical Record Service - API calls for medical records
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL + '/api';

export interface MedicalRecord {
  record_id: number;
  patient_id: string;
  family_member_id?: number;
  family_member_first_name?: string;
  family_member_last_name?: string;
  record_type: 'prescription' | 'lab_report' | 'radiology_report' | 'visit_summary' | 'discharge_summary' | 'other';
  visit_date: string;
  doctor_id?: number;
  facility_id?: number;
  title: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  created_at: string;
}

class RecordService {
  private getPatientId(): string | null {
    return sessionStorage.getItem('patient_id');
  }

  private getAuthHeaders(): HeadersInit {
    const patientId = this.getPatientId();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (patientId) {
      headers['X-Patient-ID'] = patientId;
    }
    return headers;
  }

  async getRecords(params?: {
    type?: string;
    start_date?: string;
    end_date?: string;
    family_member_id?: string | number;
  }): Promise<{ success: boolean; records?: MedicalRecord[]; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.append('type', params.type);
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.family_member_id !== undefined) {
        queryParams.append('family_member_id', String(params.family_member_id));
      }

      const url = `${API_BASE}/patient/medical-records${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getRecord(recordId: number): Promise<{ success: boolean; record?: MedicalRecord; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/patient/medical-records/${recordId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async downloadRecord(recordId: number): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE}/patient/medical-records/${recordId}/download`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async uploadMedicalRecord(formData: FormData): Promise<{ success: boolean; record?: MedicalRecord; error?: string }> {
    try {
      const patientId = this.getPatientId();
      if (patientId) {
        formData.append('X-Patient-ID', patientId);
      }

      const response = await fetch(`${API_BASE}/patient/medical-records`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary for FormData
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export const recordService = new RecordService();

