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
  styles: [`

    /* ── Animate fade-in ── */
    @keyframes hy-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hy-animate { animation: hy-fade-in 0.3s ease both; }
  `],
  template: `
    <div class="hy-page">

      <!-- ── Page Header ── -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 px-6 md:px-8 pt-8 pb-2 max-w-[1400px] mx-auto w-full">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[10px] font-black tracking-widest text-brand-600 uppercase bg-brand-50 px-2.5 py-1 rounded-md border border-brand-100/50">Admin Console</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Operations Dashboard</h1>
          <p class="text-sm font-medium text-slate-500 mt-2">Manage facilities, track bookings, and monitor office activity</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button class="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-brand-600 hover:border-brand-200" (click)="goFacilities()">
            <mat-icon class="!text-[20px]">apartment</mat-icon>
            Manage Facilities
          </button>
        </div>
      </div>

      <!-- ── Content Body ── -->
      <div class="hy-content w-full">

        <!-- ── KPI Stats Row ── -->
        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 hy-animate">
          <div class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all group">
            <div class="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div class="flex items-center justify-between relative z-10">
              <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">LIVE</span>
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100 shadow-sm transition-transform group-hover:scale-110">
                <mat-icon class="!text-[22px]">apartment</mat-icon>
              </div>
            </div>
            <div class="mt-5 relative z-10">
              <p class="text-3xl font-black tracking-tight text-slate-900">{{ dashStats()?.totalBookings ?? 0 }}</p>
              <p class="text-xs font-semibold text-slate-500 mt-1">Total Bookings</p>
            </div>
          </div>

          <div class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all group">
            <div class="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div class="flex items-center justify-between relative z-10">
              <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">TODAY</span>
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm transition-transform group-hover:scale-110">
                <mat-icon class="!text-[22px]">book_online</mat-icon>
              </div>
            </div>
            <div class="mt-5 relative z-10">
              <p class="text-3xl font-black tracking-tight text-slate-900">{{ dashStats()?.totalBookings ?? 0 }}</p>
              <p class="text-xs font-semibold text-slate-500 mt-1">Total Bookings</p>
            </div>
          </div>

          <div class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all group">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-700 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div class="flex items-center justify-between relative z-10">
              <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">CUTOFF</span>
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm transition-transform group-hover:scale-110">
                <mat-icon class="!text-[22px]">schedule</mat-icon>
              </div>
            </div>
            <div class="mt-5 relative z-10">
              <p class="text-3xl font-black tracking-tight text-slate-900">{{ dashStats()?.todaysDeadline ?? '—' }}</p>
              <p class="text-xs font-semibold text-slate-500 mt-1">Today's Deadline</p>
            </div>
          </div>
        </div>

        <!-- ── Date Selector ── -->
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hy-animate" style="animation-delay:0.05s">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
            <div>
              <p class="text-sm font-bold text-slate-900">Date Navigator</p>
              <p class="text-xs text-slate-500 mt-0.5">Select a date to filter bookings and activity</p>
            </div>
            <label class="flex items-center gap-2 border border-slate-200 rounded-xl px-3 bg-white h-9 shadow-sm cursor-pointer hover:bg-slate-50 hover:text-brand-600 transition-colors text-xs font-semibold text-slate-600">
              <mat-icon class="!text-[16px]">calendar_month</mat-icon>
              Pick Date
              <input type="date" style="position:absolute;opacity:0;width:0;height:0;" [value]="selectedDate()" (change)="onDatePick($event)" />
            </label>
          </div>

          <div class="flex gap-2 overflow-x-auto p-5 pb-6">
            <ng-container *ngIf="dateStrip().length > 0">
              <button *ngFor="let d of dateStrip()"
                      (click)="selectDate(d.date)"
                      class="flex flex-col items-center justify-center min-w-[72px] py-2.5 px-3 rounded-xl border transition-all duration-300"
                      [ngClass]="d.date === selectedDate() ? 'bg-gradient-to-br from-brand-600 to-brand-800 border-transparent text-white shadow-md shadow-brand-500/20 scale-105' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'">
                <span class="text-[10px] font-bold uppercase tracking-wider" [ngClass]="d.date === selectedDate() ? 'opacity-80' : 'opacity-60'">{{ d.label }}</span>
                <span class="text-xl font-black leading-tight mt-0.5">{{ d.date | date:'d' }}</span>
                <span class="text-[10px] font-semibold" [ngClass]="d.date === selectedDate() ? 'opacity-80' : 'opacity-60'">{{ d.date | date:'MMM' }}</span>
                <span class="mt-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold" 
                      [ngClass]="d.date === selectedDate() ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'">{{ d.eventCount }} Events</span>
              </button>
            </ng-container>

            <ng-container *ngIf="dateStrip().length === 0">
              <button *ngFor="let d of fallbackStrip"
                      (click)="selectDate(d.date)"
                      class="flex flex-col items-center justify-center min-w-[72px] py-2.5 px-3 rounded-xl border transition-all duration-300"
                      [ngClass]="d.date === selectedDate() ? 'bg-gradient-to-br from-brand-600 to-brand-800 border-transparent text-white shadow-md shadow-brand-500/20 scale-105' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'">
                <span class="text-[10px] font-bold uppercase tracking-wider" [ngClass]="d.date === selectedDate() ? 'opacity-80' : 'opacity-60'">{{ d.label }}</span>
                <span class="text-xl font-black leading-tight mt-0.5">{{ d.date | date:'d' }}</span>
                <span class="text-[10px] font-semibold" [ngClass]="d.date === selectedDate() ? 'opacity-80' : 'opacity-60'">{{ d.date | date:'MMM' }}</span>
                <span class="mt-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold" 
                      [ngClass]="d.date === selectedDate() ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'">0 Events</span>
              </button>
            </ng-container>
          </div>
        </div>

        <!-- ── Office Locations Table ── -->
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hy-animate" style="animation-delay:0.1s">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
            <div>
              <p class="text-sm font-bold text-slate-900">Office Locations</p>
              <p class="text-xs text-slate-500 mt-0.5">Manage corporate offices — click a row to view facility activity</p>
            </div>
            <div class="flex items-center gap-2">
              <ng-container *ngIf="!showAddForm()">
                <button (click)="showAddForm.set(true)" class="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-700">
                  <span class="text-lg leading-none">+</span> Add Location
                </button>
              </ng-container>
              <ng-container *ngIf="showAddForm()">
                <input type="text" [(ngModel)]="newLocationName"
                       placeholder="e.g. Mumbai HQ"
                       class="h-9 w-40 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                       (keydown.enter)="addLocation()"
                       (keydown.escape)="cancelAdd()" />
                <button (click)="addLocation()" class="flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700">Save</button>
                <button (click)="cancelAdd()" class="flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              </ng-container>
            </div>
          </div>
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Office Location</th>
                <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Employee Count</th>
                <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let loc of locations()"
                  (click)="selectLocation(loc)"
                  class="border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  [class.bg-brand-50]="selectedLocation()?.id === loc.id">
                <td class="px-5 py-4 align-middle">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-sm font-bold text-white shadow-sm">
                      {{ loc.locationName.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-bold text-slate-900 text-sm">{{ loc.locationName }}</p>
                      <p class="text-[10px] font-semibold text-slate-400 mt-0.5">Click to view facility stats &rarr;</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 align-middle" (click)="$event.stopPropagation()">
                  <div class="flex items-center gap-3">
                    <ng-container *ngIf="editingLocationId() !== loc.id">
                      <span class="text-base font-black text-slate-900">{{ loc.employeeCount }}</span>
                      <button (click)="startEditCount(loc)" class="flex h-7 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-2.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 hover:bg-brand-100 transition-colors">Edit</button>
                    </ng-container>
                    <ng-container *ngIf="editingLocationId() === loc.id">
                      <input type="number" [(ngModel)]="editCountValue" min="0"
                             class="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
                             (keydown.enter)="saveCount(loc)"
                             (keydown.escape)="editingLocationId.set(null)" />
                      <button (click)="saveCount(loc)" class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm">&check;</button>
                      <button (click)="editingLocationId.set(null)" class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">&times;</button>
                    </ng-container>
                  </div>
                </td>
                <td class="px-5 py-4 align-middle text-right" (click)="$event.stopPropagation()">
                  <button (click)="deleteLocation(loc)" class="inline-flex h-8 items-center justify-center rounded-lg bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors">Remove</button>
                </td>
              </tr>
              <tr *ngIf="locations().length === 0">
                <td colspan="3" class="px-5 py-16 text-center">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <div class="text-4xl opacity-50 mb-2">🏢</div>
                    <p class="text-sm font-semibold text-slate-600">No office locations yet</p>
                    <p class="text-xs text-slate-400">Click "+ Add Location" to create your first office</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Facility Activity Panel ── -->
        <div *ngIf="selectedLocation() && locationStats()" class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hy-animate" style="animation-delay:0.05s">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
            <div>
              <p class="text-sm font-bold text-slate-900">
                Facility Activity — {{ selectedLocation()!.locationName }}
              </p>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ selectedDate() | date:'MMMM d, yyyy' }} · Counts increment when employees book
              </p>
            </div>
            <button class="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    (click)="selectedLocation.set(null); locationStats.set(null)"
                    title="Close">✕</button>
          </div>

          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100">
                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Facility</th>
                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Category</th>
                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Requested</th>
                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Acknowledged</th>
                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 min-w-[160px]">Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of locationStats()!.facilityStats" class="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-4 align-middle font-bold text-slate-900">{{ row.facilityName }}</td>
                  <td class="px-5 py-4 align-middle">
                    <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase">{{ row.category || '—' }}</span>
                  </td>
                  <td class="px-5 py-4 align-middle text-center">
                    <span class="text-base font-black text-brand-600">{{ row.totalRequested }}</span>
                  </td>
                  <td class="px-5 py-4 align-middle text-center">
                    <span class="text-base font-black text-emerald-600">{{ row.acknowledged }}</span>
                  </td>
                  <td class="px-5 py-4 align-middle">
                    <div class="flex items-center gap-3">
                      <div class="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" [style.width]="getProgressWidth(row)"></div>
                      </div>
                      <span class="w-8 text-right text-[10px] font-bold text-slate-500">{{ getProgressPct(row) }}%</span>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="locationStats()!.facilityStats.length === 0">
                  <td colspan="5" class="px-5 py-16 text-center">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <div class="text-4xl opacity-50 mb-2">📊</div>
                      <p class="text-sm font-semibold text-slate-600">No published facilities</p>
                      <p class="text-xs text-slate-400">Publish a facility to see it tracked here</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

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
