import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionService } from '../../core/services/session.service';
import {
  DateEventCount,
  DashboardStatsResponse,
  LocationResponse,
  LocationStatsResponse,
  LocationApiService
} from '../../core/services/location-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">

      <!-- ── Top bar ── -->
      <header class="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-indigo-600">Admin Console</p>
          <h1 class="text-xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <div class="flex items-center gap-3">
          <button class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  (click)="goFacilities()">Facilities</button>
          <button class="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
                  (click)="logout()">Logout</button>
        </div>
      </header>

      <div class="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">

        <!-- ── Date strip ── -->
        <section class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Select Date</h2>
            <label class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
              📅 Today
              <input type="date" class="sr-only" [value]="selectedDate()" (change)="onDatePick($event)" />
            </label>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button *ngFor="let d of dateStrip()"
                    (click)="selectDate(d.date)"
                    class="flex shrink-0 flex-col items-center rounded-xl px-4 py-3 text-center transition-all min-w-[80px]"
                    [class.bg-indigo-600]="d.date === selectedDate()"
                    [class.text-white]="d.date === selectedDate()"
                    [class.shadow-md]="d.date === selectedDate()"
                    [class.bg-slate-50]="d.date !== selectedDate()"
                    [class.text-slate-700]="d.date !== selectedDate()">
              <span class="text-xs font-semibold">{{ d.label }}</span>
              <span class="mt-0.5 text-2xl font-bold">{{ d.date | date:'d' }}</span>
              <span class="mt-0.5 text-xs">{{ d.date | date:'MMM' }}</span>
              <span class="mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    [class.bg-indigo-500]="d.date === selectedDate()"
                    [class.text-white]="d.date === selectedDate()"
                    [class.bg-slate-200]="d.date !== selectedDate()"
                    [class.text-slate-600]="d.date !== selectedDate()">
                {{ d.eventCount }} Events
              </span>
            </button>
            <!-- Fallback strip if backend not loaded -->
            <ng-container *ngIf="dateStrip().length === 0">
              <button *ngFor="let d of fallbackStrip"
                      (click)="selectDate(d.date)"
                      class="flex shrink-0 flex-col items-center rounded-xl px-4 py-3 text-center transition-all min-w-[80px]"
                      [class.bg-indigo-600]="d.date === selectedDate()"
                      [class.text-white]="d.date === selectedDate()"
                      [class.bg-slate-50]="d.date !== selectedDate()"
                      [class.text-slate-700]="d.date !== selectedDate()">
                <span class="text-xs font-semibold">{{ d.label }}</span>
                <span class="mt-0.5 text-2xl font-bold">{{ d.date | date:'d' }}</span>
                <span class="mt-0.5 text-xs">{{ d.date | date:'MMM' }}</span>
                <span class="mt-1.5 rounded-full bg-slate-200 text-slate-600 px-2 py-0.5 text-[10px] font-bold">0 Events</span>
              </button>
            </ng-container>
          </div>
        </section>

        <!-- ── Stats cards ── -->
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div class="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xl">📋</div>
            <p class="text-2xl font-bold text-indigo-600">{{ dashStats()?.activeFacilities ?? 0 }}</p>
            <p class="text-xs font-medium text-slate-500">Active Facilities</p>
          </div>
          <div class="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl">📱</div>
            <p class="text-2xl font-bold text-emerald-600">{{ dashStats()?.totalBookingsOnDate ?? 0 }}</p>
            <p class="text-xs font-medium text-slate-500">Total Bookings</p>
          </div>
          <div class="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-xl">✅</div>
            <p class="text-2xl font-bold text-sky-600">{{ dashStats()?.completedBookings ?? 0 }}</p>
            <p class="text-xs font-medium text-slate-500">Completed</p>
          </div>
          <div class="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-xl">⏰</div>
            <p class="text-2xl font-bold text-rose-600">{{ dashStats()?.todaysDeadline ?? '—' }}</p>
            <p class="text-xs font-medium text-slate-500">Today's Deadline</p>
          </div>
        </div>

        <!-- ── Office Locations table ── -->
        <section class="rounded-2xl bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 class="text-base font-bold text-slate-900">Office Locations</h2>
              <p class="text-xs text-slate-400 mt-0.5">Manage corporate offices. Click a row to view facility activity.</p>
            </div>
            <div class="flex items-center gap-2">
              <ng-container *ngIf="!showAddForm()">
                <button (click)="showAddForm.set(true)"
                        class="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
                  + Add Location
                </button>
              </ng-container>
              <ng-container *ngIf="showAddForm()">
                <input type="text" [(ngModel)]="newLocationName" placeholder="e.g. Mumbai"
                       class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                       (keydown.enter)="addLocation()" (keydown.escape)="cancelAdd()" />
                <button (click)="addLocation()" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">Save</button>
                <button (click)="cancelAdd()" class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500">Cancel</button>
              </ng-container>
            </div>
          </div>

          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-6 py-3">Office Location</th>
                <th class="px-6 py-3">Employee Count</th>
                <th class="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let loc of locations()"
                  class="border-t border-slate-100 cursor-pointer transition-colors hover:bg-slate-50"
                  [class.bg-indigo-50]="selectedLocation()?.id === loc.id"
                  (click)="selectLocation(loc)">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      {{ loc.locationName.charAt(0) }}
                    </span>
                    <div>
                      <p class="font-semibold text-slate-800">{{ loc.locationName }}</p>
                      <p class="text-[11px] text-slate-400">Click to view facility stats →</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4" (click)="$event.stopPropagation()">
                  <div class="flex items-center gap-2">
                    <ng-container *ngIf="editingLocationId() !== loc.id">
                      <span class="text-lg font-bold text-slate-700">{{ loc.employeeCount }}</span>
                      <button (click)="startEditCount(loc)" class="rounded border border-indigo-200 px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-50">Edit</button>
                    </ng-container>
                    <ng-container *ngIf="editingLocationId() === loc.id">
                      <input type="number" [(ngModel)]="editCountValue" min="0"
                             class="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                             (keydown.enter)="saveCount(loc)" (keydown.escape)="editingLocationId.set(null)" />
                      <button (click)="saveCount(loc)" class="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white">✓</button>
                      <button (click)="editingLocationId.set(null)" class="rounded-lg border border-slate-200 px-2 py-1 text-xs">✕</button>
                    </ng-container>
                  </div>
                </td>
                <td class="px-6 py-4" (click)="$event.stopPropagation()">
                  <button (click)="deleteLocation(loc)" class="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">Remove</button>
                </td>
              </tr>
              <tr *ngIf="locations().length === 0">
                <td colspan="3" class="px-6 py-10 text-center text-slate-400 text-sm">
                  No office locations yet. Click "+ Add Location" to create one.
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- ── Facility stats for selected location ── -->
        <section *ngIf="selectedLocation() && locationStats()" class="rounded-2xl bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 class="text-base font-bold text-slate-900">
                Facility Activity — {{ selectedLocation()!.locationName }}
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ selectedDate() | date:'mediumDate' }} · Counts increment when employees book. All start at zero.
              </p>
            </div>
            <button (click)="selectedLocation.set(null); locationStats.set(null)"
                    class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 text-lg">✕</button>
          </div>

          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-6 py-3">Facility</th>
                <th class="px-6 py-3">Category</th>
                <th class="px-6 py-3 text-center">Total Requested</th>
                <th class="px-6 py-3 text-center">Acknowledged</th>
                <th class="px-6 py-3 text-center">Pending</th>
                <th class="px-6 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of locationStats()!.facilityStats"
                  class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 font-semibold text-slate-800">{{ row.facilityName }}</td>
                <td class="px-6 py-4">
                  <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{{ row.category || '—' }}</span>
                </td>
                <td class="px-6 py-4 text-center text-lg font-bold text-indigo-600">{{ row.totalRequested }}</td>
                <td class="px-6 py-4 text-center text-lg font-bold text-emerald-600">{{ row.acknowledged }}</td>
                <td class="px-6 py-4 text-center text-lg font-bold text-amber-600">{{ row.totalRequested - row.acknowledged }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden min-w-[80px]">
                      <div class="h-2 rounded-full bg-emerald-500 transition-all" [style.width]="getProgressWidth(row)"></div>
                    </div>
                    <span class="text-xs text-slate-400 w-8 text-right">{{ getProgressPct(row) }}%</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="locationStats()!.facilityStats.length === 0">
                <td colspan="6" class="px-6 py-10 text-center text-slate-400 text-sm">
                  No published facilities. Publish a facility to see it tracked here.
                </td>
              </tr>
            </tbody>
          </table>
        </section>

      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {

  // ── date state ────────────────────────────────────────────────────────────
  selectedDate  = signal<string>(this.today());
  dateStrip     = signal<DateEventCount[]>([]);
  dashStats     = signal<DashboardStatsResponse | null>(null);

  /** Fallback 5-day strip shown while backend loads */
  readonly fallbackStrip = this.buildFallbackStrip();

  // ── locations state ───────────────────────────────────────────────────────
  locations        = signal<LocationResponse[]>([]);
  selectedLocation = signal<LocationResponse | null>(null);
  locationStats    = signal<LocationStatsResponse | null>(null);

  // ── add location form ─────────────────────────────────────────────────────
  showAddForm     = signal(false);
  newLocationName = '';

  // ── edit count ────────────────────────────────────────────────────────────
  editingLocationId = signal<number | null>(null);
  editCountValue    = 0;

  constructor(
    private readonly locationApi: LocationApiService,
    private readonly sessionService: SessionService,
    private readonly authApi: AuthApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadLocations();
  }

  // ── dashboard ─────────────────────────────────────────────────────────────

  private async loadDashboard(): Promise<void> {
    try {
      const stats = await firstValueFrom(this.locationApi.getDashboardStats(this.selectedDate()));
      this.dashStats.set(stats);
      this.dateStrip.set(stats.dateStrip);
    } catch { /* backend may not be ready */ }
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.loadDashboard();
    if (this.selectedLocation()) this.loadLocationStats(this.selectedLocation()!);
  }

  onDatePick(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    if (v) this.selectDate(v);
  }

  // ── locations ─────────────────────────────────────────────────────────────

  private async loadLocations(): Promise<void> {
    try {
      this.locations.set(await firstValueFrom(this.locationApi.getLocations()));
    } catch { /* ignore */ }
  }

  async addLocation(): Promise<void> {
    const name = this.newLocationName.trim();
    if (!name) return;
    try {
      const created = await firstValueFrom(this.locationApi.createLocation(name));
      this.locations.update(ls => [...ls, created]);
      this.newLocationName = '';
      this.showAddForm.set(false);
    } catch (e: any) { alert(e?.error?.message ?? 'Failed to create location'); }
  }

  cancelAdd(): void { this.newLocationName = ''; this.showAddForm.set(false); }

  startEditCount(loc: LocationResponse): void {
    this.editCountValue = loc.employeeCount;
    this.editingLocationId.set(loc.id);
  }

  async saveCount(loc: LocationResponse): Promise<void> {
    try {
      const updated = await firstValueFrom(this.locationApi.updateEmployeeCount(loc.id, this.editCountValue));
      this.locations.update(ls => ls.map(l => l.id === loc.id ? updated : l));
      if (this.selectedLocation()?.id === loc.id) this.selectedLocation.set(updated);
      this.editingLocationId.set(null);
    } catch (e: any) { alert(e?.error?.message ?? 'Failed to update count'); }
  }

  async deleteLocation(loc: LocationResponse): Promise<void> {
    if (!confirm(`Remove "${loc.locationName}"?`)) return;
    try {
      await firstValueFrom(this.locationApi.deleteLocation(loc.id));
      this.locations.update(ls => ls.filter(l => l.id !== loc.id));
      if (this.selectedLocation()?.id === loc.id) { this.selectedLocation.set(null); this.locationStats.set(null); }
    } catch (e: any) { alert(e?.error?.message ?? 'Failed to delete location'); }
  }

  async selectLocation(loc: LocationResponse): Promise<void> {
    if (this.selectedLocation()?.id === loc.id) { this.selectedLocation.set(null); this.locationStats.set(null); return; }
    this.selectedLocation.set(loc);
    await this.loadLocationStats(loc);
  }

  private async loadLocationStats(loc: LocationResponse): Promise<void> {
    try {
      this.locationStats.set(await firstValueFrom(this.locationApi.getLocationStats(loc.id, this.selectedDate())));
    } catch { /* ignore */ }
  }

  // ── progress helpers ──────────────────────────────────────────────────────

  getProgressWidth(row: { totalRequested: number; acknowledged: number }): string {
    if (!row.totalRequested) return '0%';
    return Math.round((row.acknowledged / row.totalRequested) * 100) + '%';
  }

  getProgressPct(row: { totalRequested: number; acknowledged: number }): number {
    if (!row.totalRequested) return 0;
    return Math.round((row.acknowledged / row.totalRequested) * 100);
  }

  // ── utils ─────────────────────────────────────────────────────────────────

  private today(): string { return new Date().toISOString().split('T')[0]; }

  private buildFallbackStrip(): { date: string; label: string }[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    return [-2, -1, 0, 1, 2].map(offset => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      return { date: d.toISOString().split('T')[0], label: days[d.getDay()] };
    });
  }

  goFacilities(): void { this.router.navigateByUrl('/admin/facilities'); }

  async logout(): Promise<void> {
    const token = this.sessionService.getToken();
    if (token) { try { await firstValueFrom(this.authApi.logout(token)); } catch { /* ignore */ } }
    this.sessionService.clear();
    this.router.navigateByUrl('/login');
  }
}
