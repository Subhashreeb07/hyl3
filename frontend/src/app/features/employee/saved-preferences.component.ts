import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SavedPreferencesService } from '../../core/services/saved-preferences.service';

interface PrefEntry { label: string; value: string; }

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
          <p class="mt-1 text-sm text-slate-500">Your saved form values. They auto-fill matching fields across all facilities when you book.</p>
        </div>
        <a routerLink="/employee/dashboard" class="satori-secondary">← Dashboard</a>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="flex justify-center py-16">
        <span class="text-sm text-slate-400">Loading preferences…</span>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading() && entries().length === 0"
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

      <!-- Preference entries grid -->
      <div *ngIf="!loading() && entries().length > 0"
           class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 bg-slate-50/60 px-5 py-4 flex items-center gap-2">
          <span class="material-icons-outlined text-indigo-500" style="font-size:20px">bookmarks</span>
          <p class="font-bold text-slate-800">{{ entries().length }} saved value{{ entries().length === 1 ? '' : 's' }}</p>
          <p class="ml-1 text-xs text-slate-400">Applied automatically when a facility has a matching field</p>
        </div>
        <div class="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          <div *ngFor="let e of entries(); let i = index"
               class="flex items-start justify-between gap-3 px-5 py-4"
               [class.border-t]="i > 0 && i % 2 === 0">
            <div class="min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{{ e.label }}</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-800 break-words">{{ e.value || '—' }}</p>
            </div>
            <button (click)="confirmDelete(e.label)"
                    class="shrink-0 flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100">
              <span class="material-icons-outlined" style="font-size:14px">close</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Confirm delete modal -->
      <div *ngIf="deletingLabel() !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 mx-auto">
            <span class="material-icons-outlined text-rose-500" style="font-size:24px">warning</span>
          </div>
          <p class="mt-4 text-center text-base font-bold text-slate-800">Remove preference?</p>
          <p class="mt-1 text-center text-sm text-slate-500">
            This will remove the saved value for <strong>{{ deletingLabel() }}</strong>.
          </p>
          <div class="mt-5 flex gap-3">
            <button (click)="deletingLabel.set(null)"
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
  readonly entries = signal<PrefEntry[]>([]);
  readonly loading = signal(true);
  readonly deletingLabel = signal<string | null>(null);

  constructor(private readonly prefService: SavedPreferencesService) {}

  ngOnInit(): void {
    this.prefService.getAll().subscribe({
      next: (map) => {
        this.entries.set(Object.entries(map).map(([label, value]) => ({ label, value })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  confirmDelete(label: string): void {
    this.deletingLabel.set(label);
  }

  doDelete(): void {
    const label = this.deletingLabel();
    if (!label) return;
    this.prefService.deleteByLabel(label).subscribe({
      next: () => {
        this.entries.set(this.entries().filter(e => e.label !== label));
      }
    });
    this.deletingLabel.set(null);
  }
}

