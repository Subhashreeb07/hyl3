import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { SessionService } from '../../../core/services/session.service';
import {
  DateEventCount,
  DashboardStatsResponse,
  LocationResponse,
  LocationStatsResponse,
  LocationApiService
} from '../../../core/services/location-api.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">

      <!-- ── Top bar ── -->
      <header class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Admin Console</p>
          <h1 class="text-xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  (click)="goFacilities()">Facilities</button>
          <button class="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
                  (click)="logout()">Logout</button>
        </div>
      </header>

      <div class="w-full px-[5vw] py-7 space-y-6">

        <!-- ── Date strip ── -->
        <section class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Select Date</h2>

            <!-- ── Modern Calendar Picker ── -->
            <div class="relative">
              <button (click)="toggleCalendar()"
                      class="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md">
                <span class="material-icons-outlined text-indigo-600 transition-colors group-hover:text-indigo-700" style="font-size:18px">calendar_month</span>
                <span>{{ selectedDate() | date:'MMM d, yyyy' }}</span>
                <span class="material-icons-outlined text-slate-400 transition-transform duration-200" [style.transform]="showCalendar() ? 'rotate(180deg)' : 'rotate(0deg)'" style="font-size:16px">keyboard_arrow_down</span>
              </button>

              <!-- Backdrop -->
              <div *ngIf="showCalendar()" (click)="showCalendar.set(false)" class="fixed inset-0 z-40"></div>

              <!-- Calendar Panel -->
              <div *ngIf="showCalendar()"
                   class="absolute right-0 top-12 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                   style="width:min(320px,calc(100vw - 100px));box-shadow:0 25px 50px -12px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.04);">

                <!-- Header -->
                <div class="flex items-center justify-between px-5 py-4"
                     style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e4d8c 100%)">
                  <button (click)="prevMonth(); $event.stopPropagation()"
                          class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white">
                    <span class="material-icons-outlined" style="font-size:20px">chevron_left</span>
                  </button>
                  <div class="text-center">
                    <p class="text-base font-bold tracking-tight text-white">{{ calendarMonthLabel() }}</p>
                  </div>
                  <button (click)="nextMonth(); $event.stopPropagation()"
                          class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white">
                    <span class="material-icons-outlined" style="font-size:20px">chevron_right</span>
                  </button>
                </div>

                <!-- Weekday Labels -->
                <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                  <span *ngFor="let wd of weekDayLabels"
                        class="py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ wd }}</span>
                </div>

                <!-- Days Grid -->
                <div class="grid grid-cols-7 gap-0.5 p-3">
                  <ng-container *ngFor="let cell of calendarDays()">
                    <div *ngIf="cell.date === null" class="h-9 w-full"></div>
                    <button *ngIf="cell.date !== null"
                            (click)="selectCalendarDate(cell.date); $event.stopPropagation()"
                            class="relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-150"
                            [ngClass]="{
                              'bg-slate-900 text-white shadow font-bold': cell.date === selectedDate(),
                              'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100': isToday(cell.date) && cell.date !== selectedDate(),
                              'text-slate-700 hover:bg-slate-100': !isToday(cell.date) && cell.date !== selectedDate()
                            }">
                      {{ cell.num }}
                      <span *ngIf="isToday(cell.date) && cell.date !== selectedDate()"
                            class="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-500"
                            style="transform:translateX(-50%)"></span>
                    </button>
                  </ng-container>
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <button (click)="selectToday(); $event.stopPropagation()"
                          class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700">
                    Today
                  </button>
                  <p class="text-xs font-medium text-slate-500">{{ selectedDate() | date:'EEE, MMM d' }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="flex w-full justify-between gap-3 overflow-x-auto pb-1">
            <button *ngFor="let d of dateStrip()"
                    (click)="selectDate(d.date)"
                    class="flex flex-1 flex-col items-center rounded-xl px-4 py-3 text-center transition-all min-w-[80px]"
                    [class.bg-slate-900]="d.date === selectedDate()"
                    [class.text-white]="d.date === selectedDate()"
                    [class.shadow-md]="d.date === selectedDate()"
                    [class.bg-slate-50]="d.date !== selectedDate()"
                    [class.text-slate-700]="d.date !== selectedDate()">
              <span class="text-xs font-semibold">{{ d.label }}</span>
              <span class="mt-0.5 text-2xl font-bold">{{ d.date | date:'d' }}</span>
              <span class="mt-0.5 text-xs">{{ d.date | date:'MMM' }}</span>
              <span class="mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    [class.bg-slate-700]="d.date === selectedDate()"
                    [class.text-white]="d.date === selectedDate()"
                    [class.bg-slate-200]="d.date !== selectedDate()"
                    [class.text-slate-600]="d.date !== selectedDate()">
                {{ d.eventCount }} Published
              </span>
            </button>
            <ng-container *ngIf="dateStrip().length === 0">
              <button *ngFor="let d of fallbackStrip"
                      (click)="selectDate(d.date)"
                      class="flex flex-1 flex-col items-center rounded-xl px-4 py-3 text-center transition-all min-w-[80px]"
                      [class.bg-slate-900]="d.date === selectedDate()"
                      [class.text-white]="d.date === selectedDate()"
                      [class.bg-slate-50]="d.date !== selectedDate()"
                      [class.text-slate-700]="d.date !== selectedDate()">
                <span class="text-xs font-semibold">{{ d.label }}</span>
                <span class="mt-0.5 text-2xl font-bold">{{ d.date | date:'d' }}</span>
                <span class="mt-0.5 text-xs">{{ d.date | date:'MMM' }}</span>
                <span class="mt-1.5 rounded-full bg-slate-200 text-slate-600 px-2 py-0.5 text-[10px] font-bold">0 Published</span>
              </button>
            </ng-container>
          </div>
        </section>


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
                        class="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-colors">
                  + Add Location
                </button>
              </ng-container>
              <ng-container *ngIf="showAddForm()">
                <input type="text" [(ngModel)]="newLocationName" placeholder="e.g. Mumbai"
                       class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-brand-400"
                       (keydown.enter)="addLocation()" (keydown.escape)="cancelAdd()" />
                <button (click)="addLocation()" class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-colors">Save</button>
                <button (click)="cancelAdd()" class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500">Cancel</button>
              </ng-container>
            </div>
          </div>

          <div class="overflow-x-auto w-full">
            <table class="min-w-full text-sm">
              <thead class="data-table-header">
              <tr>
                <th class="px-6 py-3 font-semibold">Office Location</th>
                <th class="px-6 py-3 font-semibold">Employee Count</th>
                <th class="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let loc of locations()"
                  class="data-table-row cursor-pointer"
                  [class.bg-brand-50]="selectedLocation()?.id === loc.id"
                  (click)="selectLocation(loc)">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-800">
                      {{ loc.locationName.charAt(0) }}
                    </span>
                    <div>
                      <p class="font-semibold text-slate-800">{{ loc.locationName }}</p>
                      <p class="text-[11px] text-slate-400">Click to view facility stats</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4" (click)="$event.stopPropagation()">
                  <span class="text-lg font-bold text-slate-700">{{ loc.employeeCount }}</span>
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
          </div>
        </section>

        <!-- ── Facility stats for selected location ── -->
        <section *ngIf="selectedLocation() && locationStats()" class="rounded-2xl bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 class="text-base font-bold text-slate-900">
                Facility Activity - {{ selectedLocation()!.locationName }}
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ selectedDate() | date:'mediumDate' }}
              </p>
            </div>
            <button (click)="selectedLocation.set(null); locationStats.set(null)"
                    class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
              <span class="material-icons-outlined" style="font-size:18px">close</span>
            </button>
          </div>

          <div class="overflow-x-auto w-full">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-6 py-3">Facility</th>
                <th class="px-6 py-3">Category</th>
                <th class="px-6 py-3 text-center">Total Requested</th>
                <th class="px-6 py-3 text-center">Acknowledged</th>
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
                <td colspan="5" class="px-6 py-10 text-center text-slate-400 text-sm">
                  No bookings found for this location on the selected date.
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  `
})
export class AdminDashboardPageComponent implements OnInit {

  selectedDate  = signal<string>(this.today());
  dateStrip     = signal<DateEventCount[]>([]);
  dashStats     = signal<DashboardStatsResponse | null>(null);

  readonly fallbackStrip = this.buildFallbackStrip();

  locations        = signal<LocationResponse[]>([]);
  selectedLocation = signal<LocationResponse | null>(null);
  locationStats    = signal<LocationStatsResponse | null>(null);

  showAddForm     = signal(false);
  newLocationName = '';

  editingLocationId = signal<number | null>(null);
  editCountValue    = 0;

  // ── Custom Calendar Picker ────────────────────────────────────────────────
  readonly weekDayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  showCalendar      = signal(false);
  calendarViewYear  = signal(new Date().getFullYear());
  calendarViewMonth = signal(new Date().getMonth());

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

  getProgressWidth(row: { totalRequested: number; acknowledged: number }): string {
    if (!row.totalRequested) return '0%';
    return Math.round((row.acknowledged / row.totalRequested) * 100) + '%';
  }

  getProgressPct(row: { totalRequested: number; acknowledged: number }): number {
    if (!row.totalRequested) return 0;
    return Math.round((row.acknowledged / row.totalRequested) * 100);
  }

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

  // ── Calendar Picker Methods ───────────────────────────────────────────────

  toggleCalendar(): void {
    if (!this.showCalendar()) {
      const d = new Date(this.selectedDate() + 'T00:00:00');
      this.calendarViewYear.set(d.getFullYear());
      this.calendarViewMonth.set(d.getMonth());
    }
    this.showCalendar.update(v => !v);
  }

  prevMonth(): void {
    if (this.calendarViewMonth() === 0) { this.calendarViewMonth.set(11); this.calendarViewYear.update(y => y - 1); }
    else { this.calendarViewMonth.update(m => m - 1); }
  }

  nextMonth(): void {
    if (this.calendarViewMonth() === 11) { this.calendarViewMonth.set(0); this.calendarViewYear.update(y => y + 1); }
    else { this.calendarViewMonth.update(m => m + 1); }
  }

  calendarMonthLabel(): string {
    return new Date(this.calendarViewYear(), this.calendarViewMonth(), 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  calendarDays(): Array<{ date: string | null; num: number | null }> {
    const year  = this.calendarViewYear();
    const month = this.calendarViewMonth();
    const firstDay   = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ date: string | null; num: number | null }> = [];
    for (let i = 0; i < firstDay; i++) { days.push({ date: null, num: null }); }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        num: d
      });
    }
    return days;
  }

  selectCalendarDate(date: string): void {
    this.selectDate(date);
    this.showCalendar.set(false);
  }

  selectToday(): void {
    const d = new Date();
    this.calendarViewYear.set(d.getFullYear());
    this.calendarViewMonth.set(d.getMonth());
    this.selectCalendarDate(this.today());
  }

  isToday(date: string): boolean { return date === this.today(); }

  goFacilities(): void { this.router.navigateByUrl('/admin/facilities'); }

  async logout(): Promise<void> {
    const token = this.sessionService.getToken();
    if (token) { try { await firstValueFrom(this.authApi.logout(token)); } catch { /* ignore */ } }
    this.sessionService.clear();
    this.router.navigateByUrl('/login');
  }
}
