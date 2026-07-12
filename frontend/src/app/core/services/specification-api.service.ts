import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FacilitySpecification } from '../models/specification.models';

export interface SpecificationUploadResponse {
  facilityId: number;
  facilityName: string;
  published: boolean;
  fieldCount: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SpecificationApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getTemplate(): Observable<FacilitySpecification> {
    return this.http.get<FacilitySpecification>(`${this.baseUrl}/specifications/template`);
  }

  uploadSpecification(payload: FacilitySpecification): Observable<SpecificationUploadResponse> {
    return this.http.post<SpecificationUploadResponse>(`${this.baseUrl}/specifications/upload`, payload);
  }

  getFacilitySpecification(facilityId: number): Observable<FacilitySpecification> {
    return this.http.get<FacilitySpecification>(`${this.baseUrl}/facilities/${facilityId}/specification`);
  }

  getGeneratedSpecification(facilityId: number): Observable<FacilitySpecification> {
    return this.http.get<FacilitySpecification>(`${this.baseUrl}/specifications/facilities/${facilityId}/generated`);
  }
}
