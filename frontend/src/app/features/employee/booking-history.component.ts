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
    <section class="mx-auto max-w-6xl rounded-3xl bg-white p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-slate-900">Booking History</h2>
        <a routerLink="/employee/dashboard" class="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Dashboard</a>
      </div>

      <div class="mt-5 overflow-hidden rounded-2xl bg-[#fafafa]">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-700">
            <tr>
              <th class="px-4 py-3">Booking ID</th>
              <th class="px-4 py-3">Facility</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items()" class="border-t border-slate-100">
              <td class="px-4 py-3">#{{ item.bookingId }}</td>
              <td class="px-4 py-3">{{ item.facility }}</td>
              <td class="px-4 py-3">{{ item.status }}</td>
              <td class="px-4 py-3">
                <a [routerLink]="['/employee/bookings', item.bookingId]" class="font-medium text-brand-700 hover:text-brand-900">View</a>
              </td>
            </tr>
            <tr *ngIf="items().length === 0">
              <td class="px-4 py-6 text-slate-500" colspan="4">No bookings found.</td>
            </tr>
          </tbody>
        </table>
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
