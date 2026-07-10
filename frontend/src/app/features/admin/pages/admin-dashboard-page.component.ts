import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminBookingSearchItem } from '../../../core/models/admin.models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { FacilityBuilderStateService } from '../state/facility-builder-state.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article class="satori-card" *ngFor="let card of summaryCards()">
          <p class="text-xs uppercase tracking-[0.12em] text-slate-500">{{ card.label }}</p>
          <p class="mt-2 text-2xl font-bold text-slate-900">{{ card.value }}</p>
        </article>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p>
            Last synced:
            <strong class="text-slate-800">{{ lastUpdated() ? (lastUpdated() | date: 'medium') : 'Not synchronized yet' }}</strong>
          </p>
          <div class="flex gap-2">
            <button class="satori-secondary" [disabled]="loading()" (click)="refreshDashboard()">
              {{ loading() ? 'Refreshing...' : 'Refresh Data' }}
            </button>
            <button class="satori-primary" [disabled]="processingNotifications()" (click)="processPendingNotifications()">
              {{ processingNotifications() ? 'Processing...' : 'Process Pending Alerts' }}
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <article class="satori-card">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Published Facilities</h2>
            <a routerLink="/admin/facilities" class="text-sm font-semibold text-[#0f6cbd]">View all</a>
          </div>
          <ul class="mt-4 space-y-3" *ngIf="recentlyPublished().length > 0; else noPublished">
            <li *ngFor="let facility of recentlyPublished()" class="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p class="font-semibold text-slate-900">{{ facility.facilityName }}</p>
              <p>Updated {{ facility.updatedAt | date: 'medium' }}</p>
            </li>
          </ul>
          <ng-template #noPublished>
            <p class="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              No published facilities are currently available.
            </p>
          </ng-template>
        </article>

        <article class="satori-card">
          <h2 class="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div class="mt-4 grid gap-3">
            <button class="satori-primary" (click)="createFacility()">Create Facility Draft</button>
            <button class="satori-secondary" (click)="goBuilder()">Import Configuration</button>
            <button class="satori-secondary" (click)="goReports()">Open Reports</button>
          </div>

          <div class="mt-6 rounded-xl bg-[#f0f6ff] p-4">
            <p class="text-xs uppercase tracking-[0.12em] text-[#0f6cbd]">Recently Published</p>
            <ul class="mt-3 space-y-2 text-sm text-slate-700" *ngIf="recentlyPublished().length > 0; else noRecentPublished">
              <li *ngFor="let facility of recentlyPublished()">{{ facility.facilityName }} · {{ facility.updatedAt | date: 'mediumDate' }}</li>
            </ul>
            <ng-template #noRecentPublished>
              <p class="mt-3 text-sm text-slate-600">No recently published facilities</p>
            </ng-template>
          </div>
        </article>
      </section>

      <section class="satori-card">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Recent Bookings</h2>
            <p class="text-sm text-slate-600">Only active facility bookings are displayed. Deleted or unpublished facilities remain hidden.</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Total {{ bookings().length }}</span>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            [(ngModel)]="bookingDate"
            type="date"
            class="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            [(ngModel)]="bookingEmployeeId"
            class="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Employee ID (Optional)"
          />
          <select [(ngModel)]="bookingStatus" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button class="satori-secondary" (click)="loadBookings()">Apply</button>
        </div>

        <div class="mt-4 overflow-x-auto" *ngIf="bookings().length > 0; else noBookings">
          <table class="min-w-full text-left text-sm">
            <thead class="text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th class="pb-2">Booking ID</th>
                <th class="pb-2">Facility</th>
                <th class="pb-2">Employee ID</th>
                <th class="pb-2">Status</th>
                <th class="pb-2">Booking Date</th>
                <th class="pb-2">Created At</th>
                <th class="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let booking of bookings()" class="border-t border-slate-100">
                <td class="py-3 font-semibold text-slate-900">#{{ booking.bookingId }}</td>
                <td class="py-3">{{ booking.facilityName }}</td>
                <td class="py-3">{{ booking.employeeId }}</td>
                <td class="py-3">
                  <span class="rounded-full px-2 py-1 text-xs font-semibold" [ngClass]="booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'">
                    {{ booking.status }}
                  </span>
                </td>
                <td class="py-3">{{ booking.bookingDate | date: 'mediumDate' }}</td>
                <td class="py-3">{{ booking.createdAt | date: 'medium' }}</td>
                <td class="py-3 text-right">
                  <button
                    class="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    [disabled]="booking.status === 'CANCELLED' || isDeleting(booking.bookingId)"
                    (click)="deleteBooking(booking.bookingId)"
                  >
                    {{ isDeleting(booking.bookingId) ? 'Cancelling...' : 'Cancel Booking' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noBookings>
          <p class="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">No bookings were found for the selected filters.</p>
        </ng-template>
      </section>
    </div>
  `
})
export class AdminDashboardPageComponent implements OnInit {
  readonly loading = signal(false);
  readonly processingNotifications = signal(false);
  readonly todayTotalBookings = signal(0);
  readonly todayConfirmedBookings = signal(0);
  readonly todayCancelledBookings = signal(0);
  readonly pendingNotifications = signal(0);
  readonly cancellationRate = signal(0);
  readonly lastUpdated = signal<Date | null>(null);
  readonly bookings = signal<AdminBookingSearchItem[]>([]);
  readonly deletingBookingIds = signal<number[]>([]);
  bookingEmployeeId = '';
  bookingStatus = '';
  bookingDate = this.todayIsoDate();

  private readonly emptyCardValue = '--';

  readonly summaryCards = computed(() => {
    const facilities = this.state.facilities();
    const published = facilities.filter((f) => f.published).length;
    const draft = facilities.length - published;

    return [
      { label: 'Total Facilities', value: facilities.length },
      { label: 'Published Facilities', value: published },
      { label: 'Draft Facilities', value: draft },
      {
        label: 'Cancellation Rate',
        value: this.loading() ? this.emptyCardValue : `${this.cancellationRate()}%`
      },
      {
        label: 'Pending Notifications',
        value: this.loading() ? this.emptyCardValue : this.pendingNotifications()
      }
    ];
  });

  readonly recentlyPublished = computed(() =>
    this.state
      .facilities()
      .filter((f) => f.published)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4)
  );

  constructor(
    private readonly state: FacilityBuilderStateService,
    private readonly adminApi: AdminApiService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadBookings();
  }

  refreshDashboard(): void {
    this.loadDashboard();
    this.loadBookings();
  }

  async loadBookings(): Promise<void> {
    try {
      const response = await firstValueFrom(this.adminApi.searchBookings({
        bookingDate: this.bookingDate || null,
        employeeId: this.bookingEmployeeId || null,
        status: this.bookingStatus || null
      }));

      this.bookings.set(response ?? []);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Bookings could not be loaded at this time.', 'error');
    }
  }

  async processPendingNotifications(): Promise<void> {
    this.processingNotifications.set(true);
    try {
      const result = await firstValueFrom(this.adminApi.processNotifications());
      this.toastService.show(
        `Notification processing completed: sent ${result.sent}, retried ${result.retried}, failed ${result.failed}.`,
        'success'
      );
      await this.loadDashboard();
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Pending notifications could not be processed.', 'error');
    } finally {
      this.processingNotifications.set(false);
    }
  }

  private async loadDashboard(): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    try {
      await this.state.loadFromBackend();
      const [summary, notificationSummary] = await Promise.all([
        firstValueFrom(this.adminApi.getOperationalSummary()),
        firstValueFrom(this.adminApi.getNotificationOpsSummary())
      ]);

      this.todayTotalBookings.set(summary.totalBookings ?? 0);
      this.todayConfirmedBookings.set(summary.confirmedBookings ?? 0);
      this.todayCancelledBookings.set(summary.cancelledBookings ?? 0);
      this.cancellationRate.set(summary.cancellationRate ?? 0);
      this.pendingNotifications.set(notificationSummary.pending ?? 0);
      this.lastUpdated.set(new Date());
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Admin dashboard data could not be loaded at this time.', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  createFacility(): void {
    this.state.createDraft();
    this.router.navigateByUrl('/admin/form-builder');
  }

  goBuilder(): void {
    this.router.navigateByUrl('/admin/form-builder');
  }

  goReports(): void {
    this.router.navigateByUrl('/admin/reports');
  }

  async deleteBooking(bookingId: number): Promise<void> {
    const confirmed = window.confirm('Cancel this booking record? This action will set the booking status to cancelled.');
    if (!confirmed) {
      return;
    }

    this.deletingBookingIds.update((ids) => (ids.includes(bookingId) ? ids : [...ids, bookingId]));
    try {
      await firstValueFrom(this.adminApi.deleteBooking(bookingId));
      this.toastService.show('Booking status has been updated to cancelled successfully.', 'success');
      await this.loadBookings();
      await this.loadDashboard();
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Booking status could not be updated.', 'error');
    } finally {
      this.deletingBookingIds.update((ids) => ids.filter((id) => id !== bookingId));
    }
  }

  isDeleting(bookingId: number): boolean {
    return this.deletingBookingIds().includes(bookingId);
  }

  private todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
