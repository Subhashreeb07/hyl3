import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BookingDetail,
  BookingHistoryItem,
  BookingPreferenceResponse,
  MessageResponse,
  SubmitBookingRequest,
  SubmitBookingResponse
} from '../models/employee-flow.models';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly baseUrl = `${environment.apiUrl}/bookings`;

  constructor(private readonly http: HttpClient) {}

  submitBooking(payload: SubmitBookingRequest): Observable<SubmitBookingResponse> {
    return this.http.post<SubmitBookingResponse>(this.baseUrl, payload);
  }

  getBookingHistory(employeeId: string): Observable<BookingHistoryItem[]> {
    return this.http.get<BookingHistoryItem[]>(`${this.baseUrl}/history/${employeeId}`);
  }

  getBookingPreferences(employeeId: string, facilityId: number): Observable<BookingPreferenceResponse> {
    return this.http.get<BookingPreferenceResponse>(
      `${this.baseUrl}/preferences?employeeId=${encodeURIComponent(employeeId)}&facilityId=${facilityId}`
    );
  }

  getBookingDetail(bookingId: number): Observable<BookingDetail> {
    return this.http.get<BookingDetail>(`${this.baseUrl}/${bookingId}`);
  }

  cancelBooking(bookingId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${bookingId}`);
  }
}
