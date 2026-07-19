import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminBookingSearchItem,
  BookingSummaryResponse,
  BookingTrendResponse,
  FacilityUtilizationResponse,
  NotificationChannel,
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
  EmployeeRegistrationsResponse,
  NotificationHistoryResponse,
  NotificationOpsSummaryResponse,
  NotificationQueueItem,
  NotificationTemplate,
  NotificationTemplateUpsertRequest,
  NotificationTrigger,
  NotificationTriggerUpsertRequest,
  OperationalSummaryResponse,
  ProcessNotificationsResponse,
  TestNotificationRequest,
  TestNotificationResponse
} from '../models/admin.models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly sessionService: SessionService
  ) {}

  searchBookings(filters: {
    facilityId?: number | null;
    employeeId?: string | null;
    status?: string | null;
    bookingDate?: string | null;
  }): Observable<AdminBookingSearchItem[]> {
    let params = new HttpParams();
    if (filters.facilityId) params = params.set('facilityId', String(filters.facilityId));
    if (filters.employeeId) params = params.set('employeeId', filters.employeeId.trim());
    if (filters.status) params = params.set('status', filters.status.trim());
    if (filters.bookingDate) params = params.set('bookingDate', filters.bookingDate.trim());

    return this.http.get<AdminBookingSearchItem[]>(`${this.baseUrl}/bookings/admin/search`, {
      params,
      headers: this.authHeader()
    });
  }

  getBookingSummary(facilityId: number, bookingDate?: string | null): Observable<BookingSummaryResponse> {
    let params = new HttpParams().set('facilityId', String(facilityId));
    if (bookingDate) params = params.set('bookingDate', bookingDate.trim());

    return this.http.get<BookingSummaryResponse>(`${this.baseUrl}/bookings/admin/summary`, {
      params,
      headers: this.authHeader()
    });
  }

  deleteBooking(bookingId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bookings/${bookingId}`, {
      headers: this.authHeader()
    });
  }

  getOperationalSummary(bookingDate?: string | null, facilityId?: number | null): Observable<OperationalSummaryResponse> {
    let params = new HttpParams();
    if (bookingDate) params = params.set('bookingDate', bookingDate.trim());
    if (facilityId) params = params.set('facilityId', String(facilityId));

    return this.http.get<OperationalSummaryResponse>(`${this.baseUrl}/reports/summary`, {
      params,
      headers: this.authHeader()
    });
  }

  getDailyReport(): Observable<{[key: string]: number}> {
    return this.http.get<{[key: string]: number}>(`${this.baseUrl}/reports/daily`, {
      headers: this.authHeader()
    });
  }

  getBookingTrend(fromDate: string, toDate: string, facilityId?: number | null): Observable<BookingTrendResponse> {
    let params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);
    if (facilityId) params = params.set('facilityId', String(facilityId));

    return this.http.get<BookingTrendResponse>(`${this.baseUrl}/reports/trend`, {
      params,
      headers: this.authHeader()
    });
  }

  getFacilityUtilization(facilityId: number, bookingDate?: string | null): Observable<FacilityUtilizationResponse> {
    let params = new HttpParams();
    if (bookingDate) params = params.set('bookingDate', bookingDate.trim());

    return this.http.get<FacilityUtilizationResponse>(`${this.baseUrl}/reports/facility/${facilityId}/utilization`, {
      params,
      headers: this.authHeader()
    });
  }

  processNotifications(batchSize?: number | null): Observable<ProcessNotificationsResponse> {
    let params = new HttpParams();
    if (batchSize) params = params.set('batchSize', String(batchSize));

    return this.http.post<ProcessNotificationsResponse>(`${this.baseUrl}/notifications/process`, null, {
      params,
      headers: this.authHeader()
    });
  }

  getNotificationOpsSummary(reportDate?: string | null): Observable<NotificationOpsSummaryResponse> {
    let params = new HttpParams();
    if (reportDate) params = params.set('reportDate', reportDate.trim());

    return this.http.get<NotificationOpsSummaryResponse>(`${this.baseUrl}/notifications/ops/summary`, {
      params,
      headers: this.authHeader()
    });
  }

  getNotificationTemplates(): Observable<NotificationTemplate[]> {
    return this.http.get<NotificationTemplate[]>(`${this.baseUrl}/notifications/templates`, {
      headers: this.authHeader()
    });
  }

  saveNotificationTemplate(payload: NotificationTemplateUpsertRequest): Observable<NotificationTemplate> {
    return this.http.post<NotificationTemplate>(`${this.baseUrl}/notifications/templates`, payload, {
      headers: this.authHeader()
    });
  }

  deleteNotificationTemplate(templateId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notifications/templates/${templateId}`, {
      headers: this.authHeader()
    });
  }

  getNotificationTriggers(): Observable<NotificationTrigger[]> {
    return this.http.get<NotificationTrigger[]>(`${this.baseUrl}/notifications/triggers`, {
      headers: this.authHeader()
    });
  }

  saveNotificationTrigger(payload: NotificationTriggerUpsertRequest): Observable<NotificationTrigger> {
    return this.http.post<NotificationTrigger>(`${this.baseUrl}/notifications/triggers`, payload, {
      headers: this.authHeader()
    });
  }

  deleteNotificationTrigger(triggerId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notifications/triggers/${triggerId}`, {
      headers: this.authHeader()
    });
  }

  getNotificationQueue(filters?: {
    facility?: string | null;
    status?: string | null;
    channel?: NotificationChannel | null;
    date?: string | null;
  }): Observable<NotificationQueueItem[]> {
    let params = new HttpParams();
    if (filters?.facility) params = params.set('facility', filters.facility.trim());
    if (filters?.status) params = params.set('status', filters.status.trim());
    if (filters?.channel) params = params.set('channel', filters.channel);
    if (filters?.date) params = params.set('date', filters.date.trim());

    return this.http.get<NotificationQueueItem[]>(`${this.baseUrl}/notifications/queue`, {
      params,
      headers: this.authHeader()
    });
  }

  getNotificationHistory(filters?: {
    query?: string | null;
    facility?: string | null;
    status?: string | null;
    channel?: NotificationChannel | null;
    date?: string | null;
    page?: number;
    pageSize?: number;
  }): Observable<NotificationHistoryResponse> {
    let params = new HttpParams();
    if (filters?.query) params = params.set('query', filters.query.trim());
    if (filters?.facility) params = params.set('facility', filters.facility.trim());
    if (filters?.status) params = params.set('status', filters.status.trim());
    if (filters?.channel) params = params.set('channel', filters.channel);
    if (filters?.date) params = params.set('date', filters.date.trim());
    if (typeof filters?.page === 'number') params = params.set('page', String(filters.page));
    if (typeof filters?.pageSize === 'number') params = params.set('pageSize', String(filters.pageSize));

    return this.http.get<NotificationHistoryResponse>(`${this.baseUrl}/notifications/history`, {
      params,
      headers: this.authHeader()
    });
  }

  testNotification(payload: TestNotificationRequest): Observable<TestNotificationResponse> {
    return this.http.post<TestNotificationResponse>(`${this.baseUrl}/notifications/test`, payload, {
      headers: this.authHeader()
    });
  }

  sendNotificationBroadcast(payload: BroadcastNotificationRequest): Observable<BroadcastNotificationResponse> {
    return this.http.post<BroadcastNotificationResponse>(`${this.baseUrl}/notifications/broadcast`, payload, {
      headers: this.authHeader()
    });
  }

  getEmailTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/notification-templates`, {
      headers: this.authHeader()
    });
  }

  updateNotificationTemplate(templateKey: string, payload: { subject: string; body: string; displayName?: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/notification-templates/${templateKey}`, payload, {
      headers: this.authHeader()
    });
  }

  testSendNotification(payload: { toEmail: string; templateKey: string; facilityName?: string }): Observable<{ sent: boolean; message: string }> {
    return this.http.post<{ sent: boolean; message: string }>(`${this.baseUrl}/admin/notification-templates/test-send`, payload, {
      headers: this.authHeader()
    });
  }

  getEmployeeRegistrations(filters?: {
    query?: string | null;
    location?: string | null;
    activeOnly?: boolean | null;
  }): Observable<EmployeeRegistrationsResponse> {
    let params = new HttpParams();
    if (filters?.query) params = params.set('query', filters.query.trim());
    if (filters?.location) params = params.set('location', filters.location.trim());
    if (typeof filters?.activeOnly === 'boolean') params = params.set('activeOnly', String(filters.activeOnly));

    return this.http.get<EmployeeRegistrationsResponse>(`${this.baseUrl}/reports/registrations`, {
      params,
      headers: this.authHeader()
    });
  }

  importFacilityFromJson(jsonData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/facilities/import-json`, jsonData, {
      headers: this.authHeader()
    });
  }

  private authHeader(): HttpHeaders {
    const token = this.sessionService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
