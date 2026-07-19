import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminBookingSearchItem } from '../../../core/models/admin.models';

type BookingViewMode = 'DAY_WISE' | 'OVERALL';

@Component({
  selector: 'app-admin-facility-bookings-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="flex flex-col gap-6">
      <section class="flex flex-wrap items-center gap-3">
        <button (click)="goBack()"
                class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          <mat-icon class="!text-[18px]">arrow_back</mat-icon> Back
        </button>
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold text-slate-900 truncate">{{ facilityName() }} - Bookings</h2>
          <p class="text-sm text-slate-500">Day-wise registrations and overall booking history for this facility</p>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Registration View</p>
            <p class="text-sm text-slate-500">Switch between day-wise and overall sheet view.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                    [class.border-slate-300]="viewMode() === 'DAY_WISE'"
                    [class.bg-slate-900]="viewMode() === 'DAY_WISE'"
                    [class.text-white]="viewMode() === 'DAY_WISE'"
                    [class.border-slate-200]="viewMode() !== 'DAY_WISE'"
                    [class.bg-white]="viewMode() !== 'DAY_WISE'"
                    [class.text-slate-600]="viewMode() !== 'DAY_WISE'"
                    (click)="setViewMode('DAY_WISE')">Day Wise</button>
            <button type="button" class="rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                    [class.border-slate-300]="viewMode() === 'OVERALL'"
                    [class.bg-slate-900]="viewMode() === 'OVERALL'"
                    [class.text-white]="viewMode() === 'OVERALL'"
                    [class.border-slate-200]="viewMode() !== 'OVERALL'"
                    [class.bg-white]="viewMode() !== 'OVERALL'"
                    [class.text-slate-600]="viewMode() !== 'OVERALL'"
                    (click)="setViewMode('OVERALL')">Overall</button>
          </div>
        </div>
      </section>

      <section *ngIf="viewMode() === 'DAY_WISE' && !loading() && bookings().length > 0" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap gap-2">
          <button *ngFor="let day of dayBuckets()" type="button"
                  class="rounded-xl border px-4 py-3 text-left transition-all"
                  [class.border-slate-900]="selectedDayKey() === day.key"
                  [class.bg-slate-900]="selectedDayKey() === day.key"
                  [class.text-white]="selectedDayKey() === day.key"
                  [class.border-slate-200]="selectedDayKey() !== day.key"
                  [class.bg-slate-50]="selectedDayKey() !== day.key"
                  [class.text-slate-700]="selectedDayKey() !== day.key"
                  (click)="selectDay(day.key)">
            <p class="text-[11px] font-bold uppercase tracking-wider" [class.text-slate-300]="selectedDayKey() === day.key" [class.text-slate-500]="selectedDayKey() !== day.key">{{ day.label }}</p>
            <p class="text-xl font-bold">{{ day.count }}</p>
            <p class="text-[11px]" [class.text-slate-400]="selectedDayKey() !== day.key" [class.text-slate-200]="selectedDayKey() === day.key">{{ day.dateLabel }}</p>
          </button>
        </div>
      </section>

      <div *ngIf="!loading() && bookings().length > 0" class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-[120px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
          <p class="text-2xl font-bold text-slate-800">{{ bookings().length }}</p>
          <p class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total</p>
        </div>
        <div class="flex-1 min-w-[120px] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
          <p class="text-2xl font-bold text-emerald-700">{{ countByStatus('CONFIRMED') }}</p>
          <p class="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">Confirmed</p>
        </div>
        <div class="flex-1 min-w-[120px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
          <p class="text-2xl font-bold text-amber-700">{{ countByStatus('PENDING') }}</p>
          <p class="text-[11px] uppercase tracking-wider text-amber-600 font-semibold">Pending</p>
        </div>
        <div class="flex-1 min-w-[120px] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
          <p class="text-2xl font-bold text-rose-700">{{ countByStatus('CANCELLED') }}</p>
          <p class="text-[11px] uppercase tracking-wider text-rose-600 font-semibold">Cancelled</p>
        </div>
      </div>

      <div *ngIf="loading()" class="flex flex-col items-center justify-center py-20 gap-3">
        <mat-icon class="animate-spin !text-[40px] !h-10 !w-10 text-brand-400">refresh</mat-icon>
        <p class="text-slate-500 text-sm">Loading bookings...</p>
      </div>

      <div *ngIf="!loading() && bookings().length === 0"
           class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 gap-4 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <mat-icon class="!text-[32px] !h-8 !w-8 text-slate-300">event_busy</mat-icon>
        </div>
        <div>
          <p class="text-slate-700 font-semibold">No bookings yet</p>
          <p class="text-slate-400 text-sm mt-1">No employees have booked this facility.</p>
        </div>
      </div>

      <div *ngIf="!loading() && bookings().length > 0 && viewMode() === 'DAY_WISE'" class="space-y-4">
        <section *ngFor="let day of dayBuckets()" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">{{ day.label }}</p>
              <h3 class="text-lg font-bold text-slate-900">{{ day.dateLabel }}</h3>
            </div>
            <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">{{ day.count }} registrations</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse text-sm">
              <thead class="bg-slate-50">
                <tr class="border-b border-slate-200">
                  <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Department</th>
                  <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Booking Date</th>
                  <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Created At</th>
                  <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Cancelled At</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="groupedBookings(day.key).length === 0">
                  <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">No registrations for this date.</td>
                </tr>
                <tr *ngFor="let b of groupedBookings(day.key); let odd = odd"
                    [class.bg-slate-50]="odd"
                    class="border-b border-slate-100 last:border-0 hover:bg-brand-50/40 transition-colors">
                  <td class="px-4 py-3"><p class="truncate font-semibold text-slate-900">{{ b.employeeId }}</p><p *ngIf="b.employeeName" class="truncate text-xs text-slate-500">{{ b.employeeName }}</p></td>
                  <td class="px-4 py-3 text-slate-600">{{ b.department || '-' }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ formatDisplayDate(b.bookingDate) }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ formatDisplayDateTime(b.createdAt) }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                          [ngClass]="{
                            'border-emerald-200 bg-emerald-50 text-emerald-700': b.status === 'CONFIRMED',
                            'border-rose-200 bg-rose-50 text-rose-700': b.status === 'CANCELLED',
                            'border-amber-200 bg-amber-50 text-amber-700': b.status === 'PENDING'
                          }">{{ b.status }}</span>
                  </td>
                  <td class="px-4 py-3 text-slate-500">{{ formatDisplayDateTime(b.cancelledAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div *ngIf="!loading() && bookings().length > 0 && viewMode() === 'OVERALL'" class="space-y-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-sm font-semibold text-slate-600">All registrations sorted by booking date, newest first.</p>
        </div>
        <div class="space-y-3">
          <section *ngFor="let day of overallGroupedBookings()" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-slate-500">{{ day.label }}</p>
                <h3 class="text-lg font-bold text-slate-900">{{ day.dateLabel }}</h3>
              </div>
              <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">{{ day.count }} registrations</span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full border-collapse text-sm">
                <thead class="bg-slate-50">
                  <tr class="border-b border-slate-200">
                    <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee</th>
                    <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Department</th>
                    <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Booking Date</th>
                    <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Created At</th>
                    <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Cancelled At</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let b of day.items; let odd = odd"
                      [class.bg-slate-50]="odd"
                      class="border-b border-slate-100 last:border-0 hover:bg-brand-50/40 transition-colors">
                    <td class="px-4 py-3"><p class="truncate font-semibold text-slate-900">{{ b.employeeId }}</p><p *ngIf="b.employeeName" class="truncate text-xs text-slate-500">{{ b.employeeName }}</p></td>
                    <td class="px-4 py-3 text-slate-600">{{ b.department || '-' }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ formatDisplayDate(b.bookingDate) }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ formatDisplayDateTime(b.createdAt) }}</td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                            [ngClass]="{
                              'border-emerald-200 bg-emerald-50 text-emerald-700': b.status === 'CONFIRMED',
                              'border-rose-200 bg-rose-50 text-rose-700': b.status === 'CANCELLED',
                              'border-amber-200 bg-amber-50 text-amber-700': b.status === 'PENDING'
                            }">{{ b.status }}</span>
                    </td>
                    <td class="px-4 py-3 text-slate-500">{{ formatDisplayDateTime(b.cancelledAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  `
})
export class AdminFacilityBookingsPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly bookings = signal<AdminBookingSearchItem[]>([]);
  readonly facilityName = signal('Facility');
  readonly viewMode = signal<BookingViewMode>('DAY_WISE');
  readonly selectedDayKey = signal('');

  private facilityId!: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly adminApi: AdminApiService
  ) {}

  ngOnInit(): void {
    this.facilityId = Number(this.route.snapshot.paramMap.get('facilityId'));
    const navState = history.state as { facilityName?: string };
    if (navState?.facilityName) {
      this.facilityName.set(navState.facilityName);
    }
    this.loadBookings();
  }

  goBack(): void {
    this.router.navigateByUrl('/admin/facilities');
  }

  countByStatus(status: string): number {
    return this.bookings().filter((b) => b.status === status).length;
  }

  setViewMode(mode: BookingViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'DAY_WISE' && !this.selectedDayKey()) {
      this.selectedDayKey.set(this.defaultDayKey());
    }
  }

  selectDay(key: string): void {
    this.selectedDayKey.set(key);
    this.viewMode.set('DAY_WISE');
  }

  dayBuckets(): Array<{ key: string; label: string; dateLabel: string; count: number }> {
    const grouped = this.groupBookingsByDate();
    return Array.from(grouped.entries()).map(([key, items]) => ({
      key,
      label: this.dayLabel(key),
      dateLabel: this.formatDateLabel(key),
      count: items.length
    }));
  }

  groupedBookings(dayKey: string): AdminBookingSearchItem[] {
    return this.groupBookingsByDate().get(dayKey) ?? [];
  }

  overallGroupedBookings(): Array<{ key: string; label: string; dateLabel: string; count: number; items: AdminBookingSearchItem[] }> {
    return Array.from(this.groupBookingsByDate().entries()).map(([key, items]) => ({
      key,
      label: this.dayLabel(key),
      dateLabel: this.formatDateLabel(key),
      count: items.length,
      items
    }));
  }

  private loadBookings(): void {
    this.adminApi.searchBookings({ facilityId: this.facilityId }).subscribe({
      next: (res) => {
        const sorted = [...res].sort((left, right) => {
          const rightBookingDate = right.bookingDate ?? '';
          const leftBookingDate = left.bookingDate ?? '';
          const rightCreatedAt = right.createdAt ?? '';
          const leftCreatedAt = left.createdAt ?? '';
          return rightBookingDate.localeCompare(leftBookingDate) || rightCreatedAt.localeCompare(leftCreatedAt);
        });
        this.bookings.set(sorted);
        this.selectedDayKey.set(this.defaultDayKey(sorted));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private groupBookingsByDate(): Map<string, AdminBookingSearchItem[]> {
    const map = new Map<string, AdminBookingSearchItem[]>();
    for (const booking of this.bookings()) {
      const key = booking.bookingDate && booking.bookingDate.trim().length > 0
        ? booking.bookingDate
        : 'UNKNOWN_DATE';
      const existing = map.get(key) ?? [];
      existing.push(booking);
      map.set(key, existing);
    }
    return new Map([...map.entries()].sort((left, right) => right[0].localeCompare(left[0])));
  }

  private defaultDayKey(source: AdminBookingSearchItem[] = this.bookings()): string {
    if (source.length === 0) {
      return '';
    }
    const todayKey = this.todayIso();
    if (source.some((item) => item.bookingDate === todayKey)) {
      return todayKey;
    }
    const yesterdayKey = this.offsetIso(-1);
    if (source.some((item) => item.bookingDate === yesterdayKey)) {
      return yesterdayKey;
    }
    return source[0].bookingDate || 'UNKNOWN_DATE';
  }

  private todayIso(): string {
    const today = new Date();
    return this.toIso(today);
  }

  private offsetIso(offsetDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return this.toIso(date);
  }

  private toIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private dayLabel(iso: string): string {
    if (iso === 'UNKNOWN_DATE') return 'Unscheduled';
    const today = this.todayIso();
    const yesterday = this.offsetIso(-1);
    if (iso === today) return 'Today';
    if (iso === yesterday) return 'Yesterday';
    return 'Selected Date';
  }

  private formatDateLabel(iso: string): string {
    if (iso === 'UNKNOWN_DATE') return 'No booking date provided';
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Invalid booking date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDisplayDate(value: string | null | undefined): string {
    if (!value || value.trim().length === 0) return '-';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDisplayDateTime(value: string | null | undefined): string {
    if (!value || value.trim().length === 0) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' - ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}
