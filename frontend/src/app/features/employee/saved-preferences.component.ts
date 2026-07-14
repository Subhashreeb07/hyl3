import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SavedPreference, SavedPreferencesService } from '../../core/services/saved-preferences.service';

@Component({
  selector: 'app-saved-preferences',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-3xl py-6 px-4 md:px-0">

      <!-- Header -->
      <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-brand-600">Employee Portal</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900">Saved Preferences</h1>
          <p class="mt-1 text-sm text-slate-500">Your saved form preferences per facility. Instantly apply them when booking.</p>
        </div>
        <a routerLink="/employee/dashboard" class="satori-secondary">← Dashboard</a>
      </div>

      <!-- Empty state -->
      <div *ngIf="preferences().length === 0"
           class="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
          <span class="material-icons-outlined text-indigo-400" style="font-size:30px">bookmark_border</span>
        </div>
        <div>
          <p class="text-base font-semibold text-slate-700">No saved preferences yet</p>
          <p class="mt-1 text-sm text-slate-400">Open a facility booking, fill in your choices, then click<br/><strong class="text-indigo-600">Save as Preference</strong> to save them here.</p>
        </div>
        <a routerLink="/employee/dashboard" class="mt-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors">
          Book a Facility
        </a>
      </div>

      <!-- Preference cards -->
      <div class="flex flex-col gap-4" *ngIf="preferences().length > 0">
        <article *ngFor="let pref of preferences()"
                 class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">

          <!-- Card header -->
          <div class="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                <span class="material-icons-outlined text-indigo-600" style="font-size:20px">bookmark</span>
              </div>
              <div>
                <p class="font-bold text-slate-800">{{ pref.facilityName }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">Saved on {{ formatDate(pref.savedAt) }}</p>
              </div>
            </div>
            <button (click)="confirmDelete(pref.facilityId, pref.facilityName)"
                    class="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100">
              <span class="material-icons-outlined" style="font-size:15px">delete_outline</span>
              Remove
            </button>
          </div>

          <!-- Field values grid -->
          <div class="p-5">
            <p class="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Saved Values</p>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div *ngFor="let v of pref.values"
                   class="flex flex-col rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">{{ v.label }}</span>
                <span class="mt-1 text-sm font-semibold text-slate-700">{{ v.value || '—' }}</span>
              </div>
            </div>

            <div *ngIf="pref.values.length === 0"
                 class="rounded-xl border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
              No field values saved.
            </div>
          </div>
        </article>
      </div>

      <!-- Confirm delete modal -->
      <div *ngIf="deletingId() !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 mx-auto">
            <span class="material-icons-outlined text-rose-500" style="font-size:24px">warning</span>
          </div>
          <p class="mt-4 text-center text-base font-bold text-slate-800">Remove preference?</p>
          <p class="mt-1 text-center text-sm text-slate-500">
            This will permanently remove your saved preference for <strong>{{ deletingName() }}</strong>.
          </p>
          <div class="mt-5 flex gap-3">
            <button (click)="deletingId.set(null)"
                    class="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button (click)="doDelete()"
                    class="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition-colors">
              Remove
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class SavedPreferencesComponent implements OnInit {
  readonly preferences = signal<SavedPreference[]>([]);
  readonly deletingId = signal<number | null>(null);
  readonly deletingName = signal('');

  constructor(private readonly prefService: SavedPreferencesService) {}

  ngOnInit(): void {
    this.preferences.set(this.prefService.getAll());
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }

  confirmDelete(facilityId: number, name: string): void {
    this.deletingId.set(facilityId);
    this.deletingName.set(name);
  }

  doDelete(): void {
    const id = this.deletingId();
    if (id !== null) {
      this.prefService.delete(id);
      this.preferences.set(this.prefService.getAll());
    }
    this.deletingId.set(null);
  }
}
