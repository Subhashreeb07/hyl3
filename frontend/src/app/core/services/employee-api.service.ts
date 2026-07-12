import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailableFacility,
  DashboardFacility,
  EmployeeNotificationListResponse,
  EmployeeHomeResponse,
  EmployeeProfileResponse,
  FacilitySpecificationResponse,
  InvitationsResponse
} from '../models/employee-flow.models';

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getDashboardFacilities(employeeId: string): Observable<DashboardFacility[]> {
    return this.http.get<DashboardFacility[]>(`${this.baseUrl}/dashboard`, {
      params: { employeeId }
    });
  }

  getEmployeeHomeSummary(employeeId: string): Observable<EmployeeHomeResponse> {
    return this.http.get<EmployeeHomeResponse>(`${this.baseUrl}/employee/home/${employeeId}`);
  }

  getAvailableFacilitiesForDate(employeeId: string, date: string): Observable<AvailableFacility[]> {
    return this.http.get<AvailableFacility[]>(`${this.baseUrl}/employee/facilities/available`, {
      params: { employeeId, date }
    });
  }

  getEmployeeProfile(employeeId: string): Observable<EmployeeProfileResponse> {
    return this.http.get<EmployeeProfileResponse>(`${this.baseUrl}/employee/profile/${employeeId}`);
  }

  getEmployeeInvitations(employeeId: string): Observable<InvitationsResponse> {
    return this.http.get<InvitationsResponse>(`${this.baseUrl}/employee/invitations/${employeeId}`);
  }

  getFacilitySpecification(facilityId: number): Observable<FacilitySpecificationResponse> {
    return this.http.get<FacilitySpecificationResponse>(`${this.baseUrl}/facilities/${facilityId}/specification`);
  }

  getEmployeeNotifications(employeeId: string, statusCode?: string): Observable<EmployeeNotificationListResponse> {
    const params: Record<string, string> = {};
    if (statusCode && statusCode.trim().length > 0) {
      params['statusCode'] = statusCode.trim();
    }

    return this.http.get<EmployeeNotificationListResponse>(`${this.baseUrl}/notifications/employee/${employeeId}`, {
      params
    });
  }

  markNotificationRead(notificationId: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/notifications/${notificationId}/read`, {});
  }
}
