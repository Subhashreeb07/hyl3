import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionService } from './session.service';

export interface CreateScheduleRequest {
  templateId: number;
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  scheduledAt?: string;
  timeOfDay?: string;
  daysOfWeek?: string;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  timezone?: string;
}

export interface UpdateScheduleRequest extends CreateScheduleRequest {
  scheduleId: number;
  active: boolean;
}

export interface ScheduleResponse {
  scheduleId: number;
  templateId: number;
  templateName: string;
  frequency: string;
  scheduledAt?: string;
  timeOfDay?: string;
  daysOfWeek?: string;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  active: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleListResponse {
  items: ScheduleResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationScheduleApiService {
  private readonly apiUrl = '/api/notifications/schedule';

  constructor(
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

  private getHeaders(): HttpHeaders {
    const employeeId = this.sessionService.getEmployeeId();
    return new HttpHeaders({
      'X-Employee-Id': employeeId || '',
      'Content-Type': 'application/json'
    });
  }

  createSchedule(request: CreateScheduleRequest): Observable<ScheduleResponse> {
    return this.http.post<ScheduleResponse>(
      this.apiUrl,
      request,
      { headers: this.getHeaders() }
    );
  }

  updateSchedule(request: UpdateScheduleRequest): Observable<ScheduleResponse> {
    return this.http.put<ScheduleResponse>(
      this.apiUrl,
      request,
      { headers: this.getHeaders() }
    );
  }

  getSchedule(scheduleId: number): Observable<ScheduleResponse> {
    return this.http.get<ScheduleResponse>(
      `${this.apiUrl}/${scheduleId}`,
      { headers: this.getHeaders() }
    );
  }

  getEmployeeSchedules(): Observable<ScheduleListResponse> {
    return this.http.get<ScheduleListResponse>(
      this.apiUrl,
      { headers: this.getHeaders() }
    );
  }

  deleteSchedule(scheduleId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${scheduleId}`,
      { headers: this.getHeaders() }
    );
  }
}
