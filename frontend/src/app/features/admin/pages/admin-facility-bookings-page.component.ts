import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminBookingSearchItem } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-facility-bookings-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="flex flex-col gap-6">

      <!-- ── Header ── -->
      <section class="flex flex-wrap items-center gap-3">
        <button (click)="goBack()"
                class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          <mat-icon class="!text-[18px]">arrow_back</mat-icon> Back
        </button>
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold text-slate-900 truncate">{{ facilityName() }} — Bookings</h2>
          <p class="text-sm text-slate-500">All employee bookings for this facility</p>
        </div>
      </section>

      <!-- ── Stats strip ── -->
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

      <!-- ── Loading ── -->
      <div *ngIf="loading()" class="flex flex-col items-center justify-center py-20 gap-3">
        <mat-icon class="animate-spin !text-[40px] !h-10 !w-10 text-brand-400">refresh</mat-icon>
        <p class="text-slate-500 text-sm">Loading bookings...</p>
      </div>

      <!-- ── Empty state ── -->
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

      <!-- ── Booking list ── -->
      <div *ngIf="!loading() && bookings().length > 0" class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Booking Date</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Created At</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Cancelled At</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of bookings(); let odd = odd"
                [class.bg-slate-50]="odd"
                class="border-b border-slate-100 last:border-0 hover:bg-brand-50/40 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <mat-icon class="!text-[16px]">person</mat-icon>
                  </div>
                  <span class="font-semibold text-slate-800">{{ b.employeeId }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-slate-600">
                <div class="flex items-center gap-1.5">
                  <mat-icon class="!text-[14px] text-slate-400">calendar_today</mat-icon>
                  {{ b.bookingDate | date:'mediumDate' }}
                </div>
              </td>
              <td class="px-4 py-3 text-slate-500 text-xs">
                {{ b.createdAt | date:'MMM d, y · h:mm a' }}
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-700 border border-emerald-200': b.status === 'CONFIRMED',
                        'bg-rose-50 text-rose-700 border border-rose-200': b.status === 'CANCELLED',
                        'bg-amber-50 text-amber-700 border border-amber-200': b.status === 'PENDING'
                      }">
                  <span class="h-1.5 w-1.5 rounded-full"
                        [ngClass]="{
                          'bg-emerald-500': b.status === 'CONFIRMED',
                          'bg-rose-500': b.status === 'CANCELLED',
                          'bg-amber-500': b.status === 'PENDING'
                        }"></span>
                  {{ b.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-400 text-xs">
                {{ b.cancelledAt ? (b.cancelledAt | date:'MMM d, y · h:mm a') : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `
})
export class AdminFacilityBookingsPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly bookings = signal<AdminBookingSearchItem[]>([]);
  readonly facilityName = signal('Facility');

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
    return this.bookings().filter(b => b.status === status).length;
  }

  private loadBookings(): void {
    this.adminApi.searchBookings({ facilityId: this.facilityId }).subscribe({
      next: (res) => {
        this.bookings.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
