import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BookingTrendResponse, OperationalSummaryResponse } from '../../../core/models/admin.models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { FacilityAdminApiService, FacilitySummaryResponse } from '../../../core/services/facility-admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { MatIconModule } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-admin-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NgApexchartsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-bold text-slate-900">Reports</h2>
        <div class="flex items-center gap-3">
          <select [(ngModel)]="selectedFacilityId" (ngModelChange)="onFacilityChange()" class="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm cursor-pointer min-w-[200px]">
            <option [ngValue]="null">All Facilities</option>
            <option *ngFor="let facility of facilities()" [ngValue]="facility.facilityId">{{ facility.facilityName }}</option>
          </select>
          <div class="flex items-center gap-2 border border-slate-200 rounded-xl px-3 bg-white h-10 shadow-sm">
            <span class="text-xs font-semibold text-slate-500">Export:</span>
            <input type="date" [(ngModel)]="exportFromDate" class="text-xs font-medium text-slate-700 border-none outline-none bg-transparent cursor-pointer">
            <span class="text-xs font-semibold text-slate-400">to</span>
            <input type="date" [(ngModel)]="exportToDate" class="text-xs font-medium text-slate-700 border-none outline-none bg-transparent cursor-pointer">
          </div>
          <button class="satori-secondary h-10 px-4" (click)="exportExcel()" [disabled]="exporting() || !exportFromDate || !exportToDate">
            {{ exporting() ? 'Exporting...' : 'Export Excel' }}
          </button>
        </div>
      </div>

      <section class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <article class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all group" *ngFor="let card of statCards(); let i = index">
          <div class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity"
               [ngClass]="i === 0 ? 'from-brand-500 to-brand-700' : (i === 1 ? 'from-emerald-500 to-emerald-700' : (i === 2 ? 'from-rose-500 to-rose-700' : 'from-amber-500 to-amber-700'))"></div>
          <div class="flex items-center justify-between relative z-10">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-500">{{ card.label }}</p>
            <div class="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110"
                 [ngClass]="{
                   'bg-brand-50 text-brand-600 border border-brand-100': i === 0,
                   'bg-emerald-50 text-emerald-600 border border-emerald-100': i === 1,
                   'bg-rose-50 text-rose-600 border border-rose-100': i === 2,
                   'bg-amber-50 text-amber-600 border border-amber-100': i === 3
                 }">
              <mat-icon class="!text-[22px]">{{ card.icon }}</mat-icon>
            </div>
          </div>
          <p class="mt-5 text-3xl font-black tracking-tight text-slate-900 relative z-10">{{ card.value }}</p>
        </article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
          <h3 class="text-lg font-bold text-slate-900">Daily Summary Snapshot</h3>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button (click)="selectDate('')"
                    class="flex flex-col items-center justify-center min-w-[64px] py-2 px-2 rounded-xl border transition-all duration-300"
                    [ngClass]="!reportDate ? 'bg-gradient-to-br from-brand-600 to-brand-800 border-transparent text-white shadow-md shadow-brand-500/20 scale-105' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'">
              <mat-icon class="!text-[20px] mb-1">history</mat-icon>
              <span class="text-[9px] font-bold uppercase tracking-wider">All Time</span>
            </button>
            <button *ngFor="let day of calendarStrip"
                    (click)="selectDate(day.date)"
                    class="flex flex-col items-center justify-center min-w-[64px] py-2 px-2 rounded-xl border transition-all duration-300"
                    [ngClass]="reportDate === day.date ? 'bg-gradient-to-br from-brand-600 to-brand-800 border-transparent text-white shadow-md shadow-brand-500/20 scale-105' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'">
              <span class="text-[9px] font-bold uppercase tracking-wider" [ngClass]="reportDate === day.date ? 'opacity-80' : 'opacity-60'">{{ day.dayName }}</span>
              <span class="text-lg font-black leading-tight mt-0.5">{{ day.dayNum }}</span>
              <span class="text-[9px] font-semibold" [ngClass]="reportDate === day.date ? 'opacity-80' : 'opacity-60'">{{ day.monthName }}</span>
            </button>
            
            <div class="flex items-center ml-1 border-l border-slate-200 pl-3 relative">
               <input type="date" [(ngModel)]="reportDate" (ngModelChange)="selectDate($event)" class="h-full w-full absolute inset-0 opacity-0 cursor-pointer" title="Pick another date">
               <button class="flex flex-col items-center justify-center h-full px-2 text-slate-400 hover:text-brand-600 transition-colors pointer-events-none">
                 <mat-icon>calendar_month</mat-icon>
                 <span class="text-[8px] font-bold mt-1">MORE</span>
               </button>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="grid gap-5 md:grid-cols-3" *ngIf="summary() as s; else noSummary">
            <article class="flex items-center gap-4 rounded-2xl border border-transparent bg-gradient-to-br from-brand-50 to-brand-100/50 p-5 shadow-sm">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow border border-brand-100">
                <mat-icon class="text-brand-600">book_online</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-brand-700/80">Total Bookings</p>
                <p class="text-3xl font-black text-brand-900">{{ s.totalBookings }}</p>
              </div>
            </article>
            <article class="flex items-center gap-4 rounded-2xl border border-transparent bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-sm">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow border border-emerald-100">
                <mat-icon class="text-emerald-600">check_circle_outline</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-700/80">Confirmed</p>
                <p class="text-3xl font-black text-emerald-900">{{ s.confirmedBookings }}</p>
              </div>
            </article>
            <article class="flex items-center gap-4 rounded-2xl border border-transparent bg-gradient-to-br from-rose-50 to-rose-100/50 p-5 shadow-sm">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow border border-rose-100">
                <mat-icon class="text-rose-600">highlight_off</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-rose-700/80">Cancelled</p>
                <p class="text-3xl font-black text-rose-900">{{ s.cancelledBookings }}</p>
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
      <section class="grid gap-6 lg:grid-cols-2">
        <!-- Top Facilities Horizontal Bar Chart -->
        <article class="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <h3 class="text-lg font-bold text-slate-900">Top Facilities</h3>
            <p class="text-xs text-slate-400 mt-0.5">Most active locations</p>
          </div>
          <div class="flex-1 p-6 overflow-y-auto" *ngIf="topFacilities().length; else noDailyData">
            <div class="space-y-3">
              <div *ngFor="let fac of topFacilities(); let i = index" class="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors" (click)="showFacilityChart(fac.name)">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs shadow-sm"
                     [ngClass]="i === 0 ? 'bg-amber-100 text-amber-700' : (i === 1 ? 'bg-slate-200 text-slate-700' : (i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500 border border-slate-200'))">
                  #{{ i + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-end mb-1.5">
                    <span class="text-sm font-bold text-slate-800 truncate pr-2 group-hover:text-brand-600 transition-colors">{{ fac.name }}</span>
                    <span class="text-xs font-black text-slate-900">{{ fac.count }}</span>
                  </div>
                  <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div class="h-full rounded-full bg-brand-500 transition-all duration-500" [style.width.%]="facilityBarWidth(fac.count)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ng-template #noDailyData>
            <div class="flex h-48 items-center justify-center text-sm text-slate-400 flex-col gap-2">
              <mat-icon class="!text-[32px] !h-8 !w-8 text-slate-300">corporate_fare</mat-icon>
              No active facilities
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
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <input type="date" [(ngModel)]="fromDate" class="h-10 w-36 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <span class="text-sm font-semibold text-slate-400">to</span>
              <input type="date" [(ngModel)]="toDate" class="h-10 w-36 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <button class="flex h-10 items-center gap-1.5 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900" (click)="loadTrend()">
              <mat-icon class="!text-[18px]">insights</mat-icon> Generate
            </button>
          </div>
        </div>
        <div class="p-6">
          <div *ngIf="trend()?.points?.length; else noTrendData" class="w-full h-64 relative mt-4">
             <div class="absolute inset-0 flex justify-between items-end gap-2">
                <div *ngFor="let p of trend()!.points" class="flex flex-col items-center flex-1 h-full relative group">
                   <!-- Grouped Bars container -->
                   <div class="absolute bottom-6 w-full flex justify-center items-end gap-1 px-1 h-[calc(100%-1.5rem)]">
                     <!-- Confirmed Bar -->
                     <div class="w-full max-w-[12px] bg-emerald-500 rounded-t-md transition-all hover:brightness-110 cursor-pointer min-h-[4px]"
                          [style.height.%]="getPointHeight(p.confirmedBookings)"
                          [title]="'Confirmed: ' + p.confirmedBookings"></div>
                     <!-- Cancelled Bar -->
                     <div class="w-full max-w-[12px] bg-rose-500 rounded-t-md transition-all hover:brightness-110 cursor-pointer min-h-[4px]"
                          [style.height.%]="getPointHeight(p.cancelledBookings)"
                          [title]="'Cancelled: ' + p.cancelledBookings"></div>
                   </div>
                   <!-- Tooltip showing total -->
                   <div class="absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
                     Total: {{ p.totalBookings }}
                   </div>
                   <!-- X-axis label -->
                   <div class="absolute bottom-0 text-[10px] font-semibold text-slate-400 truncate w-full text-center">{{ p.bookingDate.slice(5) }}</div>
                </div>
             </div>
             
             <!-- Legend for Trend -->
             <div class="absolute -top-4 right-0 flex items-center gap-4 bg-white/80 p-1 rounded backdrop-blur">
               <div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded bg-emerald-500"></span><span class="text-xs font-semibold text-slate-600">Confirmed</span></div>
               <div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded bg-rose-500"></span><span class="text-xs font-semibold text-slate-600">Cancelled</span></div>
             </div>
          </div>
          <div class="h-8"></div>
          <ng-template #noTrendData>
             <div class="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 w-full mt-4">
                <mat-icon class="text-slate-300 mb-2">bar_chart</mat-icon>
                <p class="text-sm font-medium text-slate-500">No trend data available for this period</p>
             </div>
          </ng-template>
        </div>
      </section>

      <!-- Field Breakdown Modal -->
      <div *ngIf="chartData()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div class="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden shadow-brand-500/10">
          <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-brand-600 mb-1">Field Breakdown</p>
              <h3 class="text-xl font-bold text-slate-900">{{ chartData()?.facilityName }}</h3>
              <p class="text-xs text-slate-500 mt-1">Based on {{ chartData()?.totalBookings }} booking(s) for {{ reportDate || 'All Time' }}</p>
            </div>
            <button (click)="closeChart()" class="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm">
              <mat-icon class="!text-[20px]">close</mat-icon>
            </button>
          </div>
          <div class="p-6 overflow-y-auto max-h-[70vh]">
             <apx-chart *ngIf="chartData()?.series?.length"
                [series]="chartData()!.series"
                [chart]="{ type: 'bar', height: 350, toolbar: { show: false }, fontFamily: 'inherit' }"
                [plotOptions]="{ bar: { horizontal: false, columnWidth: '45%', borderRadius: 6 } }"
                [xaxis]="{ categories: chartData()!.categories, labels: { style: { cssClass: 'text-xs font-medium fill-slate-500' } } }"
                [yaxis]="{ labels: { style: { cssClass: 'text-xs font-medium fill-slate-500' } } }"
                [dataLabels]="{ enabled: false }"
                [colors]="['#0ea5e9']"
                [grid]="{ borderColor: '#f1f5f9', strokeDashArray: 4 }"
             ></apx-chart>
             <div *ngIf="!chartData()?.series?.length" class="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 mb-4">
                  <mat-icon class="!text-[32px] !h-8 !w-8 text-slate-300">pie_chart_outline</mat-icon>
                </div>
                <p class="text-base font-semibold text-slate-700">No field data available</p>
                <p class="text-sm mt-1 max-w-xs">Bookings for this facility don't have any custom fields recorded.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.admin-field{display:grid;gap:.35rem;font-size:.8rem;font-weight:600;color:#334155}.admin-field input{border:1px solid #cbd5e1;border-radius:.65rem;padding:.55rem .7rem}`]
})
export class AdminReportsPageComponent implements OnInit {
  reportDate = '';
  fromDate = '';
  toDate = '';
  exportFromDate = '';
  exportToDate = '';
  selectedFacilityId: number | null = null;

  readonly facilities = signal<FacilitySummaryResponse[]>([]);
  readonly summary = signal<OperationalSummaryResponse | null>(null);
  readonly trend = signal<BookingTrendResponse | null>(null);
  readonly topFacilities = signal<{name: string, count: number}[]>([]);
  readonly loadingSummary = signal(false);
  readonly loadingTrend = signal(false);
  readonly exporting = signal(false);
  readonly chartData = signal<{ facilityName: string, totalBookings: number, series: any[], categories: string[] } | null>(null);


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

  readonly calendarStrip = this.buildCalendarStrip();

  private buildCalendarStrip() {
    const strip = [];
    const today = new Date();
    for (let i = -6; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      strip.push({
        date: this.toInputDate(d),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return strip;
  }

  selectDate(d: string) {
    this.reportDate = d;
    
    if (!d) {
       // "All Time" selected - set trend to past 30 days
       const today = new Date();
       const from = new Date(today);
       from.setDate(from.getDate() - 29);
       this.fromDate = this.toInputDate(from);
       this.toDate = this.toInputDate(today);
    } else {
       const selectedDateObj = new Date(d + 'T00:00:00');
       const from = new Date(selectedDateObj);
       from.setDate(from.getDate() - 6);
       this.fromDate = this.toInputDate(from);
       this.toDate = d;
    }
    
    void this.loadSummary();
    void this.loadTrend();
    void this.loadDailyReport();
  }

  onFacilityChange() {
    void this.loadSummary();
    void this.loadTrend();
    void this.loadDailyReport();
    
    if (this.selectedFacilityId != null && String(this.selectedFacilityId).trim() !== '') {
      const facId = Number(this.selectedFacilityId);
      const selectedFacName = this.facilities().find(f => f.facilityId === facId)?.facilityName;
      if (selectedFacName) {
        this.showFacilityChart(selectedFacName);
      }
    } else {
      this.closeChart();
    }
  }

  async showFacilityChart(facName: string): Promise<void> {
    const fac = this.facilities().find(f => f.facilityName === facName);
    if (!fac) return;
    
    try {
      const bookings = await firstValueFrom(this.adminApi.searchBookings({
        facilityId: fac.facilityId,
        bookingDate: this.reportDate || null
      }));

      const counts: Record<string, number> = {};
      let hasAnswers = false;
      for (const b of bookings) {
        if (b.answers && b.answers.length > 0) {
          for (const ans of b.answers) {
            hasAnswers = true;
            const key = `${ans.label}: ${ans.value}`;
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      }

      if (hasAnswers) {
        const categories = Object.keys(counts);
        const data = Object.values(counts);
        this.chartData.set({
          facilityName: facName,
          totalBookings: bookings.length,
          categories,
          series: [{ name: 'Count', data }]
        });
      } else {
        this.chartData.set({ facilityName: facName, totalBookings: bookings.length, categories: [], series: [] });
      }
    } catch (e) {
       console.error(e);
       this.toastService.show('Failed to load facility data', 'error');
    }
  }

  closeChart() {
    this.chartData.set(null);
  }

  getLinePoints(): string {
    const points = this.trend()?.points ?? [];
    if (!points.length) return '';
    const max = this.trendMax() || 1;
    return points.map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - ((p.totalBookings / max) * 100);
      return `${x},${y}`;
    }).join(' ');
  }

  getAreaPoints(): string {
    const points = this.trend()?.points ?? [];
    if (!points.length) return '';
    const line = this.getLinePoints();
    return `0,100 ${line} 100,100`;
  }

  getPointHeight(value: number): number {
    const max = this.trendMax() || 1;
    return (value / max) * 100;
  }

  facilityBarWidth(count: number): number {
    const max = Math.max(...this.topFacilities().map(f => f.count), 1);
    return (count / max) * 100;
  }

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly facilityApi: FacilityAdminApiService,
    private readonly toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 6);

    this.reportDate = this.toInputDate(today);
    this.fromDate = this.toInputDate(from);
    this.toDate = this.toInputDate(today);
    this.exportFromDate = this.fromDate;
    this.exportToDate = this.toDate;

    await this.loadFacilities();
    void this.loadSummary();
    void this.loadTrend();
    void this.loadDailyReport();
  }

  private async loadFacilities(): Promise<void> {
    try {
      const facs = await firstValueFrom(this.facilityApi.getFacilities());
      this.facilities.set(facs);
    } catch (err) {
      console.error('Failed to load facilities', err);
    }
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
      const data = await firstValueFrom(this.adminApi.getOperationalSummary(this.reportDate || null, this.selectedFacilityId));
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
      const data = await firstValueFrom(this.adminApi.getBookingTrend(this.fromDate, this.toDate, this.selectedFacilityId));
      this.trend.set(data);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load booking trend', 'error');
    } finally {
      this.loadingTrend.set(false);
    }
  }

  async loadDailyReport(): Promise<void> {
    try {
      const data = await firstValueFrom(this.adminApi.getDailyReport());
      let arr = Object.keys(data).map(name => ({ name, count: data[name] }));
      
      // Ensure all facilities are represented even if they have 0 bookings today
      for (const fac of this.facilities()) {
        if (!arr.find(f => f.name === fac.facilityName)) {
           arr.push({ name: fac.facilityName, count: 0 });
        }
      }
      
      if (this.selectedFacilityId != null && String(this.selectedFacilityId).trim() !== '') {
         const facId = Number(this.selectedFacilityId);
         const selectedFacName = this.facilities().find(f => f.facilityId === facId)?.facilityName;
         if (selectedFacName) {
             arr = arr.filter(f => f.name === selectedFacName);
         } else {
             arr = [];
         }
      } else {
         arr.sort((a, b) => b.count - a.count);
      }
      this.topFacilities.set(arr);
    } catch (error) {
      console.error('Failed to load daily report', error);
    }
  }

  async exportExcel(): Promise<void> {
    if (this.exporting() || !this.exportFromDate || !this.exportToDate) {
      return;
    }

    this.exporting.set(true);
    try {
      const trend = await firstValueFrom(this.adminApi.getBookingTrend(this.exportFromDate, this.exportToDate, this.selectedFacilityId));
      
      let total = 0;
      let confirmed = 0;
      let cancelled = 0;
      
      for (const p of trend.points) {
         total += p.totalBookings;
         confirmed += p.confirmedBookings;
         cancelled += p.cancelledBookings;
      }
      
      const cancellationRate = total > 0 ? ((cancelled * 100) / total).toFixed(2) : '0.00';
      
      const summary = {
         bookingDate: `${this.exportFromDate} to ${this.exportToDate}`,
         totalBookings: total,
         confirmedBookings: confirmed,
         cancelledBookings: cancelled,
         pendingBookings: Math.max(0, total - confirmed - cancelled),
         cancellationRate: cancellationRate
      };

      const html = this.buildExcelHtml(summary, trend);
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const fileName = `reports_${this.exportFromDate}_to_${this.exportToDate}.xls`;
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

  private buildExcelHtml(summary: any, trend: BookingTrendResponse): string {
    const escape = (value: unknown): string =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const summaryRows = [
      ['Metric', 'Value'],
      ['Report Range', summary.bookingDate],
      ['Total Bookings', summary.totalBookings],
      ['Confirmed Bookings', summary.confirmedBookings],
      ['Cancelled Bookings', summary.cancelledBookings],
      ['Pending Bookings', summary.pendingBookings],
      ['Cancellation Rate (%)', summary.cancellationRate]
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
