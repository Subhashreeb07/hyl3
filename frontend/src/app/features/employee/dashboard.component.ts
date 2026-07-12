import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AvailableFacility, BookingHistoryItem, DashboardFacility } from '../../core/models/employee-flow.models';
import { BookingApiService } from '../../core/services/booking-api.service';
import { EmployeeApiService } from '../../core/services/employee-api.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mx-auto w-full max-w-[1320px] space-y-6">
      <!-- Dashboard Title Block -->
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Hyland Employee Workspace</p>
          <p class="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Daily Service Dashboard</p>
        </div>
        <div class="flex flex-wrap gap-2 text-sm">
          <button class="satori-secondary border border-slate-200 hover:bg-slate-50 rounded-md" (click)="goHistory()">Booking Records</button>
          <button class="satori-secondary border border-slate-200 hover:bg-slate-50 rounded-md" (click)="goNotifications()">
            Notifications
            <span *ngIf="unreadNotifications() > 0" class="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white font-bold">{{ unreadNotifications() }}</span>
          </button>
          <button class="satori-secondary border border-slate-200 hover:bg-slate-50 rounded-md" (click)="goProfile()">Profile</button>
        </div>
      </header>

      <!-- Main Layout Grid: Sidebar + Main Column -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <!-- Left Sidebar: Calendar & Recent Bookings -->
        <div class="space-y-6 lg:col-span-1">
          <!-- CALENDAR DATE SELECTOR -->
          <section class="border border-slate-200 bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Select Date</p>
                  <div class="flex items-center gap-1 mt-0.5">
                    <select [value]="calendarMonth()" (change)="onMonthChange($event)" class="bg-transparent border-0 font-semibold text-slate-800 focus:ring-0 focus:outline-none cursor-pointer text-sm p-0 pr-4">
                      <option *ngFor="let m of monthsList; let idx = index" [value]="idx" [selected]="idx === calendarMonth()">{{ m }}</option>
                    </select>
                    <select [value]="calendarYear()" (change)="onYearChange($event)" class="bg-transparent border-0 font-semibold text-slate-800 focus:ring-0 focus:outline-none cursor-pointer text-sm p-0">
                      <option *ngFor="let y of yearsList()" [value]="y" [selected]="y === calendarYear()">{{ y }}</option>
                    </select>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button class="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 transition" (click)="prevMonth()" aria-label="Previous Month">‹</button>
                  <button class="rounded-full border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition" (click)="goToToday()">Today</button>
                  <button class="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 transition" (click)="nextMonth()" aria-label="Next Month">›</button>
                </div>
              </div>
            </div>

            <div class="p-3 bg-white">
              <!-- Weekday headers -->
              <div class="mb-1.5 grid grid-cols-7 text-center">
                <div *ngFor="let d of ['S','M','T','W','T','F','S']" class="py-1 text-[10px] font-medium text-slate-400">{{ d }}</div>
              </div>

              <!-- Calendar grid -->
              <div class="grid grid-cols-7 gap-1">
                <button
                  *ngFor="let cell of calendarCells()"
                  [disabled]="!cell.date || cell.isPast"
                  (click)="cell.date && !cell.isPast && selectDate(cell.isoDate)"
                  class="relative flex h-8 w-8 mx-auto items-center justify-center rounded-full text-xs font-semibold transition-all duration-150"
                  [ngClass]="{
                    'text-transparent cursor-default': !cell.date,
                    'text-slate-300 cursor-not-allowed': cell.date && cell.isPast,
                    'bg-slate-900 text-white shadow-sm font-bold scale-105': cell.isoDate === selectedDate(),
                    'border border-slate-900 text-slate-900 font-bold': cell.isToday && cell.isoDate !== selectedDate(),
                    'text-slate-700 hover:bg-slate-100': cell.date && !cell.isPast && cell.isoDate !== selectedDate() && !cell.isToday
                  }"
                >
                  {{ cell.date || '' }}
                  
                  <!-- Today dot indicator (when not selected) -->
                  <span *ngIf="cell.isToday && cell.isoDate !== selectedDate()" class="absolute bottom-1 w-1 h-1 rounded-full bg-slate-950"></span>
                  
                  <!-- Booking dot indicator -->
                  <span *ngIf="cell.hasBooking" class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white animate-pulse"></span>
                </button>
              </div>
            </div>

            <div *ngIf="selectedDate()" class="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
              <p class="text-xs text-slate-600">
                Selected: <strong class="text-slate-900">{{ formatLocalDate(selectedDate()) | date: 'MMM d, y' }}</strong>
              </p>
            </div>
          </section>

          <!-- RECENT BOOKINGS -->
          <section class="border border-slate-200 bg-white shadow-sm rounded-lg p-4" *ngIf="bookingEvents().length > 0">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-slate-900">Bookings on this Date</h2>
              <button class="text-xs font-semibold text-slate-500 hover:text-slate-900" (click)="goHistory()">View all</button>
            </div>
            <div class="space-y-2.5">
              <div *ngIf="bookingsForSelectedDate().length === 0" class="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md bg-slate-50/50">
                No bookings for this date.
              </div>
              <article *ngFor="let event of bookingsForSelectedDate()" class="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-sm">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-semibold text-slate-900">{{ event.facility }}</p>
                    <p class="mt-0.5 text-[10px] text-slate-500">{{ formatLocalDate(event.bookingDate) | date: 'MMM d, y' }}</p>
                  </div>
                  <span class="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    [ngClass]="event.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : event.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-700 border border-slate-200'">
                    {{ event.status }}
                  </span>
                </div>
                <div class="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                  <button class="font-semibold text-slate-600 hover:text-slate-900" (click)="openBooking(event.bookingId)">View Details</button>
                </div>
              </article>
            </div>
          </section>
        </div>

        <!-- Right Main Column: Available Services -->
        <div class="space-y-6 lg:col-span-2">
          
          <!-- AVAILABLE SERVICES FOR SELECTED DATE -->
          <section *ngIf="selectedDate()">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">
                  Available Services
                  <span class="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 border border-slate-200">{{ availableFacilities().length }}</span>
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">Showing services for {{ formatLocalDate(selectedDate()) | date: 'EEEE, MMMM d, y' }}</p>
              </div>
              <button class="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition" (click)="loadAvailableForDate(selectedDate()!)">
                Refresh
              </button>
            </div>

            <!-- Loading -->
            <div *ngIf="loadingFacilities()" class="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center text-sm text-slate-500">
              Loading available services...
            </div>

            <!-- No services -->
            <div *ngIf="!loadingFacilities() && availableFacilities().length === 0" class="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
              <p class="text-sm font-medium text-slate-600">No published services found.</p>
              <p class="mt-1 text-xs text-slate-500">Contact an administrator to publish facility configurations.</p>
            </div>

            <!-- Service cards -->
            <div *ngIf="!loadingFacilities() && availableFacilities().length > 0" class="grid gap-4 md:grid-cols-2">
              <article
                *ngFor="let facility of availableFacilities()"
                class="group rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md border-slate-200"
                [ngClass]="{
                  'border-emerald-200 bg-emerald-50/10': facility.alreadyBooked
                }"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-lg border border-slate-200">{{ iconEmoji(facility.icon || '') }}</span>
                    <div>
                      <h3 class="text-sm font-semibold text-slate-900">{{ facility.facilityName }}</h3>
                      <p class="text-xs text-slate-500">{{ facility.category || 'Service' }}</p>
                    </div>
                  </div>
                  <span
                    class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-emerald-100 text-emerald-700 border border-emerald-200': facility.alreadyBooked,
                      'bg-slate-100 text-slate-700 border border-slate-200': !facility.alreadyBooked && facility.bookingAllowed,
                      'bg-rose-50 text-rose-700 border border-rose-200': !facility.bookingAllowed
                    }"
                  >
                    {{ facility.alreadyBooked ? 'Booked' : (facility.bookingAllowed ? 'Available' : 'Unavailable') }}
                  </span>
                </div>

                <p *ngIf="facility.description" class="mt-2.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">{{ facility.description }}</p>

                <!-- Booking window -->
                <div *ngIf="facility.bookingStartTime || facility.bookingDeadline" class="mt-2.5 flex items-center gap-1 text-[11px]"
                  [ngClass]="facility.bookingAllowed ? 'text-emerald-700' : 'text-slate-500'">
                  <span>🕐</span>
                  <span>Booking window:
                    {{ facility.bookingStartTime || '00:00' }} – {{ facility.bookingDeadline || '23:59' }}
                  </span>
                </div>

                <!-- Unavailable reason -->
                <div *ngIf="!facility.bookingAllowed && facility.unavailableReason" class="mt-2.5 flex items-center gap-1.5 rounded bg-rose-50/50 px-2 py-1.5 text-[11px] text-rose-700 border border-rose-100">
                  <span>🚫</span>
                  <span>{{ facility.unavailableReason }}</span>
                </div>

                <div class="mt-3.5 flex gap-2">
                  <button
                    *ngIf="!facility.alreadyBooked && facility.bookingAllowed"
                    class="flex-1 rounded-md bg-slate-900 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    (click)="bookFacility(facility)"
                  >
                    Book Now
                  </button>
                  <button
                    *ngIf="facility.alreadyBooked && facility.bookingId"
                    class="flex-1 rounded-md border border-emerald-300 bg-white py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    (click)="viewBooking(facility.bookingId!)"
                  >
                    View Booking
                  </button>
                  <button
                    *ngIf="facility.alreadyBooked"
                    class="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    (click)="bookFacility(facility)"
                  >
                    Book Again
                  </button>
                  <div *ngIf="!facility.bookingAllowed && !facility.alreadyBooked" class="flex-1 rounded-md border border-slate-100 bg-slate-50/50 py-2 text-center text-xs text-slate-400">
                    Not bookable
                  </div>
                </div>
              </article>
            </div>
          </section>

          <!-- Default state -->
          <section *ngIf="!selectedDate()" class="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
            <p class="text-xl">📅</p>
            <p class="mt-2.5 text-sm font-semibold text-slate-700">Select a date on the calendar</p>
            <p class="mt-0.5 text-xs text-slate-500">Available services for that date will appear here</p>
          </section>
        </div>

      </div>
    </section>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Calendar state
  readonly selectedDate = signal<string | null>(null);
  readonly calendarYear = signal(new Date().getFullYear());
  readonly calendarMonth = signal(new Date().getMonth()); // 0-based

  // Available facilities for selected date
  readonly availableFacilities = signal<AvailableFacility[]>([]);
  readonly loadingFacilities = signal(false);

  // Other dashboard state
  readonly facilities = signal<DashboardFacility[]>([]);
  readonly bookingEvents = signal<BookingHistoryItem[]>([]);
  readonly unreadNotifications = signal(0);
  readonly bookingCount = signal(0);

  private readonly destroy$ = new Subject<void>();

  readonly calendarMonthLabel = computed(() => {
    const d = new Date(this.calendarYear(), this.calendarMonth(), 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly bookingsForSelectedDate = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return [];
    return this.bookingEvents().filter(event => event.bookingDate === selected);
  });

  readonly monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  readonly yearsList = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear + i);
  });

  readonly calendarCells = computed(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const bookings = this.bookingEvents() || [];

    const cells: { date: number | null; isoDate: string; isToday: boolean; isPast: boolean; hasBooking: boolean }[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ date: null, isoDate: '', isToday: false, isPast: false, hasBooking: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayHasBooking = bookings.some(b => b.bookingDate === iso && b.status === 'CONFIRMED');

      cells.push({
        date: d,
        isoDate: iso,
        isToday: cellDate.getTime() === today.getTime(),
        isPast: cellDate.getTime() < today.getTime(),
        hasBooking: dayHasBooking
      });
    }
    return cells;
  });

  onMonthChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement).value;
    this.calendarMonth.set(value);
  }

  onYearChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement).value;
    this.calendarYear.set(value);
  }

  constructor(
    private readonly bookingApi: BookingApiService,
    private readonly employeeApi: EmployeeApiService,
    public readonly sessionService: SessionService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.sessionService.getEmployeeId()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadNotifications();
    this.loadEngagementSummary();

    // Auto-select today
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.selectedDate.set(iso);
    this.loadAvailableForDate(iso);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Calendar navigation ──────────────────────────────────────────────────

  prevMonth(): void {
    if (this.calendarMonth() === 0) {
      this.calendarMonth.set(11);
      this.calendarYear.update(y => y - 1);
    } else {
      this.calendarMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.calendarMonth() === 11) {
      this.calendarMonth.set(0);
      this.calendarYear.update(y => y + 1);
    } else {
      this.calendarMonth.update(m => m + 1);
    }
  }

  goToToday(): void {
    const today = new Date();
    this.calendarYear.set(today.getFullYear());
    this.calendarMonth.set(today.getMonth());
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.selectDate(iso);
  }

  selectDate(iso: string): void {
    this.selectedDate.set(iso);
    this.loadAvailableForDate(iso);
  }

  // ─── Facilities for date ──────────────────────────────────────────────────

  loadAvailableForDate(date: string): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId || !date) return;

    this.loadingFacilities.set(true);
    this.availableFacilities.set([]);

    this.employeeApi.getAvailableFacilitiesForDate(employeeId, date).subscribe({
      next: (facilities) => {
        this.availableFacilities.set(facilities);
        this.loadingFacilities.set(false);
      },
      error: () => {
        this.availableFacilities.set([]);
        this.loadingFacilities.set(false);
        this.toastService.show('Could not load available services for this date.', 'error');
      }
    });
  }

  bookFacility(facility: AvailableFacility): void {
    this.router.navigate(['/employee/facility', facility.facilityId, 'book'], {
      queryParams: { date: this.selectedDate() }
    });
  }

  viewBooking(bookingId: string): void {
    this.router.navigate(['/employee/bookings', bookingId]);
  }

  openBooking(bookingId: number): void {
    this.router.navigate(['/employee/bookings', bookingId]);
  }

  // ─── Notifications / history ──────────────────────────────────────────────

  loadNotifications(): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) return;

    this.employeeApi.getEmployeeNotifications(employeeId).subscribe({
      next: (response) => {
        const unread = (response.items ?? []).filter((item) => {
          const status = (item.statusCode ?? '').toUpperCase();
          return status !== 'READ' && status !== 'CANCELLED';
        }).length;
        this.unreadNotifications.set(unread);
      },
      error: () => {}
    });
  }

  private loadEngagementSummary(): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) return;

    this.bookingApi.getBookingHistory(employeeId).subscribe({
      next: (history) => {
        this.bookingCount.set(history.length ?? 0);
        this.bookingEvents.set((history ?? []).slice(0, 6));
      },
      error: () => {
        this.bookingCount.set(0);
        this.bookingEvents.set([]);
      }
    });
  }

  formatLocalDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const parts = iso.split('-');
    if (parts.length !== 3) return null;
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  iconEmoji(icon: string): string {
    const value = (icon ?? '').toLowerCase();
    if (value.includes('utensils') || value.includes('restaurant') || value.includes('lunch') || value.includes('food')) return '🍽️';
    if (value.includes('bus') || value.includes('cab') || value.includes('transport')) return '🚌';
    if (value.includes('parking') || value.includes('car')) return '🚗';
    if (value.includes('calendar')) return '📅';
    if (value.includes('meeting') || value.includes('room')) return '🏛️';
    if (value.includes('badge') || value.includes('visitor')) return '🪪';
    return '🏢';
  }

  goHistory(): void { this.router.navigateByUrl('/employee/history'); }
  goProfile(): void { this.router.navigateByUrl('/employee/profile'); }
  goNotifications(): void { this.router.navigateByUrl('/employee/notifications'); }
}
