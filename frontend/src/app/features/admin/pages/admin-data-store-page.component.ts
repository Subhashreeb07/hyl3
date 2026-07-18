import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { AdminBookingSearchItem } from '../../../core/models/admin.models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import {
  FacilityAdminApiService,
  FacilitySummaryResponse,
  FieldSummaryResponse
} from '../../../core/services/facility-admin-api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-data-store-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <header class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <mat-icon class="text-brand-600 !text-[22px]">storage</mat-icon>
          <p class="text-[11px] font-bold uppercase tracking-widest text-brand-600">Admin Data Store</p>
        </div>
        <h2 class="mt-1 text-2xl font-bold text-slate-900">Employee Submission Data</h2>
        <p class="mt-1 text-sm text-slate-500">Use multi-select and advanced filters to find precise submissions, then export clean Excel reports.</p>
      </header>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label class="grid gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Booking Date (Exact)
            <input type="date"
                   [(ngModel)]="selectedDate"
                   class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </label>

          <label class="grid gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Date From
            <input type="date"
                   [(ngModel)]="selectedDateFrom"
                   class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </label>

          <label class="grid gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Date To
            <input type="date"
                   [(ngModel)]="selectedDateTo"
                   class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </label>

          <label class="grid gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider md:col-span-2 xl:col-span-2">
            Employee Search (ID / Name)
            <input type="text"
                   [(ngModel)]="employeeQuery"
                   placeholder="EMP001 or John"
                   class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </label>

          <div class="flex items-end gap-2 xl:justify-end xl:col-span-1">
            <button mat-flat-button color="primary"
                    class="!h-10 !rounded-xl"
                    [disabled]="loading()"
                    (click)="loadData()">
              <mat-icon class="!text-[18px] !h-[18px] !w-[18px] mr-1">filter_alt</mat-icon>
              Apply
            </button>
            <button mat-stroked-button
                    class="!h-10 !rounded-xl"
                    [disabled]="loading()"
                    (click)="resetFilters()">
              Reset
            </button>
            <button mat-flat-button
                    class="!h-10 !rounded-xl !bg-emerald-600 !text-white"
                    [disabled]="loading() || filteredBookings().length === 0"
                    (click)="exportExcel()">
              <mat-icon class="!text-[18px] !h-[18px] !w-[18px] mr-1">download</mat-icon>
              Export Excel
            </button>
          </div>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl border border-slate-200 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Facilities (Multi-select)</p>
            <div class="mt-2 max-h-36 space-y-1 overflow-auto pr-1 text-sm text-slate-700">
              <label class="flex items-center gap-2">
                <input type="checkbox" [checked]="selectedFacilityIds.length === 0" (change)="clearFacilitySelection()" />
                <span>All Facilities</span>
              </label>
              <label class="flex items-center gap-2" *ngFor="let facility of facilities()">
                <input
                  type="checkbox"
                  [checked]="selectedFacilityIds.includes(facility.facilityId)"
                  (change)="toggleFacility(facility.facilityId)"
                />
                <span>{{ facility.facilityName }}</span>
              </label>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status (Multi-select)</p>
            <div class="mt-2 space-y-1 text-sm text-slate-700">
              <label class="flex items-center gap-2">
                <input type="checkbox" [checked]="selectedStatuses.length === 0" (change)="clearStatusSelection()" />
                <span>All Status</span>
              </label>
              <label class="flex items-center gap-2" *ngFor="let status of statusOptions">
                <input
                  type="checkbox"
                  [checked]="selectedStatuses.includes(status.value)"
                  (change)="toggleStatus(status.value)"
                />
                <span>{{ status.label }}</span>
              </label>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Department (Multi-select)</p>
            <div class="mt-2 max-h-36 space-y-1 overflow-auto pr-1 text-sm text-slate-700">
              <label class="flex items-center gap-2">
                <input type="checkbox" [checked]="selectedDepartments.length === 0" (change)="clearDepartmentSelection()" />
                <span>All Departments</span>
              </label>
              <label class="flex items-center gap-2" *ngFor="let department of departmentOptions()">
                <input
                  type="checkbox"
                  [checked]="selectedDepartments.includes(department)"
                  (change)="toggleDepartment(department)"
                />
                <span>{{ department }}</span>
              </label>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Advanced Field Filters (Auto from Facility)</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <div class="rounded-lg border border-slate-200 p-2">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Field Labels</p>
                <div class="mt-1 max-h-28 space-y-1 overflow-auto pr-1 text-xs text-slate-700">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" [checked]="selectedAnswerFields.length === 0" (change)="clearAnswerFieldSelection()" />
                    <span>All Fields</span>
                  </label>
                  <label class="flex items-center gap-2" *ngFor="let fieldLabel of availableAnswerFields()">
                    <input
                      type="checkbox"
                      [checked]="selectedAnswerFields.includes(fieldLabel)"
                      (change)="toggleAnswerField(fieldLabel)"
                    />
                    <span>{{ fieldLabel }}</span>
                  </label>
                </div>
              </div>
              <div class="rounded-lg border border-slate-200 p-2">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Field Values</p>
                <div class="mt-1 max-h-28 space-y-1 overflow-auto pr-1 text-xs text-slate-700">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" [checked]="selectedAnswerValues.length === 0" (change)="clearAnswerValueSelection()" />
                    <span>All Values</span>
                  </label>
                  <label class="flex items-center gap-2" *ngFor="let answerValue of availableAnswerValues()">
                    <input
                      type="checkbox"
                      [checked]="selectedAnswerValues.includes(answerValue)"
                      (change)="toggleAnswerValue(answerValue)"
                    />
                    <span>{{ answerValue }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Filtered Total</p>
            <p class="mt-1 text-xl font-bold text-emerald-800">{{ filteredBookings().length }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-600">Accepted / Confirmed</p>
            <p class="mt-1 text-xl font-bold text-slate-800">{{ confirmedCount() }}</p>
          </div>
          <div class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-rose-700">Cancelled</p>
            <p class="mt-1 text-xl font-bold text-rose-800">{{ cancelledCount() }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <p class="text-sm font-bold text-slate-800">Results</p>
          <p class="text-xs font-semibold text-slate-500">{{ filteredBookings().length }} / {{ bookings().length }} record(s)</p>
        </div>

        <div *ngIf="loading()" class="p-8 text-sm text-slate-500">Loading data from database...</div>

        <div *ngIf="!loading() && filteredBookings().length === 0" class="p-10 text-center">
          <p class="text-sm font-semibold text-slate-600">No records found for selected filters.</p>
          <p class="mt-1 text-xs text-slate-400">Try changing date, status, facility, employee, department, or answer filters.</p>
        </div>

        <div *ngIf="!loading() && filteredBookings().length > 0" class="max-h-[60vh] overflow-auto">
          <table class="w-full min-w-[1250px] text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Booking ID</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Facility</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Employee ID</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Employee Name</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Department</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Booking Date</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Created At</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cancelled At</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Submitted Data</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of filteredBookings(); let odd = odd"
                  [class.bg-slate-50]="odd"
                  class="border-b border-slate-100 last:border-0 align-top">
                <td class="px-4 py-3 text-slate-700 font-semibold">{{ row.bookingId }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.facilityName }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.employeeId }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.employeeName || '—' }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.department || '—' }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-lg px-2 py-1 text-[11px] font-bold"
                        [ngClass]="{
                          'bg-emerald-50 text-emerald-700 border border-emerald-200': row.status === 'CONFIRMED',
                          'bg-rose-50 text-rose-700 border border-rose-200': row.status === 'CANCELLED'
                        }">{{ row.status === 'CONFIRMED' ? 'ACCEPTED' : row.status }}</span>
                </td>
                <td class="px-4 py-3 text-slate-700">{{ row.bookingDate }}</td>
                <td class="px-4 py-3 text-slate-600 text-xs">{{ row.createdAt | date:'MMM d, y · h:mm a' }}</td>
                <td class="px-4 py-3 text-slate-600 text-xs">{{ row.cancelledAt ? (row.cancelledAt | date:'MMM d, y · h:mm a') : '—' }}</td>
                <td class="px-4 py-3 text-xs text-slate-700">
                  <!-- Mobility: show parsed route + stop -->
                  <ng-container *ngIf="isMobility(row); else nonMobility">
                    <div *ngIf="row.selectedRoute || row.selectedStop; else noAnswers" class="space-y-1">
                      <div *ngIf="row.selectedRoute" class="flex items-center gap-1.5">
                        <span class="font-semibold text-slate-500">Route:</span>
                        <span class="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{{ row.selectedRoute }}</span>
                      </div>
                      <div *ngIf="row.selectedStop" class="flex items-center gap-1.5">
                        <span class="font-semibold text-slate-500">Stop:</span>
                        <span class="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">{{ row.selectedStop }}</span>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Food or Team Event (food answers) -->
                  <ng-template #nonMobility>
                    <div *ngIf="(row.answers ?? []).length > 0; else noAnswers" class="space-y-1">
                      <ng-container *ngFor="let ans of (row.answers ?? [])">
                        <!-- Veg / Non-veg answer: show coloured badge -->
                        <ng-container *ngIf="isVegAnswer(ans.value); else genericAnswer">
                          <div class="flex items-center gap-1.5">
                            <span class="font-semibold text-slate-500">{{ ans.label }}:</span>
                            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold border"
                                  [ngClass]="{
                                    'bg-emerald-50 text-emerald-700 border-emerald-200': isVeg(ans.value),
                                    'bg-orange-50 text-orange-700 border-orange-200': !isVeg(ans.value)
                                  }">
                              {{ ans.value }}
                            </span>
                          </div>
                        </ng-container>
                        <!-- Generic answer (non food) -->
                        <ng-template #genericAnswer>
                          <div>
                            <span class="font-semibold">{{ ans.label }}:</span>
                            <span class="ml-1">{{ ans.value }}</span>
                          </div>
                        </ng-template>
                        <!-- Team Event: also show route/stop if present -->
                      </ng-container>
                      <!-- Team Event may also have cab selection -->
                      <ng-container *ngIf="isTeamEvent(row) && (row.selectedRoute || row.selectedStop)">
                        <div *ngIf="row.selectedRoute" class="flex items-center gap-1.5 mt-1">
                          <span class="font-semibold text-slate-500">Route:</span>
                          <span class="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{{ row.selectedRoute }}</span>
                        </div>
                        <div *ngIf="row.selectedStop" class="flex items-center gap-1.5">
                          <span class="font-semibold text-slate-500">Stop:</span>
                          <span class="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">{{ row.selectedStop }}</span>
                        </div>
                      </ng-container>
                    </div>
                  </ng-template>
                  <ng-template #noAnswers>—</ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `
})
export class AdminDataStorePageComponent implements OnInit {
  readonly loading = signal(false);
  readonly bookings = signal<AdminBookingSearchItem[]>([]);
  readonly facilities = signal<FacilitySummaryResponse[]>([]);
  private readonly facilityFieldCache = new Map<number, FieldSummaryResponse[]>();
  private selectedFacilityFieldLabels: string[] = [];

  selectedDate = '';
  selectedDateFrom = '';
  selectedDateTo = '';
  employeeQuery = '';
  selectedFacilityIds: number[] = [];
  selectedStatuses: string[] = [];
  selectedDepartments: string[] = [];
  selectedAnswerFields: string[] = [];
  selectedAnswerValues: string[] = [];

  readonly statusOptions = [
    { value: 'CONFIRMED', label: 'Accepted' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ] as const;

  readonly normalizedBookings = computed(() =>
    this.bookings().map((item) => ({
      ...item,
      answers: item.answers ?? []
    }))
  );

  // ── Category helpers ──
  isMobility(row: AdminBookingSearchItem): boolean {
    return (row.facilityCategory ?? '').toLowerCase() === 'mobility';
  }
  isTeamEvent(row: AdminBookingSearchItem): boolean {
    const cat = (row.facilityCategory ?? '').toLowerCase();
    return cat === 'events' || cat === 'team event' || cat === 'team events';
  }
  /** True if the answer value looks like a veg/non-veg food preference. */
  isVegAnswer(value: string): boolean {
    const v = (value ?? '').trim().toLowerCase();
    return v === 'veg' || v === 'non-veg' || v === 'non veg' || v === 'vegetarian' || v === 'non-vegetarian';
  }
  isVeg(value: string): boolean {
    const v = (value ?? '').trim().toLowerCase();
    return v === 'veg' || v === 'vegetarian';
  }

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly facilityApi: FacilityAdminApiService,
    private readonly toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFacilities();
    await this.loadData();
    await this.refreshSelectedFacilityFields();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const serverDate = this.selectedDate && !this.selectedDateFrom && !this.selectedDateTo
        ? this.selectedDate
        : null;
      const serverFacilityId = this.selectedFacilityIds.length === 1 ? this.selectedFacilityIds[0] : null;
      const serverStatus = this.selectedStatuses.length === 1 ? this.selectedStatuses[0] : null;
      const employeeSearch = this.employeeQuery.trim();
      const serverEmployeeId = /^emp\w*$/i.test(employeeSearch) ? employeeSearch : null;

      const data = await firstValueFrom(this.adminApi.searchBookings({
        facilityId: serverFacilityId,
        employeeId: serverEmployeeId,
        status: serverStatus,
        bookingDate: serverDate
      }));
      this.bookings.set(data ?? []);
      this.syncDynamicFilterSelections();
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load data store records', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  resetFilters(): void {
    this.selectedDate = '';
    this.selectedDateFrom = '';
    this.selectedDateTo = '';
    this.employeeQuery = '';
    this.selectedFacilityIds = [];
    this.selectedStatuses = [];
    this.selectedDepartments = [];
    this.selectedAnswerFields = [];
    this.selectedAnswerValues = [];
    this.selectedFacilityFieldLabels = [];
    void this.loadData();
  }

  exportExcel(): void {
    const rows = this.filteredBookings();
    if (!rows.length) {
      this.toastService.show('No data to export', 'error');
      return;
    }

    const answerColumns = Array.from(
      new Set(
        rows.flatMap((row) => (row.answers ?? []).map((ans) => ans.label?.trim()).filter(Boolean) as string[])
      )
    );

    // Include route/stop columns when any row has cab data
    const hasCabData = rows.some((r) => r.selectedRoute || r.selectedStop);

    const escape = (value: unknown): string =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const headers = [
      'Booking ID',
      'Facility',
      'Category',
      'Employee ID',
      'Employee Name',
      'Department',
      'Status',
      'Booking Date',
      'Created At',
      'Cancelled At',
      ...answerColumns,
      ...(hasCabData ? ['Selected Route', 'Selected Stop'] : [])
    ];

    const tableRows = rows.map((row) => {
      const answerMap = new Map<string, string>();
      (row.answers ?? []).forEach((ans) => {
        const key = ans.label?.trim();
        if (key) {
          answerMap.set(key, ans.value ?? '');
        }
      });

      const cells = [
        row.bookingId,
        row.facilityName,
        row.facilityCategory ?? '',
        row.employeeId,
        row.employeeName ?? '',
        row.department ?? '',
        this.normalizeStatus(row.status) === 'CONFIRMED' ? 'ACCEPTED' : row.status,
        row.bookingDate,
        row.createdAt,
        row.cancelledAt ?? '',
        ...answerColumns.map((col) => answerMap.get(col) ?? ''),
        ...(hasCabData ? [row.selectedRoute ?? '', row.selectedStop ?? ''] : [])
      ];

      return `<tr>${cells.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`;
    }).join('');

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #d1d5db; padding: 6px; font-size: 12px; text-align: left; }
            th { background: #f8fafc; font-weight: 700; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>${headers.map((header) => `<th>${escape(header)}</th>`).join('')}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const stamp = this.selectedDate || this.selectedDateFrom || this.selectedDateTo || 'all';
    anchor.download = `admin-data-store-${stamp}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);

    this.toastService.show('Excel exported successfully', 'success');
  }

  private async loadFacilities(): Promise<void> {
    try {
      const facilities = await firstValueFrom(this.facilityApi.getFacilities());
      this.facilities.set(facilities ?? []);
    } catch {
      this.facilities.set([]);
    }
  }

  toggleFacility(facilityId: number): void {
    this.selectedFacilityIds = this.toggleFromArray(this.selectedFacilityIds, facilityId);
    void this.refreshSelectedFacilityFields();
  }

  clearFacilitySelection(): void {
    this.selectedFacilityIds = [];
    this.selectedFacilityFieldLabels = [];
    this.syncDynamicFilterSelections();
  }

  toggleStatus(status: string): void {
    this.selectedStatuses = this.toggleFromArray(this.selectedStatuses, status);
  }

  clearStatusSelection(): void {
    this.selectedStatuses = [];
  }

  toggleDepartment(department: string): void {
    this.selectedDepartments = this.toggleFromArray(this.selectedDepartments, department);
  }

  clearDepartmentSelection(): void {
    this.selectedDepartments = [];
  }

  toggleAnswerField(fieldLabel: string): void {
    this.selectedAnswerFields = this.toggleFromArray(this.selectedAnswerFields, fieldLabel);
    this.syncDynamicFilterSelections();
  }

  clearAnswerFieldSelection(): void {
    this.selectedAnswerFields = [];
    this.syncDynamicFilterSelections();
  }

  toggleAnswerValue(value: string): void {
    this.selectedAnswerValues = this.toggleFromArray(this.selectedAnswerValues, value);
  }

  clearAnswerValueSelection(): void {
    this.selectedAnswerValues = [];
  }

  departmentOptions(): string[] {
    return Array.from(
      new Set(
        this.baseFilteredRows()
          .map((item) => item.department?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((a, b) => a.localeCompare(b));
  }

  availableAnswerFields(): string[] {
    const fromFacilities = this.selectedFacilityFieldLabels;
    if (this.selectedFacilityIds.length > 0) {
      return [...fromFacilities].sort((a, b) => a.localeCompare(b));
    }
    return Array.from(
      new Set(
        this.baseFilteredRows().flatMap((row) =>
          (row.answers ?? [])
            .map((answer) => answer.label?.trim())
            .filter((label): label is string => !!label)
        )
      )
    ).sort((a, b) => a.localeCompare(b));
  }

  availableAnswerValues(): string[] {
    const selectedFieldSet = new Set(this.selectedAnswerFields);
    return Array.from(
      new Set(
        this.baseFilteredRows().flatMap((row) =>
          (row.answers ?? [])
            .filter((answer) => {
              const label = (answer.label ?? '').trim();
              return selectedFieldSet.size === 0 || selectedFieldSet.has(label);
            })
            .map((answer) => answer.value?.trim())
            .filter((value): value is string => !!value)
        )
      )
    ).sort((a, b) => a.localeCompare(b));
  }

  filteredBookings(): AdminBookingSearchItem[] {
    const selectedFieldSet = new Set(this.selectedAnswerFields);
    const selectedValueSet = new Set(this.selectedAnswerValues);

    return this.baseFilteredRows().filter((row) => {
      if (selectedFieldSet.size === 0 && selectedValueSet.size === 0) {
        return true;
      }

      return (row.answers ?? []).some((answer) => {
        const label = (answer.label ?? '').trim();
        const value = (answer.value ?? '').trim();
        const fieldMatches = selectedFieldSet.size === 0 || selectedFieldSet.has(label);
        const valueMatches = selectedValueSet.size === 0 || selectedValueSet.has(value);
        return fieldMatches && valueMatches;
      });
    });
  }

  confirmedCount(): number {
    return this.filteredBookings().filter((item) => this.normalizeStatus(item.status) === 'CONFIRMED').length;
  }

  cancelledCount(): number {
    return this.filteredBookings().filter((item) => this.normalizeStatus(item.status) === 'CANCELLED').length;
  }

  private baseFilteredRows(): AdminBookingSearchItem[] {
    const exactDate = this.selectedDate.trim();
    const fromDate = this.selectedDateFrom.trim();
    const toDate = this.selectedDateTo.trim();
    const employeeTerm = this.employeeQuery.trim().toLowerCase();

    return this.normalizedBookings().filter((row) => {
      if (exactDate && row.bookingDate !== exactDate) {
        return false;
      }
      if (fromDate && row.bookingDate < fromDate) {
        return false;
      }
      if (toDate && row.bookingDate > toDate) {
        return false;
      }

      if (this.selectedFacilityIds.length > 0 && !this.selectedFacilityIds.includes(row.facilityId)) {
        return false;
      }
      if (this.selectedStatuses.length > 0 && !this.selectedStatuses.includes(this.normalizeStatus(row.status))) {
        return false;
      }

      const department = (row.department ?? '').trim();
      if (this.selectedDepartments.length > 0 && !this.selectedDepartments.includes(department)) {
        return false;
      }

      if (!employeeTerm) {
        return true;
      }

      const employeeId = (row.employeeId ?? '').toLowerCase();
      const employeeName = (row.employeeName ?? '').toLowerCase();
      return employeeId.includes(employeeTerm) || employeeName.includes(employeeTerm);
    });
  }

  private async refreshSelectedFacilityFields(): Promise<void> {
    if (this.selectedFacilityIds.length === 0) {
      this.selectedFacilityFieldLabels = [];
      this.syncDynamicFilterSelections();
      return;
    }

    for (const facilityId of this.selectedFacilityIds) {
      if (this.facilityFieldCache.has(facilityId)) {
        continue;
      }
      try {
        const fields = await firstValueFrom(this.facilityApi.getFacilityFields(facilityId));
        this.facilityFieldCache.set(facilityId, fields ?? []);
      } catch {
        this.facilityFieldCache.set(facilityId, []);
      }
    }

    this.selectedFacilityFieldLabels = Array.from(
      new Set(
        this.selectedFacilityIds.flatMap((facilityId) =>
          (this.facilityFieldCache.get(facilityId) ?? [])
            .map((field) => field.label?.trim())
            .filter((label): label is string => !!label)
        )
      )
    );

    this.syncDynamicFilterSelections();
  }

  private syncDynamicFilterSelections(): void {
    const availableFields = new Set(this.availableAnswerFields());
    this.selectedAnswerFields = this.selectedAnswerFields.filter((field) => availableFields.has(field));

    const availableValues = new Set(this.availableAnswerValues());
    this.selectedAnswerValues = this.selectedAnswerValues.filter((value) => availableValues.has(value));
  }

  private normalizeStatus(status: string | null | undefined): string {
    const value = (status ?? '').trim().toUpperCase();
    if (value === 'ACCEPTED') {
      return 'CONFIRMED';
    }
    return value;
  }

  private toggleFromArray<T>(current: T[], value: T): T[] {
    return current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
  }
}
