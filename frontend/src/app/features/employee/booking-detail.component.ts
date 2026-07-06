import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingDetail } from '../../core/models/employee-flow.models';
import { BookingApiService } from '../../core/services/booking-api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto max-w-6xl rounded-3xl bg-white p-6 shadow-lg" *ngIf="detail() as d">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-bold text-slate-900">Booking #{{ d.bookingId }}</h2>
        <div class="flex gap-2">
          <a routerLink="/employee/history" class="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">History</a>
          <button
            *ngIf="d.status !== 'CANCELLED'"
            class="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            (click)="cancel(d.bookingId)"
          >
            Cancel Booking
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <p><span class="font-semibold">Facility:</span> {{ d.facilityName }}</p>
        <p><span class="font-semibold">Employee:</span> {{ d.employeeId }}</p>
        <p><span class="font-semibold">Status:</span> {{ d.status }}</p>
        <p><span class="font-semibold">Created:</span> {{ d.createdAt }}</p>
      </div>

      <div *ngIf="d.qrCode" class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p class="text-sm font-semibold text-emerald-800">QR Token</p>
        <p class="mt-1 break-all font-mono text-sm text-emerald-900">{{ d.qrCode }}</p>
      </div>

      <div class="mt-5 overflow-hidden rounded-2xl bg-[#fafafa]">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-700">
            <tr>
              <th class="px-4 py-3">Field</th>
              <th class="px-4 py-3">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let answer of d.responses" class="border-t border-slate-100">
              <td class="px-4 py-3">{{ answer.label }}</td>
              <td class="px-4 py-3">{{ answer.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p *ngIf="message()" class="mt-4 text-sm font-medium text-emerald-700">{{ message() }}</p>
      <p *ngIf="error()" class="mt-4 text-sm font-medium text-rose-700">{{ error() }}</p>
    </section>
  `
})
export class BookingDetailComponent implements OnInit {
  readonly detail = signal<BookingDetail | null>(null);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly bookingApi: BookingApiService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    const bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));
    if (!bookingId) {
      return;
    }

    this.load(bookingId);
  }

  cancel(bookingId: number): void {
    this.bookingApi.cancelBooking(bookingId).subscribe({
      next: (result) => {
        this.message.set(result.message);
        this.error.set(null);
        this.toastService.show(result.message, 'success');
        this.load(bookingId);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Unable to cancel booking');
        this.toastService.show(this.error() ?? 'Unable to cancel booking', 'error');
      }
    });
  }

  private load(bookingId: number): void {
    this.bookingApi.getBookingDetail(bookingId).subscribe({
      next: (data) => {
        this.detail.set(data);
      },
      error: () => {
        this.error.set('Unable to load booking details');
      }
    });
  }
}
