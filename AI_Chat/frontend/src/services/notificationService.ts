/**
 * Notification Service
 * Handles fetching and managing patient notifications
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface Notification {
  notification_id: number;
  patient_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment_id?: number;
}

class NotificationService {
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

  /**
   * Get notifications for the current patient
   */
  async getNotifications(unreadOnly: boolean = false): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
    try {
      const queryParam = unreadOnly ? '?unread_only=true' : '';
      const response = await fetch(`${API_BASE}/api/notifications/patient${queryParam}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/patient/${notificationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/patient/read-all`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Clear all notifications for the current patient
   */
  async clearAllNotifications(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/patient/clear-all`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export const notificationService = new NotificationService();

