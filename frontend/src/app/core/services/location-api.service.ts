import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionService } from './session.service';

export interface LocationResponse {
  id: number;
  locationName: string;
  employeeCount: number;
  createdAt?: string;
}

export interface FacilityStatRow {
  facilityId: number;
  facilityName: string;
  category: string;
  totalRequested: number;
  acknowledged: number;
}

export interface LocationStatsResponse {
  locationId: number;
  locationName: string;
  bookingDate: string;
  facilityStats: FacilityStatRow[];
}

export interface DateEventCount {
  date: string;
  label: string;
  eventCount: number;
}

export interface DashboardStatsResponse {
  activeFacilities: number;
  totalBookingsOnDate: number;
  completedBookings: number;
  todaysDeadline: string;
  dateStrip: DateEventCount[];
}

@Injectable({ providedIn: 'root' })
export class LocationApiService {
  private readonly base = 'http://localhost:8080/api';

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService
  ) {}

  private authHeader(): HttpHeaders {
    const token = this.session.getToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  getLocations(): Observable<LocationResponse[]> {
    return this.http.get<LocationResponse[]>(`${this.base}/locations`, { headers: this.authHeader() });
  }

  createLocation(name: string): Observable<LocationResponse> {
    return this.http.post<LocationResponse>(`${this.base}/locations`, { locationName: name }, { headers: this.authHeader() });
  }

  updateEmployeeCount(locationId: number, count: number): Observable<LocationResponse> {
    return this.http.patch<LocationResponse>(
      `${this.base}/locations/${locationId}/employee-count`,
      { employeeCount: count },
      { headers: this.authHeader() }
    );
  }

  deleteLocation(locationId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/locations/${locationId}`, { headers: this.authHeader() });
  }

  getLocationStats(locationId: number, date?: string): Observable<LocationStatsResponse> {
    const params = date ? `?date=${date}` : '';
    return this.http.get<LocationStatsResponse>(
      `${this.base}/locations/${locationId}/stats${params}`,
      { headers: this.authHeader() }
    );
  }

  getDashboardStats(date?: string): Observable<DashboardStatsResponse> {
    const params = date ? `?date=${date}` : '';
    return this.http.get<DashboardStatsResponse>(
      `${this.base}/locations/dashboard/stats${params}`,
      { headers: this.authHeader() }
    );
  }

  acknowledge(facilityId: number, locationId: number, date?: string): Observable<void> {
    const params = date ? `?date=${date}` : '';
    return this.http.post<void>(
      `${this.base}/${facilityId}/locations/${locationId}/acknowledge${params}`,
      {},
      { headers: this.authHeader() }
    );
  }
}
