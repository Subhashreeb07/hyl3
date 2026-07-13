import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #1e293b;
    }
    .admin-field input,
    .admin-field textarea,
    .admin-field select {
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.65rem 0.875rem;
      background: #ffffff;
      font-size: 0.875rem;
      color: #0f172a;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .admin-field input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .rules-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .rules-card h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .rules-card p.subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1.25rem;
    }
  `],
  template: `
    <form [formGroup]="form" class="space-y-6 py-4">
      <!-- Facility Availability Section -->
      <section class="rules-card">
        <h4>Facility Availability</h4>
        <p class="subtitle">Define the date range when this facility is open for bookings.</p>
        <div class="grid gap-6 md:grid-cols-2">
          <label class="admin-field">
            Available From Date
            <input type="date" formControlName="facilityAvailableFromDate" />
          </label>
          <label class="admin-field">
            Available To Date
            <input type="date" formControlName="facilityAvailableToDate" />
          </label>
        </div>
        <p *ngIf="getDateRangeDisplay()" class="mt-4 text-sm text-[#4f46e5] font-medium flex items-center">
          <span class="material-icons-outlined text-[1.2em] mr-1">calendar_today</span> {{ getDateRangeDisplay() }}
        </p>
      </section>

      <!-- Timing Rules Section -->
      <section class="rules-card">
        <h4>Timing Rules</h4>
        <p class="subtitle">Define when bookings can be created and when reminders trigger.</p>
        <div class="grid gap-6 md:grid-cols-3">
          <label class="admin-field">
            Booking Start Time *
            <input type="time" formControlName="bookingStartTime" required />
          </label>
          <label class="admin-field">
            Booking End Time *
            <input type="time" formControlName="bookingEndTime" required />
          </label>
          <label class="admin-field">
            Reminder Time *
            <input type="time" formControlName="reminderTime" required />
          </label>
        </div>
      </section>

      <!-- Available Days Section -->
      <section class="rules-card">
        <h4>Available Days</h4>
        <p class="subtitle">Select which days of the week this facility is available for booking. If none are selected, it defaults to every day.</p>
        <div class="flex flex-wrap gap-2">
          <button 
            *ngFor="let day of weekDays"
            type="button"
            class="pill"
            [class.active]="isDaySelected(day.value)"
            (click)="toggleDay(day.value)"
          >
            {{ day.label }}
          </button>
        </div>
        <p *ngIf="selectedDays.length > 0" class="mt-3 text-sm text-[#4f46e5] font-medium flex items-center">
          <span class="material-icons-outlined text-[1.2em] mr-1">check_circle</span> Available on: {{ selectedDaysLabel }}
        </p>
      </section>

      <!-- Employee Type -->
      <section class="rules-card">
        <h4>Employee Type Access</h4>
        <p class="subtitle">Which work modes can use this facility?</p>
        <div class="flex flex-wrap gap-2">
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

      <!-- Applicable Roles -->
      <section class="rules-card">
        <h4>Applicable Roles</h4>
        <p class="subtitle">Which job roles can access or book this facility?</p>
        <div class="flex flex-wrap gap-2">
          <label class="pill" [class.active]="form.value.roleHR">
            <input type="checkbox" formControlName="roleHR" class="sr-only" /> HR
          </label>
          <label class="pill" [class.active]="form.value.roleManager">
            <input type="checkbox" formControlName="roleManager" class="sr-only" /> Manager
          </label>
          <label class="pill" [class.active]="form.value.roleFinance">
            <input type="checkbox" formControlName="roleFinance" class="sr-only" /> Finance
          </label>
          <label class="pill" [class.active]="form.value.roleCloud">
            <input type="checkbox" formControlName="roleCloud" class="sr-only" /> Cloud
          </label>
          <label class="pill" [class.active]="form.value.roleRD">
            <input type="checkbox" formControlName="roleRD" class="sr-only" /> R&amp;D
          </label>
          <label class="pill" [class.active]="form.value.roleDirector">
            <input type="checkbox" formControlName="roleDirector" class="sr-only" /> Director
          </label>
          <label class="pill" [class.active]="form.value.roleIS">
            <input type="checkbox" formControlName="roleIS" class="sr-only" /> IS
          </label>
          <label class="pill" [class.active]="form.value.roleNOC">
            <input type="checkbox" formControlName="roleNOC" class="sr-only" /> NOC
          </label>
          <label class="pill" [class.active]="form.value.roleOps">
            <input type="checkbox" formControlName="roleOps" class="sr-only" /> Ops
          </label>
          <label class="pill" [class.active]="form.value.roleDevops">
            <input type="checkbox" formControlName="roleDevops" class="sr-only" /> DevOps
          </label>
        </div>
      </section>
    </form>
  `
})
export class BuilderRulesFormComponent {
  @Input({ required: true }) form!: FormGroup;

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

