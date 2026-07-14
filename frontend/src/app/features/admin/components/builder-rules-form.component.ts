import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-builder-rules-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    .field-input {
      width: 100%; border: 1px solid #cbd5e1; border-radius: 0.5rem;
      padding: 0.65rem 0.875rem; font-size: 0.875rem; background: #fff; outline: none;
    }
    .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
    .pill {
      display: inline-flex; align-items: center; gap: 4px;
      border-radius: 6px; border: 1px solid #cbd5e1;
      background: #fff; padding: 0.4rem 0.85rem;
      font-size: 0.85rem; font-weight: 500; color: #475569;
      cursor: pointer; user-select: none; transition: all 0.15s;
    }
    .pill:hover { border-color: #94a3b8; background: #f8fafc; }
    .pill.active { border-color: #4f46e5; background: #eef2ff; color: #4338ca; font-weight: 600; }
    .admin-field {
      display: flex; flex-direction: column; gap: 0.4rem;
      font-size: 0.85rem; font-weight: 600; color: #1e293b;
    }
    .admin-field input, .admin-field textarea, .admin-field select {
      border: 1px solid #cbd5e1; border-radius: 0.5rem;
      padding: 0.65rem 0.875rem; background: #ffffff;
      font-size: 0.875rem; color: #0f172a;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .admin-field input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
    .rules-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .rules-card h4 { font-size: 1rem; font-weight: 600; color: #0f172a; margin-bottom: 0.25rem; }
    .rules-card p.subtitle { font-size: 0.875rem; color: #64748b; margin-bottom: 1.25rem; }
    .mode-toggle {
      display: inline-flex; border: 1.5px solid #6366f1; border-radius: 8px; overflow: hidden;
    }
    .mode-btn {
      padding: 0.55rem 1.4rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s; background: #fff; color: #6366f1; border: none;
    }
    .mode-btn.active { background: #6366f1; color: #fff; }
    .mode-btn:not(.active):hover { background: #eef2ff; }
  `],
  template: `
    <form [formGroup]="form" class="space-y-6 py-4">

      <!-- ── Booking Mode Toggle ── -->
      <section class="rules-card">
        <h4>Booking Duration</h4>
        <p class="subtitle">Choose whether this facility supports single-day or multi-day bookings.</p>
        <div class="mode-toggle">
          <button type="button" class="mode-btn" [class.active]="isSingleDay" (click)="setMode('single')">
            <span class="material-icons-outlined text-[1.1em] mr-1 align-middle">today</span> Single Day
          </button>
          <button type="button" class="mode-btn" [class.active]="!isSingleDay" (click)="setMode('multi')">
            <span class="material-icons-outlined text-[1.1em] mr-1 align-middle">date_range</span> Multiple Days
          </button>
        </div>
      </section>

      <!-- ── Multi-Day: Facility Availability ── -->
      <section *ngIf="!isSingleDay" class="rules-card">
        <h4>Facility Availability</h4>
        <p class="subtitle">Define the date range when this facility is open for bookings.</p>
        <div class="grid gap-6 md:grid-cols-2">

          <!-- From Date Picker -->
          <label class="admin-field">
            Available From Date
            <div class="relative">
              <button type="button" (click)="openCalendar('from')"
                      class="group flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md">
                <span class="material-icons-outlined text-indigo-600 transition-colors group-hover:text-indigo-700" style="font-size:18px">calendar_month</span>
                <span class="flex-1 text-left font-normal" [class.text-slate-400]="!form.get('facilityAvailableFromDate')?.value">
                  {{ getDateLabel('facilityAvailableFromDate') }}
                </span>
                <span *ngIf="form.get('facilityAvailableFromDate')?.value"
                      (click)="clearDate('facilityAvailableFromDate', $event)"
                      class="material-icons-outlined text-slate-300 transition-colors hover:text-red-400" style="font-size:16px">close</span>
                <span class="material-icons-outlined text-slate-400 transition-transform duration-200"
                      [style.transform]="activeCalField() === 'from' ? 'rotate(180deg)' : 'rotate(0)'"
                      style="font-size:16px">keyboard_arrow_down</span>
              </button>
              <div *ngIf="activeCalField() === 'from'" (click)="closeCalendar()" class="fixed inset-0 z-40"></div>
              <div *ngIf="activeCalField() === 'from'"
                   class="absolute left-0 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white"
                   style="top:calc(100% + 6px);width:min(310px,calc(100vw - 32px));box-shadow:0 25px 50px -12px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.04);">
                <div class="flex items-center justify-between px-5 py-4"
                     style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e4d8c 100%)">
                  <button type="button" (click)="prevCalMonth(); $event.stopPropagation()"
                          class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white">
                    <span class="material-icons-outlined" style="font-size:20px">chevron_left</span>
                  </button>
                  <p class="text-base font-bold tracking-tight text-white">{{ calMonthLabel() }}</p>
                  <button type="button" (click)="nextCalMonth(); $event.stopPropagation()"
                          class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white">
                    <span class="material-icons-outlined" style="font-size:20px">chevron_right</span>
                  </button>
                </div>
                <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                  <span *ngFor="let wd of weekDayLabels"
                        class="py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ wd }}</span>
                </div>
                <div class="grid grid-cols-7 gap-0.5 p-3">
                  <ng-container *ngFor="let cell of calDays()">
                    <div *ngIf="cell.date === null" class="h-9 w-full"></div>
                    <button *ngIf="cell.date !== null" type="button"
                            (click)="selectCalDate(cell.date); $event.stopPropagation()"
                            class="relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-150"
                            [ngClass]="{
                              'bg-slate-900 text-white shadow font-bold': isDateSelected('facilityAvailableFromDate', cell.date),
                              'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-inset ring-indigo-200': isCalToday(cell.date) && !isDateSelected('facilityAvailableFromDate', cell.date),
                              'text-slate-700 hover:bg-slate-100': !isCalToday(cell.date) && !isDateSelected('facilityAvailableFromDate', cell.date)
                            }">
                      {{ cell.num }}
                      <span *ngIf="isCalToday(cell.date) && !isDateSelected('facilityAvailableFromDate', cell.date)"
                            class="absolute bottom-1 left-1/2 h-1 w-1 rounded-full bg-indigo-500"
                            style="transform:translateX(-50%)"></span>
                    </button>
                  </ng-container>
                </div>
                <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <button type="button" (click)="calToday(); $event.stopPropagation()"
                          class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700">Today</button>
                  <p class="text-xs font-medium text-slate-500">
                    {{ form.get('facilityAvailableFromDate')?.value ? getDateLabel('facilityAvailableFromDate') : 'No date selected' }}
                  </p>
                </div>
              </div>
            </div>
          </label>

          <!-- To Date Picker -->
          <label class="admin-field">
            Available To Date
            <div class="relative">
              <button type="button" (click)="openCalendar('to')"
                      class="group flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md">
                <span class="material-icons-outlined text-indigo-600 transition-colors group-hover:text-indigo-700" style="font-size:18px">calendar_month</span>
                <span class="flex-1 text-left font-normal" [class.text-slate-400]="!form.get('facilityAvailableToDate')?.value">
                  {{ getDateLabel('facilityAvailableToDate') }}
                </span>
                <span *ngIf="form.get('facilityAvailableToDate')?.value"
                      (click)="clearDate('facilityAvailableToDate', $event)"
                      class="material-icons-outlined text-slate-300 transition-colors hover:text-red-400" style="font-size:16px">close</span>
                <span class="material-icons-outlined text-slate-400 transition-transform duration-200"
                      [style.transform]="activeCalField() === 'to' ? 'rotate(180deg)' : 'rotate(0)'"
                      style="font-size:16px">keyboard_arrow_down</span>
              </button>
              <div *ngIf="activeCalField() === 'to'" (click)="closeCalendar()" class="fixed inset-0 z-40"></div>
              <div *ngIf="activeCalField() === 'to'"
                   class="absolute left-0 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white"
                   style="top:calc(100% + 6px);width:min(310px,calc(100vw - 32px));box-shadow:0 25px 50px -12px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.04);">
                <div class="flex items-center justify-between px-5 py-4"
                     style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e4d8c 100%)">
                  <button type="button" (click)="prevCalMonth(); $event.stopPropagation()"
                          class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white">
                    <span class="material-icons-outlined" style="font-size:20px">chevron_left</span>
                  </button>
                  <p class="text-base font-bold tracking-tight text-white">{{ calMonthLabel() }}</p>
                  <button type="button" (click)="nextCalMonth(); $event.stopPropagation()"
                          class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white">
                    <span class="material-icons-outlined" style="font-size:20px">chevron_right</span>
                  </button>
                </div>
                <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                  <span *ngFor="let wd of weekDayLabels"
                        class="py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ wd }}</span>
                </div>
                <div class="grid grid-cols-7 gap-0.5 p-3">
                  <ng-container *ngFor="let cell of calDays()">
                    <div *ngIf="cell.date === null" class="h-9 w-full"></div>
                    <button *ngIf="cell.date !== null" type="button"
                            (click)="selectCalDate(cell.date); $event.stopPropagation()"
                            class="relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-150"
                            [ngClass]="{
                              'bg-slate-900 text-white shadow font-bold': isDateSelected('facilityAvailableToDate', cell.date),
                              'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-inset ring-indigo-200': isCalToday(cell.date) && !isDateSelected('facilityAvailableToDate', cell.date),
                              'text-slate-700 hover:bg-slate-100': !isCalToday(cell.date) && !isDateSelected('facilityAvailableToDate', cell.date)
                            }">
                      {{ cell.num }}
                      <span *ngIf="isCalToday(cell.date) && !isDateSelected('facilityAvailableToDate', cell.date)"
                            class="absolute bottom-1 left-1/2 h-1 w-1 rounded-full bg-indigo-500"
                            style="transform:translateX(-50%)"></span>
                    </button>
                  </ng-container>
                </div>
                <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <button type="button" (click)="calToday(); $event.stopPropagation()"
                          class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700">Today</button>
                  <p class="text-xs font-medium text-slate-500">
                    {{ form.get('facilityAvailableToDate')?.value ? getDateLabel('facilityAvailableToDate') : 'No date selected' }}
                  </p>
                </div>
              </div>
            </div>
          </label>

        </div>
        <p *ngIf="getDateRangeDisplay()" class="mt-4 text-sm text-[#4f46e5] font-medium flex items-center">
          <span class="material-icons-outlined text-[1.2em] mr-1">calendar_today</span> {{ getDateRangeDisplay() }}
        </p>
      </section>

      <!-- ── Timing Rules ── -->
      <section class="rules-card">
        <h4>Timing Rules</h4>
        <p class="subtitle" *ngIf="isSingleDay">Set the booking start and end time for each day.</p>
        <p class="subtitle" *ngIf="!isSingleDay">Set the booking start and end datetime (date + time) for the multi-day period.</p>

        <div class="grid gap-6 md:grid-cols-2">
          <label class="admin-field">
            Booking Start {{ isSingleDay ? 'Time' : 'Date & Time' }} *
            <input *ngIf="isSingleDay" type="time" formControlName="bookingStartTime" required
                   [class.border-red-500]="form.get('bookingStartTime')?.invalid && form.get('bookingStartTime')?.touched" />
            <input *ngIf="!isSingleDay" type="datetime-local" formControlName="bookingStartTime" required
                   [class.border-red-500]="form.get('bookingStartTime')?.invalid && form.get('bookingStartTime')?.touched" />
            <span *ngIf="form.get('bookingStartTime')?.invalid && form.get('bookingStartTime')?.touched"
                  class="text-[11px] text-red-500 font-medium">Start {{ isSingleDay ? 'time' : 'date & time' }} is required</span>
          </label>
          <label class="admin-field">
            Booking End {{ isSingleDay ? 'Time' : 'Date & Time' }} *
            <input *ngIf="isSingleDay" type="time" formControlName="bookingDeadline" required
                   [class.border-red-500]="form.get('bookingDeadline')?.invalid && form.get('bookingDeadline')?.touched" />
            <input *ngIf="!isSingleDay" type="datetime-local" formControlName="bookingDeadline" required
                   [class.border-red-500]="form.get('bookingDeadline')?.invalid && form.get('bookingDeadline')?.touched" />
            <span *ngIf="form.get('bookingDeadline')?.invalid && form.get('bookingDeadline')?.touched"
                  class="text-[11px] text-red-500 font-medium">End {{ isSingleDay ? 'time' : 'date & time' }} is required</span>
          </label>
        </div>

        <!-- Cross-field validation errors -->
        <div *ngIf="form.errors?.['startAfterEnd'] && form.touched" class="mt-3 text-xs text-red-500 font-medium flex items-center gap-1">
          <span class="material-icons-outlined text-[1em]">error_outline</span> Start must be before end.
        </div>
        <div *ngIf="form.errors?.['reminderAfterEnd'] && form.touched" class="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          <span class="material-icons-outlined text-[1em]">error_outline</span> Reminder must be before end.
        </div>
        <div *ngIf="form.errors?.['cancellationAfterEnd'] && form.touched" class="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          <span class="material-icons-outlined text-[1em]">error_outline</span> Cancellation deadline must be before end.
        </div>
      </section>

      <!-- ── Multi-Day: Available Days ── -->
      <section *ngIf="!isSingleDay" class="rules-card">
        <h4>Available Days</h4>
        <p class="subtitle">Select which days of the week this facility is available. If none selected, defaults to every day.</p>
        <div class="flex flex-wrap gap-2">
          <button *ngFor="let day of weekDays" type="button" class="pill"
                  [class.active]="isDaySelected(day.value)" (click)="toggleDay(day.value)">
            {{ day.label }}
          </button>
        </div>
        <p *ngIf="selectedDays.length > 0" class="mt-3 text-sm text-[#4f46e5] font-medium flex items-center">
          <span class="material-icons-outlined text-[1.2em] mr-1">check_circle</span> Available on: {{ selectedDaysLabel }}
        </p>
      </section>

      <!-- ── Employee Type ── -->
      <section class="rules-card">
        <h4>Employee Type Access</h4>
        <p class="subtitle">Which work modes can use this facility?</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="pill font-bold" [class.active]="allTypesSelected"
                  style="border-color:#4f46e5;background:#eef2ff;color:#4338ca;" (click)="toggleAllTypes()">
            ✦ Everyone
          </button>
          <label class="pill" [class.active]="form.value.employeeTypeOnSite">
            <input type="checkbox" formControlName="employeeTypeOnSite" class="sr-only" /> On-site
          </label>
          <label class="pill" [class.active]="form.value.employeeTypeRemote">
            <input type="checkbox" formControlName="employeeTypeRemote" class="sr-only" /> Remote
          </label>
          <label class="pill" [class.active]="form.value.employeeTypeHybrid">
            <input type="checkbox" formControlName="employeeTypeHybrid" class="sr-only" /> Hybrid
          </label>
        </div>
      </section>

      <!-- ── Applicable Roles ── -->
      <section class="rules-card">
        <h4>Applicable Roles</h4>
        <p class="subtitle">Which job roles can access or book this facility?</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="pill font-bold" [class.active]="allRolesSelected"
                  style="border-color:#4f46e5;background:#eef2ff;color:#4338ca;" (click)="toggleAllRoles()">
            ✦ Everyone
          </button>
          <label class="pill" [class.active]="form.value.roleHR"><input type="checkbox" formControlName="roleHR" class="sr-only" /> HR</label>
          <label class="pill" [class.active]="form.value.roleManager"><input type="checkbox" formControlName="roleManager" class="sr-only" /> Manager</label>
          <label class="pill" [class.active]="form.value.roleFinance"><input type="checkbox" formControlName="roleFinance" class="sr-only" /> Finance</label>
          <label class="pill" [class.active]="form.value.roleCloud"><input type="checkbox" formControlName="roleCloud" class="sr-only" /> Cloud</label>
          <label class="pill" [class.active]="form.value.roleRD"><input type="checkbox" formControlName="roleRD" class="sr-only" /> R&amp;D</label>
          <label class="pill" [class.active]="form.value.roleDirector"><input type="checkbox" formControlName="roleDirector" class="sr-only" /> Director</label>
          <label class="pill" [class.active]="form.value.roleIS"><input type="checkbox" formControlName="roleIS" class="sr-only" /> IS</label>
          <label class="pill" [class.active]="form.value.roleNOC"><input type="checkbox" formControlName="roleNOC" class="sr-only" /> NOC</label>
          <label class="pill" [class.active]="form.value.roleOps"><input type="checkbox" formControlName="roleOps" class="sr-only" /> Ops</label>
          <label class="pill" [class.active]="form.value.roleDevops"><input type="checkbox" formControlName="roleDevops" class="sr-only" /> DevOps</label>
        </div>
      </section>
    </form>
  `
})
export class BuilderRulesFormComponent {
  @Input({ required: true }) form!: FormGroup;

  // ── Calendar Picker ──────────────────────────────────────────────────────
  readonly weekDayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  activeCalField  = signal<'from' | 'to' | null>(null);
  calViewYear     = signal(new Date().getFullYear());
  calViewMonth    = signal(new Date().getMonth());

  openCalendar(field: 'from' | 'to'): void {
    if (this.activeCalField() === field) { this.activeCalField.set(null); return; }
    const ctrlName = field === 'from' ? 'facilityAvailableFromDate' : 'facilityAvailableToDate';
    const val = this.form.get(ctrlName)?.value as string;
    if (val) {
      const d = new Date(val + 'T00:00:00');
      this.calViewYear.set(d.getFullYear());
      this.calViewMonth.set(d.getMonth());
    } else {
      const d = new Date();
      this.calViewYear.set(d.getFullYear());
      this.calViewMonth.set(d.getMonth());
    }
    this.activeCalField.set(field);
  }

  closeCalendar(): void { this.activeCalField.set(null); }

  prevCalMonth(): void {
    if (this.calViewMonth() === 0) { this.calViewMonth.set(11); this.calViewYear.update(y => y - 1); }
    else { this.calViewMonth.update(m => m - 1); }
  }

  nextCalMonth(): void {
    if (this.calViewMonth() === 11) { this.calViewMonth.set(0); this.calViewYear.update(y => y + 1); }
    else { this.calViewMonth.update(m => m + 1); }
  }

  calMonthLabel(): string {
    return new Date(this.calViewYear(), this.calViewMonth(), 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  calDays(): Array<{ date: string | null; num: number | null }> {
    const year  = this.calViewYear();
    const month = this.calViewMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: string | null; num: number | null }> = [];
    for (let i = 0; i < firstDay; i++) { cells.push({ date: null, num: null }); }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        num: d
      });
    }
    return cells;
  }

  selectCalDate(date: string): void {
    const field = this.activeCalField();
    if (!field) return;
    const ctrlName = field === 'from' ? 'facilityAvailableFromDate' : 'facilityAvailableToDate';
    this.form.patchValue({ [ctrlName]: date });
    this.activeCalField.set(null);
  }

  calToday(): void {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.calViewYear.set(d.getFullYear());
    this.calViewMonth.set(d.getMonth());
    this.selectCalDate(todayStr);
  }

  isCalToday(date: string): boolean {
    const d = new Date();
    return date === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getDateLabel(ctrlName: string): string {
    const val = this.form.get(ctrlName)?.value as string;
    if (!val) return 'Select date';
    const d = new Date(val + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  isDateSelected(ctrlName: string, date: string): boolean {
    return this.form.get(ctrlName)?.value === date;
  }

  clearDate(ctrlName: string, event: Event): void {
    event.stopPropagation();
    this.form.patchValue({ [ctrlName]: '' });
  }

  get isSingleDay(): boolean {
    return this.form.value.bookingMode !== 'multi';
  }

  setMode(mode: 'single' | 'multi'): void {
    this.form.patchValue({ bookingMode: mode });
    // Clear mode-specific fields when switching
    if (mode === 'single') {
      this.form.patchValue({
        facilityAvailableFromDate: '',
        facilityAvailableToDate: '',
        availableDays: ''
      });
    }
  }

  get allTypesSelected(): boolean {
    const v = this.form.value;
    return !!(v.employeeTypeOnSite && v.employeeTypeRemote && v.employeeTypeHybrid);
  }

  toggleAllTypes(): void {
    const all = this.allTypesSelected;
    this.form.patchValue({
      employeeTypeOnSite: !all,
      employeeTypeRemote: !all,
      employeeTypeHybrid: !all
    });
  }

  get allRolesSelected(): boolean {
    const v = this.form.value;
    return !!(v.roleHR && v.roleManager && v.roleFinance && v.roleCloud &&
              v.roleRD && v.roleDirector && v.roleIS && v.roleNOC &&
              v.roleOps && v.roleDevops);
  }

  toggleAllRoles(): void {
    const all = this.allRolesSelected;
    this.form.patchValue({
      roleHR: !all, roleManager: !all, roleFinance: !all,
      roleCloud: !all, roleRD: !all, roleDirector: !all,
      roleIS: !all, roleNOC: !all, roleOps: !all, roleDevops: !all
    });
  }

  readonly weekDays = [
    { label: 'Monday', value: 'MONDAY' },
    { label: 'Tuesday', value: 'TUESDAY' },
    { label: 'Wednesday', value: 'WEDNESDAY' },
    { label: 'Thursday', value: 'THURSDAY' },
    { label: 'Friday', value: 'FRIDAY' },
    { label: 'Saturday', value: 'SATURDAY' },
    { label: 'Sunday', value: 'SUNDAY' }
  ];

  get selectedDays(): string[] {
    const val = this.form.get('availableDays')?.value as string ?? '';
    return val ? val.split(',').map(d => d.trim()).filter(Boolean) : [];
  }

  get selectedDaysLabel(): string {
    return this.selectedDays
      .map(d => d.charAt(0) + d.slice(1).toLowerCase())
      .join(', ');
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }

  toggleDay(day: string): void {
    const current = this.selectedDays;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];

    this.form.patchValue({ availableDays: updated.join(',') });
  }

  getDateRangeDisplay(): string {
    const fromDate = this.form.get('facilityAvailableFromDate')?.value;
    const toDate = this.form.get('facilityAvailableToDate')?.value;

    if (!fromDate && !toDate) {
      return '';
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const from = formatDate(fromDate);
    const to = formatDate(toDate);

    if (from && to) {
      return `${from} – ${to}`;
    } else if (from) {
      return `From ${from}`;
    } else if (to) {
      return `Until ${to}`;
    }

    return '';
  }
}

