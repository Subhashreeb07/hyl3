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
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6cbd]">Hyland Employee Workspace</p>
          <p class="mt-1 text-3xl font-semibold text-slate-900 md:text-4xl">Daily Service Dashboard</p>
        </div>
        <div class="flex flex-wrap gap-2 text-sm">
          <button class="satori-secondary" (click)="goHistory()">Booking Records</button>
          <button class="satori-secondary" (click)="goNotifications()">
            Notifications
            <span *ngIf="unreadNotifications() > 0" class="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">{{ unreadNotifications() }}</span>
          </button>
          <button class="satori-secondary" (click)="goProfile()">Profile</button>
        </div>
      </header>

      <!-- CALENDAR DATE SELECTOR -->
      <section class="portal-panel overflow-hidden p-0">
        <div class="border-b border-slate-100 bg-gradient-to-r from-[#eef6ff] to-white px-6 py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6cbd]">Select a date to view available services</p>
              <h2 class="mt-0.5 text-xl font-semibold text-slate-900">{{ calendarMonthLabel() }}</h2>
            </div>
            <div class="flex items-center gap-2">
              <button class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" (click)="prevMonth()">‹</button>
              <button class="rounded-full border border-[#0f6cbd] px-3 py-1 text-xs font-semibold text-[#0f6cbd] hover:bg-[#eef6ff]" (click)="goToToday()">Today</button>
              <button class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" (click)="nextMonth()">›</button>
            </div>
          </div>
        </div>

        <div class="p-5">
          <!-- Weekday headers -->
          <div class="mb-2 grid grid-cols-7 text-center">
            <div *ngFor="let d of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" class="py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{{ d }}</div>
          </div>

          <!-- Calendar grid -->
          <div class="grid grid-cols-7 gap-1">
            <button
              *ngFor="let cell of calendarCells()"
              [disabled]="!cell.date || cell.isPast"
              (click)="cell.date && !cell.isPast && selectDate(cell.isoDate)"
              class="relative flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition"
              [ngClass]="{
                'text-transparent cursor-default': !cell.date,
                'text-slate-300 cursor-not-allowed': cell.date && cell.isPast,
                'bg-[#0f6cbd] text-white shadow-md': cell.isoDate === selectedDate(),
                'bg-[#edf5ff] text-[#0f6cbd] font-bold ring-2 ring-[#0f6cbd]/30': cell.isToday && cell.isoDate !== selectedDate(),
                'text-slate-700 hover:bg-slate-100': cell.date && !cell.isPast && cell.isoDate !== selectedDate() && !cell.isToday
              }"
            >
              {{ cell.date || '' }}
              <span *ngIf="cell.isToday && cell.isoDate !== selectedDate()" class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0f6cbd]"></span>
            </button>
          </div>
        </div>

        <div *ngIf="selectedDate()" class="border-t border-slate-100 bg-slate-50 px-6 py-3">
          <p class="text-sm text-slate-600">
            Showing services available for
            <strong class="text-slate-900">{{ selectedDate() | date: 'EEEE, MMMM d, y' }}</strong>
          </p>
        </div>
      </section>

      <!-- AVAILABLE SERVICES FOR SELECTED DATE -->
      <section *ngIf="selectedDate()">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">
            Available Services
            <span class="ml-2 rounded-full bg-[#edf5ff] px-2.5 py-0.5 text-sm text-[#0f6cbd]">{{ availableFacilities().length }}</span>
          </h2>
          <button class="text-sm font-semibold text-[#0f6cbd]" (click)="loadAvailableForDate(selectedDate()!)">Refresh</button>
        </div>

        <!-- Loading -->
        <div *ngIf="loadingFacilities()" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          Loading available services...
        </div>

        <!-- No services -->
        <div *ngIf="!loadingFacilities() && availableFacilities().length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p class="text-sm font-medium text-slate-600">No published services found.</p>
          <p class="mt-1 text-xs text-slate-500">Contact an administrator to publish facility configurations.</p>
        </div>

        <!-- Service cards -->
        <div *ngIf="!loadingFacilities() && availableFacilities().length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article
            *ngFor="let facility of availableFacilities()"
            class="group rounded-2xl border bg-white p-5 shadow-sm transition"
            [ngClass]="{
              'border-emerald-200 bg-emerald-50/30': facility.alreadyBooked,
              'border-slate-200 hover:shadow-md': !facility.alreadyBooked && facility.bookingAllowed,
              'border-slate-100 bg-slate-50/50 opacity-70': !facility.bookingAllowed
            }"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef4fb] text-xl">{{ iconEmoji(facility.icon || '') }}</span>
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ facility.facilityName }}</p>
                  <p class="text-xs text-slate-500">{{ facility.category || 'Service' }}</p>
                </div>
              </div>
              <span
                class="rounded-full px-2 py-1 text-[10px] font-semibold"
                [ngClass]="{
                  'bg-emerald-100 text-emerald-700': facility.alreadyBooked,
                  'bg-[#edf5ff] text-[#0f6cbd]': !facility.alreadyBooked && facility.bookingAllowed,
                  'bg-slate-100 text-slate-500': !facility.bookingAllowed
                }"
              >
                {{ facility.alreadyBooked ? '✓ Booked' : (facility.bookingAllowed ? 'Available' : 'Unavailable') }}
              </span>
            </div>

            <p *ngIf="facility.description" class="mt-3 text-xs text-slate-500 line-clamp-2">{{ facility.description }}</p>

            <!-- Booking window (start → deadline) -->
            <div *ngIf="facility.bookingStartTime || facility.bookingDeadline" class="mt-3 flex items-center gap-1.5 text-xs"
              [ngClass]="facility.bookingAllowed ? 'text-emerald-700' : 'text-slate-500'">
              <span>🕐</span>
              <span>Booking window:
                {{ facility.bookingStartTime || '00:00' }} – {{ facility.bookingDeadline || '23:59' }}
              </span>
            </div>

            <!-- Unavailable reason -->
            <div *ngIf="!facility.bookingAllowed && facility.unavailableReason" class="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
              <span>🚫</span>
              <span>{{ facility.unavailableReason }}</span>
            </div>

            <div class="mt-4 flex gap-2">
              <button
                *ngIf="!facility.alreadyBooked && facility.bookingAllowed"
                class="flex-1 rounded-xl bg-[#0f6cbd] py-2 text-sm font-semibold text-white transition hover:bg-[#0d5aa7]"
                (click)="bookFacility(facility)"
              >
                Book Now
              </button>
              <button
                *ngIf="facility.alreadyBooked && facility.bookingId"
                class="flex-1 rounded-xl border border-emerald-300 bg-white py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                (click)="viewBooking(facility.bookingId!)"
              >
                View Booking
              </button>
              <button
                *ngIf="facility.alreadyBooked"
                class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                (click)="bookFacility(facility)"
              >
                Book Again
              </button>
              <div *ngIf="!facility.bookingAllowed && !facility.alreadyBooked" class="flex-1 rounded-xl border border-slate-200 py-2 text-center text-sm text-slate-400">
                Not bookable
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Default state (no date selected) -->
      <section *ngIf="!selectedDate()" class="rounded-2xl border-2 border-dashed border-[#d9e5f2] bg-[#f7fbff] p-10 text-center">
        <p class="text-2xl">📅</p>
        <p class="mt-3 text-sm font-semibold text-slate-700">Select a date on the calendar above</p>
        <p class="mt-1 text-xs text-slate-500">Available services for that date will appear here</p>
      </section>

      <!-- RECENT BOOKINGS -->
      <section class="portal-panel p-6" *ngIf="bookingEvents().length > 0">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">Recent Bookings</h2>
          <button class="text-sm font-semibold text-[#0f6cbd]" (click)="goHistory()">View all</button>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <article *ngFor="let event of bookingEvents().slice(0, 4)" class="rounded-2xl border border-slate-200 bg-white p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ event.facility }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ event.bookingDate }}</p>
              </div>
              <span class="rounded-full px-2 py-1 text-[10px] font-semibold"
                [ngClass]="event.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : event.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'">
                {{ event.status }}
              </span>
            </div>
            <button class="mt-2 text-xs font-semibold text-[#0f6cbd]" (click)="openBooking(event.bookingId)">View Details</button>
          </article>
        </div>
      </section>
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

  readonly calendarCells = computed(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date: number | null; isoDate: string; isToday: boolean; isPast: boolean }[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ date: null, isoDate: '', isToday: false, isPast: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        date: d,
        isoDate: iso,
        isToday: cellDate.getTime() === today.getTime(),
        isPast: cellDate.getTime() < today.getTime()
      });
    }
    return cells;
  });

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

  // ─── Helpers ──────────────────────────────────────────────────────────────

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
