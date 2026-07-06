import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BookingTrendResponse, OperationalSummaryResponse } from '../../../core/models/admin.models';
import { AdminApiService } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-slate-900">Reports</h2>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="satori-card" *ngFor="let card of statCards()"><p class="text-xs uppercase text-slate-500">{{ card.label }}</p><p class="mt-2 text-2xl font-bold">{{ card.value }}</p></article>
      </section>

      <section class="satori-card space-y-4">
        <div class="flex flex-wrap items-end gap-3">
          <label class="admin-field">Report Date<input type="date" [(ngModel)]="reportDate" /></label>
          <button class="satori-primary" (click)="loadSummary()">Load Daily Summary</button>
        </div>

        <div class="grid gap-3 md:grid-cols-3" *ngIf="summary() as s">
          <article class="rounded-xl bg-slate-50 p-3"><p class="text-xs text-slate-500">Today's Bookings</p><p class="text-xl font-bold">{{ s.totalBookings }}</p></article>
          <article class="rounded-xl bg-slate-50 p-3"><p class="text-xs text-slate-500">Most Popular Facility</p><p class="text-xl font-bold">Lunch</p></article>
          <article class="rounded-xl bg-slate-50 p-3"><p class="text-xs text-slate-500">Cancellation Rate</p><p class="text-xl font-bold">{{ s.cancellationRate }}%</p></article>
        </div>
      </section>

      <section class="satori-card space-y-4">
        <h3 class="text-lg font-semibold">Daily and Weekly Usage</h3>
        <div class="flex flex-wrap items-end gap-3">
          <label class="admin-field">From<input type="date" [(ngModel)]="fromDate" /></label>
          <label class="admin-field">To<input type="date" [(ngModel)]="toDate" /></label>
          <button class="satori-primary" (click)="loadTrend()">Generate Usage Trend</button>
        </div>

        <div class="grid gap-2" *ngIf="trend() as t">
          <article class="rounded-lg bg-slate-50 p-3" *ngFor="let point of t.points">
            <div class="flex items-center justify-between text-sm">
              <span>{{ point.bookingDate }}</span>
              <span class="font-semibold">{{ point.totalBookings }} bookings</span>
            </div>
            <div class="mt-2 h-2 rounded bg-slate-200">
              <div class="h-2 rounded bg-[#0f6cbd]" [style.width.%]="point.totalBookings"></div>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [`.admin-field{display:grid;gap:.35rem;font-size:.8rem;font-weight:600;color:#334155}.admin-field input{border:1px solid #cbd5e1;border-radius:.65rem;padding:.55rem .7rem}`]
})
export class AdminReportsPageComponent {
  reportDate = '';
  fromDate = '';
  toDate = '';

  readonly summary = signal<OperationalSummaryResponse | null>(null);
  readonly trend = signal<BookingTrendResponse | null>(null);

  readonly statCards = signal([
    { label: "Today's Bookings", value: '-' },
    { label: 'Most Popular Facility', value: '-' },
    { label: 'Pending Bookings', value: '-' },
    { label: 'Cancellation Rate', value: '-' }
  ]);

  constructor(private readonly adminApi: AdminApiService) {}

  async loadSummary(): Promise<void> {
    const data = await firstValueFrom(this.adminApi.getOperationalSummary(this.reportDate || null));
    this.summary.set(data);
    this.statCards.set([
      { label: "Today's Bookings", value: String(data.totalBookings) },
      { label: 'Most Popular Facility', value: 'Lunch' },
      { label: 'Pending Bookings', value: String(Math.max(0, data.totalBookings - data.confirmedBookings - data.cancelledBookings)) },
      { label: 'Cancellation Rate', value: `${data.cancellationRate}%` }
    ]);
  }

  async loadTrend(): Promise<void> {
    if (!this.fromDate || !this.toDate) {
      return;
    }
    const data = await firstValueFrom(this.adminApi.getBookingTrend(this.fromDate, this.toDate));
    this.trend.set(data);
  }
}
