import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SessionService } from './session.service';

/** One saved label→value entry (matches backend PreferenceService.PreferenceEntry) */
export interface SavedPreferenceEntry {
  label: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class SavedPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  private authHeader(): HttpHeaders {
    const token = this.session.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  /** Returns label→value map for the logged-in employee. */
  getAll(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>('/api/employee/preferences', {
      headers: this.authHeader()
    });
  }

  /** Upserts a batch of label→value entries. */
  saveAll(entries: SavedPreferenceEntry[]): Observable<void> {
    return this.http.put<void>('/api/employee/preferences', entries, {
      headers: this.authHeader()
    });
  }

  /** Deletes one label entry. */
  deleteByLabel(label: string): Observable<void> {
    return this.http.delete<void>(`/api/employee/preferences/${encodeURIComponent(label)}`, {
      headers: this.authHeader()
    });
  }
}
