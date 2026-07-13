import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BookingTrendResponse, OperationalSummaryResponse } from '../../../core/models/admin.models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-bold text-slate-900">Reports</h2>
        <button class="satori-secondary" (click)="exportExcel()" [disabled]="exporting()">
          {{ exporting() ? 'Exporting...' : 'Export Excel' }}
        </button>
      </div>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md" *ngFor="let card of statCards(); let i = index">
          <div class="flex items-center justify-between">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-500">{{ card.label }}</p>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                 [ngClass]="{
                   'bg-brand-50 text-brand-600': i === 0,
                   'bg-emerald-50 text-emerald-600': i === 1,
                   'bg-rose-50 text-rose-600': i === 2,
                   'bg-amber-50 text-amber-600': i === 3
                 }">
              <mat-icon class="!text-[22px]">{{ card.icon }}</mat-icon>
            </div>
          </div>
          <p class="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{{ card.value }}</p>
        </article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
          <h3 class="text-lg font-bold text-slate-900">Daily Summary Snapshot</h3>
          <div class="flex items-center gap-3">
            <div class="relative">
              <input type="date" [(ngModel)]="reportDate" class="h-10 w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <button class="flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700" (click)="loadSummary()">
              <mat-icon class="!text-[18px]">sync</mat-icon> Load
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="grid gap-4 md:grid-cols-3" *ngIf="summary() as s; else noSummary">
            <article class="flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-brand-100">
                <mat-icon class="text-brand-600">book_online</mat-icon>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-brand-600/80">Total Bookings</p>
                <p class="text-2xl font-black text-brand-900">{{ s.totalBookings }}</p>
              </div>
            </article>
            <article class="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-emerald-100">
                <mat-icon class="text-emerald-600">check_circle_outline</mat-icon>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-emerald-600/80">Confirmed</p>
                <p class="text-2xl font-black text-emerald-900">{{ s.confirmedBookings }}</p>
              </div>
            </article>
            <article class="flex items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-rose-100">
                <mat-icon class="text-rose-600">highlight_off</mat-icon>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-rose-600/80">Cancelled</p>
                <p class="text-2xl font-black text-rose-900">{{ s.cancelledBookings }}</p>
              </div>
            </article>
          </div>

          <ng-template #noSummary>
            <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <mat-icon class="mb-2 !h-12 !w-12 !text-[48px] text-slate-300">assessment</mat-icon>
              <p class="text-base font-semibold text-slate-700">No data for {{ reportDate || 'today' }}</p>
              <p class="mt-1 text-sm text-slate-500">Select a different date or create bookings to see statistics.</p>
            </div>
          </ng-template>
        </div>
      </section>

      <!-- Trend & Status Row -->
      <section class="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <!-- Booking Volume Bar Chart -->
        <article class="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <h3 class="text-lg font-bold text-slate-900">Booking Volume Trend</h3>
            <p class="text-xs text-slate-400 mt-0.5">Daily booking counts over selected period</p>
          </div>
          <div class="flex-1 p-6" *ngIf="trend()?.points?.length; else noChartData">
            <div class="flex items-end gap-2 h-48">
              <ng-container *ngFor="let p of trend()!.points">
                <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span class="text-[9px] font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">{{ p.totalBookings }}</span>
                  <div class="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-300 min-h-[4px]"
                       [style.height.%]="barHeight(p.totalBookings)"
                       [title]="p.bookingDate + ': ' + p.totalBookings + ' bookings'"></div>
                  <span class="text-[8px] font-semibold text-slate-400 truncate w-full text-center">{{ p.bookingDate.slice(5) }}</span>
                </div>
              </ng-container>
            </div>
          </div>
          <ng-template #noChartData>
            <div class="flex h-48 items-center justify-center text-sm text-slate-400">
              No trend data. Generate a trend report below.
            </div>
          </ng-template>
        </article>

        <!-- Status Donut (CSS Ring) -->
        <article class="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <h3 class="text-lg font-bold text-slate-900">Daily Status Mix</h3>
          </div>
          <div class="flex-1 p-6 flex flex-col items-center justify-center gap-5" *ngIf="summary() as s; else noStatus">
            <!-- SVG Donut Ring -->
            <div class="relative flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <!-- Confirmed arc -->
                <circle cx="80" cy="80" r="60" fill="none" stroke="#f1f5f9" stroke-width="20"/>
                <circle cx="80" cy="80" r="60" fill="none" stroke="#10b981" stroke-width="20"
                        stroke-dasharray="{{ donutArc(s.confirmedBookings, s.totalBookings) }} {{ 377 - donutArc(s.confirmedBookings, s.totalBookings) }}"
                        stroke-dashoffset="94.25" stroke-linecap="round" transform="rotate(-90 80 80)"/>
              </svg>
              <div class="absolute text-center">
                <p class="text-3xl font-black text-slate-900">{{ s.totalBookings }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
              </div>
            </div>
            <!-- Legend -->
            <div class="w-full space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span><span class="text-sm font-semibold text-slate-600">Confirmed</span></div>
                <span class="text-sm font-bold text-slate-900">{{ s.confirmedBookings }} <span class="text-xs font-semibold text-slate-400">({{ summaryPercent(s.confirmedBookings, s.totalBookings) }}%)</span></span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span><span class="text-sm font-semibold text-slate-600">Cancelled</span></div>
                <span class="text-sm font-bold text-slate-900">{{ s.cancelledBookings }} <span class="text-xs font-semibold text-slate-400">({{ summaryPercent(s.cancelledBookings, s.totalBookings) }}%)</span></span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span><span class="text-sm font-semibold text-slate-600">Pending</span></div>
                <span class="text-sm font-bold text-slate-900">{{ pendingBookings(s) }} <span class="text-xs font-semibold text-slate-400">({{ summaryPercent(pendingBookings(s), s.totalBookings) }}%)</span></span>
              </div>
            </div>
          </div>
          <ng-template #noStatus>
            <div class="flex h-full p-6 flex-col items-center justify-center">
              <div class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center w-full">
                <mat-icon class="mb-2 text-slate-300">pie_chart</mat-icon>
                <p class="text-sm font-medium text-slate-500">Load a summary to see status distribution</p>
              </div>
            </div>
          </ng-template>
        </article>
      </section>

      <!-- Usage Trend Bar Chart -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
          <h3 class="text-lg font-bold text-slate-900">Daily and Weekly Usage</h3>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <input type="date" [(ngModel)]="fromDate" class="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <span class="text-sm font-semibold text-slate-400">to</span>
              <input type="date" [(ngModel)]="toDate" class="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <button class="flex h-10 items-center gap-1.5 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900" (click)="loadTrend()">
              <mat-icon class="!text-[18px]">insights</mat-icon> Generate
            </button>
          </div>
        </div>
        <div class="p-6">
          <div *ngIf="trend()?.points?.length; else noTrendData">
            <div class="space-y-3">
              <div *ngFor="let p of trend()!.points" class="grid grid-cols-[120px_1fr_60px] items-center gap-4">
                <span class="text-xs font-semibold text-slate-500 text-right">{{ p.bookingDate }}</span>
                <div class="h-6 rounded-full bg-slate-100 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                       [style.width.%]="barHeight(p.totalBookings)"></div>
                </div>
                <span class="text-xs font-bold text-slate-700">{{ p.totalBookings }} bookings</span>
              </div>
            </div>
          </div>
          <ng-template #noTrendData>
            <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <mat-icon class="mb-2 !text-[40px] text-slate-300">bar_chart</mat-icon>
              <p class="text-sm font-semibold text-slate-600">No trend data yet</p>
              <p class="text-xs text-slate-400 mt-1">Select a date range and click Generate</p>
            </div>
          </ng-template>
        </div>
      </section>
    </div>
  `,
  styles: [`.admin-field{display:grid;gap:.35rem;font-size:.8rem;font-weight:600;color:#334155}.admin-field input{border:1px solid #cbd5e1;border-radius:.65rem;padding:.55rem .7rem}`]
})
export class AdminReportsPageComponent implements OnInit {
  reportDate = '';
  fromDate = '';
  toDate = '';

  readonly summary = signal<OperationalSummaryResponse | null>(null);
  readonly trend = signal<BookingTrendResponse | null>(null);
  readonly loadingSummary = signal(false);
  readonly loadingTrend = signal(false);
  readonly exporting = signal(false);


  readonly statCards = computed(() => {
    const s = this.summary();
    if (!s) {
      return [
        { label: "Today's Bookings", value: '0', icon: 'calendar_month' },
        { label: 'Confirmed Bookings', value: '0', icon: 'check_circle' },
        { label: 'Cancelled Bookings', value: '0', icon: 'cancel' },
        { label: 'Cancellation Rate', value: '0%', icon: 'warning' }
      ];
    }
    return [
      { label: "Today's Bookings", value: String(s.totalBookings), icon: 'calendar_month' },
      { label: 'Confirmed Bookings', value: String(s.confirmedBookings), icon: 'check_circle' },
      { label: 'Cancelled Bookings', value: String(s.cancelledBookings), icon: 'cancel' },
      { label: 'Cancellation Rate', value: `${s.cancellationRate}%`, icon: 'warning' }
    ];
  });

  readonly trendMax = computed(() => {
    const points = this.trend()?.points ?? [];
    return points.reduce((max, point) => Math.max(max, point.totalBookings), 0);
  });

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 6);

    this.reportDate = this.toInputDate(today);
    this.fromDate = this.toInputDate(from);
    this.toDate = this.toInputDate(today);

    void this.loadSummary();
    void this.loadTrend();
  }

  private toInputDate(value: Date): string {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async loadSummary(): Promise<void> {
    if (this.loadingSummary()) {
      return;
    }

    this.loadingSummary.set(true);
    try {
      const data = await firstValueFrom(this.adminApi.getOperationalSummary(this.reportDate || null));
      this.summary.set(data);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load report summary', 'error');
      console.error('Summary error:', error);
    } finally {
      this.loadingSummary.set(false);
    }
  }

  async loadTrend(): Promise<void> {
    if (this.loadingTrend()) {
      return;
    }
    if (!this.fromDate || !this.toDate) {
      return;
    }

    this.loadingTrend.set(true);
    try {
      const data = await firstValueFrom(this.adminApi.getBookingTrend(this.fromDate, this.toDate));
      this.trend.set(data);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load booking trend', 'error');
    } finally {
      this.loadingTrend.set(false);
    }
  }

  async exportExcel(): Promise<void> {
    if (this.exporting()) {
      return;
    }

    this.exporting.set(true);
    try {
      const [summary, trend] = await Promise.all([
        firstValueFrom(this.adminApi.getOperationalSummary(this.reportDate || null)),
        firstValueFrom(this.adminApi.getBookingTrend(this.fromDate, this.toDate))
      ]);

      const html = this.buildExcelHtml(summary, trend);
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const fileName = `reports_${this.reportDate || this.toInputDate(new Date())}.xls`;
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.toastService.show('Excel report downloaded successfully', 'success');
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to export report', 'error');
    } finally {
      this.exporting.set(false);
    }
  }

  summaryPercent(value: number, total: number): number {
    if (!total || total <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  }

  barHeight(value: number): number {
    const points = this.trend()?.points ?? [];
    if (!points.length) return 0;
    const max = Math.max(...points.map(p => p.totalBookings));
    if (!max) return 0;
    return Math.round((value / max) * 100);
  }

  donutArc(value: number, total: number): number {
    if (!total) return 0;
    // circumference of r=60 circle is ~377
    return Math.round((value / total) * 377);
  }

  pendingBookings(summary: OperationalSummaryResponse): number {
    return Math.max(0, summary.totalBookings - summary.confirmedBookings - summary.cancelledBookings);
  }

  private buildExcelHtml(summary: OperationalSummaryResponse, trend: BookingTrendResponse): string {
    const escape = (value: unknown): string =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const summaryRows = [
      ['Metric', 'Value'],
      ['Report Date', summary.bookingDate],
      ['Total Bookings', summary.totalBookings],
      ['Confirmed Bookings', summary.confirmedBookings],
      ['Cancelled Bookings', summary.cancelledBookings],
      ['Pending Bookings', this.pendingBookings(summary)],
      ['Cancellation Rate (%)', summary.cancellationRate],
      ['Total Facilities', summary.totalFacilities],
      ['Published Facilities', summary.publishedFacilities]
    ]
      .map((row) => `<tr><td>${escape(row[0])}</td><td>${escape(row[1])}</td></tr>`)
      .join('');

    const trendRows = [
      '<tr><th>Date</th><th>Total Bookings</th><th>Confirmed Bookings</th><th>Cancelled Bookings</th></tr>',
      ...trend.points.map(
        (point) =>
          `<tr><td>${escape(point.bookingDate)}</td><td>${escape(point.totalBookings)}</td><td>${escape(point.confirmedBookings)}</td><td>${escape(point.cancelledBookings)}</td></tr>`
      )
    ].join('');

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; margin-bottom: 20px; }
            td, th { border: 1px solid #cbd5e1; padding: 6px 10px; }
            th { background: #f1f5f9; text-align: left; }
            h3 { margin: 12px 0 6px; }
          </style>
        </head>
        <body>
          <h3>Summary</h3>
          <table>${summaryRows}</table>
          <h3>Trend</h3>
          <table>${trendRows}</table>
        </body>
      </html>
    `;
  }
}
