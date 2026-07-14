import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingHistoryItem } from '../../core/models/employee-flow.models';
import { BookingApiService } from '../../core/services/booking-api.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="w-full px-[5vw] py-7 space-y-5">
      <header class="portal-panel px-6 py-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6cbd]">Employee Activity</p>
            <h2 class="mt-1 text-3xl font-bold text-slate-900">Booking History</h2>
            <p class="mt-1 text-sm text-slate-600">Review prior submissions and access detailed booking records.</p>
          </div>
          <a routerLink="/employee/dashboard" class="satori-secondary">Return to Dashboard</a>
        </div>
      </header>

      <div class="portal-panel overflow-hidden">
        <div class="border-b border-slate-200 px-6 py-4">
          <p class="text-sm font-semibold text-slate-900">All Bookings</p>
          <p class="mt-1 text-xs text-slate-500">{{ items().length }} record{{ items().length === 1 ? '' : 's' }} available</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-700">
              <tr>
                <th class="px-6 py-3">Booking ID</th>
                <th class="px-6 py-3">Facility</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items()" class="border-t border-slate-100">
                <td class="px-6 py-4 font-semibold text-slate-900">#{{ item.bookingId }}</td>
                <td class="px-6 py-4">{{ item.facility }}</td>
                <td class="px-6 py-4">
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    [ngClass]="item.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'">
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <a [routerLink]="['/employee/bookings', item.bookingId]" class="font-medium text-[#0f6cbd] hover:text-[#0b4f8a]">View Details</a>
                </td>
              </tr>
              <tr *ngIf="items().length === 0">
                <td class="px-6 py-8 text-slate-500" colspan="4">No booking records are currently available.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
})
export class BookingHistoryComponent implements OnInit {
  readonly items = signal<BookingHistoryItem[]>([]);

  constructor(
    private readonly bookingApi: BookingApiService,
    private readonly sessionService: SessionService
  ) {}

  ngOnInit(): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) {
      this.items.set([]);
      return;
    }

    this.bookingApi.getBookingHistory(employeeId).subscribe({
      next: (data) => this.items.set(data),
      error: () => this.items.set([])
    });
  }
}
