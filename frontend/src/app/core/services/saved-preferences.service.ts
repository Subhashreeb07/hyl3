import { Injectable } from '@angular/core';

export interface SavedPreferenceValue {
  fieldId: number;
  label: string;
  value: string;
}

export interface SavedPreference {
  facilityId: number;
  facilityName: string;
  savedAt: string;
  values: SavedPreferenceValue[];
}

@Injectable({ providedIn: 'root' })
export class SavedPreferencesService {
  private readonly PREFIX = 'hyhub_pref_';

  save(pref: SavedPreference): void {
    localStorage.setItem(`${this.PREFIX}${pref.facilityId}`, JSON.stringify(pref));
  }

  load(facilityId: number): SavedPreference | null {
    const raw = localStorage.getItem(`${this.PREFIX}${facilityId}`);
    if (!raw) return null;
    try { return JSON.parse(raw) as SavedPreference; } catch { return null; }
  }

  delete(facilityId: number): void {
    localStorage.removeItem(`${this.PREFIX}${facilityId}`);
  }

  getAll(): SavedPreference[] {
    const result: SavedPreference[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try { result.push(JSON.parse(raw) as SavedPreference); } catch { /* skip corrupt */ }
        }
      }
    }
    return result.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }
}
