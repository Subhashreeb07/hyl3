import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AdminBookingSearchItem,
  BookingSummaryResponse,
  BookingTrendResponse,
  FacilityUtilizationResponse,
  NotificationOpsSummaryResponse,
  OperationalSummaryResponse,
  ProcessNotificationsResponse
} from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="min-h-screen bg-[#f6f7f9] p-4 md:p-6">
      <div class="mx-auto max-w-7xl space-y-6">
        <header class="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#4b5563]">Admin Console</p>
              <h1 class="mt-1 text-3xl font-bold text-[#111827]">Platform Operations Dashboard</h1>
              <p class="mt-2 text-sm text-[#6b7280]">Run booking analytics, inspect bookings, and operate notification pipelines.</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f3f4f6]" (click)="goEmployeeDashboard()">Employee View</button>
              <button class="rounded-lg bg-[#b45309] px-4 py-2 text-sm font-semibold text-white hover:bg-[#92400e]" (click)="logout()">Logout</button>
            </div>
          </div>
        </header>

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="rounded-2xl bg-white p-5 shadow-sm">
            <h2 class="text-lg font-bold text-[#111827]">Booking Search</h2>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <input type="number" [(ngModel)]="bookingSearchFacilityId" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" placeholder="Facility ID" />
              <input type="text" [(ngModel)]="bookingSearchEmployeeId" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" placeholder="Employee ID" />
              <select [(ngModel)]="bookingSearchStatus" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
                <option value="">Any status</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <input type="date" [(ngModel)]="bookingSearchDate" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" />
            </div>
            <button class="mt-3 rounded-lg bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white hover:bg-[#111827]" (click)="searchBookings()">Search</button>

            <div class="mt-4 max-h-72 overflow-auto rounded-lg border border-[#e5e7eb]">
              <table class="min-w-full text-sm">
                <thead class="bg-[#f9fafb] text-left text-[#374151]">
                  <tr>
                    <th class="px-3 py-2">Booking</th>
                    <th class="px-3 py-2">Facility</th>
                    <th class="px-3 py-2">Employee</th>
                    <th class="px-3 py-2">Status</th>
                    <th class="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of bookingSearchResults()" class="border-t border-[#f1f5f9]">
                    <td class="px-3 py-2">#{{ item.bookingId }}</td>
                    <td class="px-3 py-2">{{ item.facilityName }} ({{ item.facilityId }})</td>
                    <td class="px-3 py-2">{{ item.employeeId }}</td>
                    <td class="px-3 py-2">{{ item.status }}</td>
                    <td class="px-3 py-2">{{ item.bookingDate }}</td>
                  </tr>
                  <tr *ngIf="bookingSearchResults().length === 0">
                    <td class="px-3 py-3 text-[#6b7280]" colspan="5">No booking records loaded yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="rounded-2xl bg-white p-5 shadow-sm">
            <h2 class="text-lg font-bold text-[#111827]">Booking Summary</h2>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <input type="number" [(ngModel)]="summaryFacilityId" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" placeholder="Facility ID" />
              <input type="date" [(ngModel)]="summaryBookingDate" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" />
            </div>
            <button class="mt-3 rounded-lg bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white hover:bg-[#111827]" (click)="loadBookingSummary()">Load Summary</button>

            <div class="mt-4 rounded-xl bg-[#f9fafb] p-4" *ngIf="bookingSummary() as summary">
              <p class="text-sm text-[#6b7280]">Facility: <strong class="text-[#111827]">{{ summary.facilityId }}</strong></p>
              <p class="text-sm text-[#6b7280]">Date: <strong class="text-[#111827]">{{ summary.bookingDate }}</strong></p>
              <div class="mt-3 grid grid-cols-3 gap-3 text-center">
                <div class="rounded-lg bg-white p-3"><p class="text-xs text-[#6b7280]">Total</p><p class="text-lg font-bold">{{ summary.totalBookings }}</p></div>
                <div class="rounded-lg bg-white p-3"><p class="text-xs text-[#6b7280]">Confirmed</p><p class="text-lg font-bold text-emerald-700">{{ summary.confirmedBookings }}</p></div>
                <div class="rounded-lg bg-white p-3"><p class="text-xs text-[#6b7280]">Cancelled</p><p class="text-lg font-bold text-rose-700">{{ summary.cancelledBookings }}</p></div>
              </div>
            </div>
          </section>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="rounded-2xl bg-white p-5 shadow-sm">
            <h2 class="text-lg font-bold text-[#111827]">Reports</h2>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <input type="date" [(ngModel)]="reportDate" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" />
              <button class="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115e59]" (click)="loadOperationalSummary()">Operational Summary</button>
            </div>

            <div class="mt-4 rounded-xl bg-[#f0fdfa] p-4" *ngIf="operationalSummary() as ops">
              <p class="text-sm text-[#134e4a]">Booking Date: {{ ops.bookingDate }}</p>
              <p class="text-sm text-[#134e4a]">Total: {{ ops.totalBookings }} | Confirmed: {{ ops.confirmedBookings }} | Cancelled: {{ ops.cancelledBookings }}</p>
              <p class="text-sm text-[#134e4a]">Cancellation Rate: {{ ops.cancellationRate }}%</p>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-3">
              <input type="date" [(ngModel)]="trendFromDate" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" />
              <input type="date" [(ngModel)]="trendToDate" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" />
              <input type="number" [(ngModel)]="trendFacilityId" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" placeholder="Facility ID (optional)" />
            </div>
            <button class="mt-3 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115e59]" (click)="loadBookingTrend()">Load Trend</button>

            <div class="mt-4 max-h-56 overflow-auto rounded-lg border border-[#e5e7eb]" *ngIf="bookingTrend() as trend">
              <table class="min-w-full text-sm">
                <thead class="bg-[#f9fafb]"><tr><th class="px-3 py-2">Date</th><th class="px-3 py-2">Total</th><th class="px-3 py-2">Confirmed</th><th class="px-3 py-2">Cancelled</th></tr></thead>
                <tbody>
                  <tr *ngFor="let point of trend.points" class="border-t border-[#f1f5f9]"><td class="px-3 py-2">{{ point.bookingDate }}</td><td class="px-3 py-2">{{ point.totalBookings }}</td><td class="px-3 py-2">{{ point.confirmedBookings }}</td><td class="px-3 py-2">{{ point.cancelledBookings }}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="rounded-2xl bg-white p-5 shadow-sm">
            <h2 class="text-lg font-bold text-[#111827]">Notification Ops</h2>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <input type="number" [(ngModel)]="processBatchSize" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" placeholder="Batch size" />
              <button class="rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6d28d9]" (click)="processNotifications()">Process Notifications</button>
            </div>

            <div class="mt-4 rounded-xl bg-[#faf5ff] p-4" *ngIf="processResult() as process">
              <p class="text-sm text-[#581c87]">Attempted: {{ process.attempted }} | Sent: {{ process.sent }}</p>
              <p class="text-sm text-[#581c87]">Retried: {{ process.retried }} | Escalated: {{ process.escalated }} | Failed: {{ process.failed }}</p>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <input type="date" [(ngModel)]="opsReportDate" class="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm" />
              <button class="rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6d28d9]" (click)="loadNotificationOpsSummary()">Load Ops Summary</button>
            </div>

            <div class="mt-4 rounded-xl bg-[#faf5ff] p-4" *ngIf="opsSummary() as ops">
              <p class="text-sm text-[#581c87]">Report Date: {{ ops.reportDate }}</p>
              <p class="text-sm text-[#581c87]">Total: {{ ops.total }} | Pending: {{ ops.pending }} | Retrying: {{ ops.retrying }}</p>
              <p class="text-sm text-[#581c87]">Sent: {{ ops.sent }} | Failed: {{ ops.failed }} | Escalated: {{ ops.escalated }}</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  `
})
export class AdminDashboardComponent {
  bookingSearchFacilityId: number | null = null;
  bookingSearchEmployeeId = '';
  bookingSearchStatus = '';
  bookingSearchDate = '';

  summaryFacilityId: number | null = null;
  summaryBookingDate = '';

  reportDate = '';
  trendFromDate = '';
  trendToDate = '';
  trendFacilityId: number | null = null;

  processBatchSize: number | null = 100;
  opsReportDate = '';

  bookingSearchResults = signal<AdminBookingSearchItem[]>([]);
  bookingSummary = signal<BookingSummaryResponse | null>(null);
  operationalSummary = signal<OperationalSummaryResponse | null>(null);
  bookingTrend = signal<BookingTrendResponse | null>(null);
  facilityUtilization = signal<FacilityUtilizationResponse | null>(null);
  processResult = signal<ProcessNotificationsResponse | null>(null);
  opsSummary = signal<NotificationOpsSummaryResponse | null>(null);

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly sessionService: SessionService,
    private readonly authApi: AuthApiService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  async searchBookings(): Promise<void> {
    try {
      const results = await firstValueFrom(this.adminApi.searchBookings({
        facilityId: this.bookingSearchFacilityId,
        employeeId: this.bookingSearchEmployeeId,
        status: this.bookingSearchStatus,
        bookingDate: this.bookingSearchDate
      }));
      this.bookingSearchResults.set(results);
      this.toastService.show(`Loaded ${results.length} bookings`, 'success');
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to search bookings', 'error');
    }
  }

  async loadBookingSummary(): Promise<void> {
    if (!this.summaryFacilityId) {
      this.toastService.show('Facility ID is required', 'error');
      return;
    }
    try {
      const summary = await firstValueFrom(this.adminApi.getBookingSummary(this.summaryFacilityId, this.summaryBookingDate || null));
      this.bookingSummary.set(summary);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load booking summary', 'error');
    }
  }

  async loadOperationalSummary(): Promise<void> {
    try {
      const summary = await firstValueFrom(this.adminApi.getOperationalSummary(this.reportDate || null));
      this.operationalSummary.set(summary);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load operational summary', 'error');
    }
  }

  async loadBookingTrend(): Promise<void> {
    if (!this.trendFromDate || !this.trendToDate) {
      this.toastService.show('From and To dates are required for trend', 'error');
      return;
    }
    try {
      const trend = await firstValueFrom(this.adminApi.getBookingTrend(this.trendFromDate, this.trendToDate, this.trendFacilityId));
      this.bookingTrend.set(trend);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load booking trend', 'error');
    }
  }

  async processNotifications(): Promise<void> {
    try {
      const result = await firstValueFrom(this.adminApi.processNotifications(this.processBatchSize));
      this.processResult.set(result);
      this.toastService.show('Notification processing completed', 'success');
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to process notifications', 'error');
    }
  }

  async loadNotificationOpsSummary(): Promise<void> {
    try {
      const summary = await firstValueFrom(this.adminApi.getNotificationOpsSummary(this.opsReportDate || null));
      this.opsSummary.set(summary);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load notification summary', 'error');
    }
  }

  goEmployeeDashboard(): void {
    this.router.navigateByUrl('/employee/dashboard');
  }

  async logout(): Promise<void> {
    const token = this.sessionService.getToken();
    if (!token) {
      this.sessionService.clear();
      this.router.navigateByUrl('/login');
      return;
    }

    try {
      await firstValueFrom(this.authApi.logout(token));
    } catch {
      // ignore logout API failure and clear local session
    }

    this.sessionService.clear();
    this.router.navigateByUrl('/login');
  }
}
