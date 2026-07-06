import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminBookingSearchItem,
  BookingSummaryResponse,
  BookingTrendResponse,
  FacilityUtilizationResponse,
  NotificationOpsSummaryResponse,
  OperationalSummaryResponse,
  ProcessNotificationsResponse
} from '../models/admin.models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly baseUrl = 'http://localhost:8080/api';

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

  getOperationalSummary(bookingDate?: string | null): Observable<OperationalSummaryResponse> {
    let params = new HttpParams();
    if (bookingDate) params = params.set('bookingDate', bookingDate.trim());

    return this.http.get<OperationalSummaryResponse>(`${this.baseUrl}/reports/summary`, {
      params,
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

  private authHeader(): HttpHeaders {
    const token = this.sessionService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
