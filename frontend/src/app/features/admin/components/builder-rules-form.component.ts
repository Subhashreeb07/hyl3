import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-builder-rules-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="space-y-4 py-4">
      <!-- Facility Availability Section -->
      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 class="text-sm font-semibold text-slate-900">Facility Availability</h4>
        <p class="text-xs text-slate-500">Define the date range when this facility is open for bookings.</p>
        <div class="mt-3 grid gap-4 md:grid-cols-2">
          <label class="admin-field">
            Available From Date
            <input type="date" formControlName="facilityAvailableFromDate" />
            <span *ngIf="form.get('facilityAvailableFromDate')?.invalid && form.get('facilityAvailableFromDate')?.touched" class="text-xs text-red-600">
              Please select a valid start date
            </span>
          </label>
          <label class="admin-field">
            Available To Date
            <input type="date" formControlName="facilityAvailableToDate" />
            <span *ngIf="form.get('facilityAvailableToDate')?.invalid && form.get('facilityAvailableToDate')?.touched" class="text-xs text-red-600">
              Please select a valid end date
            </span>
          </label>
        </div>
        <p *ngIf="getDateRangeDisplay()" class="mt-2 text-xs text-[#0f6cbd]">
          📅 {{ getDateRangeDisplay() }}
        </p>
      </section>

      <!-- Timing Rules Section -->
      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 class="text-sm font-semibold text-slate-900">Timing Rules</h4>
        <p class="text-xs text-slate-500">Define when bookings can be created and when reminders trigger.</p>
        <div class="mt-3 grid gap-4 md:grid-cols-3">
          <label class="admin-field">
            Booking Start Time *
            <input type="time" formControlName="bookingStartTime" required />
            <span *ngIf="form.get('bookingStartTime')?.invalid && form.get('bookingStartTime')?.touched" class="text-xs text-red-600">
              Start time is required
            </span>
          </label>
          <label class="admin-field">
            Booking End Time *
            <input type="time" formControlName="bookingEndTime" required />
            <span *ngIf="form.get('bookingEndTime')?.invalid && form.get('bookingEndTime')?.touched" class="text-xs text-red-600">
              End time is required
            </span>
          </label>
          <label class="admin-field">
            Reminder Time *
            <input type="time" formControlName="reminderTime" required />
            <span *ngIf="form.get('reminderTime')?.invalid && form.get('reminderTime')?.touched" class="text-xs text-red-600">
              Reminder time is required
            </span>
          </label>
          <label class="admin-field">
            Cancellation Deadline *
            <input type="time" formControlName="cancellationDeadline" required />
            <span *ngIf="form.get('cancellationDeadline')?.invalid && form.get('cancellationDeadline')?.touched" class="text-xs text-red-600">
              Cancellation deadline is required
            </span>
          </label>
          <label class="admin-field">
            Booking Window (Days) *
            <input type="number" formControlName="bookingWindowDays" placeholder="e.g. 10" min="0" required />
            <span *ngIf="form.get('bookingWindowDays')?.invalid && form.get('bookingWindowDays')?.touched" class="text-xs text-red-600">
              Must be 0 or greater
            </span>
          </label>
        </div>
      </section>

      <!-- Available Days Section -->
      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 class="text-sm font-semibold text-slate-900">Available Days</h4>
        <p class="text-xs text-slate-500">Select which days of the week this facility is available for booking. If none are selected, the facility is available every day.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button 
            *ngFor="let day of weekDays"
            type="button"
            class="rounded-lg border px-3 py-2 text-sm font-medium transition cursor-pointer"
            [ngClass]="isDaySelected(day.value) ? 'border-[#0f6cbd] bg-[#edf5ff] text-[#0f6cbd] shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
            (click)="toggleDay(day.value)"
          >
            {{ day.label }}
          </button>
        </div>
        <p *ngIf="selectedDays.length > 0" class="mt-2 text-xs text-[#0f6cbd]">
          ✓ Available on: {{ selectedDaysLabel }}
        </p>
        <p *ngIf="selectedDays.length === 0" class="mt-2 text-xs text-slate-500">
          No restriction — available every day.
        </p>
      </section>
    </form>
  `,
  styles: [
    `
      .admin-field {
        display: grid;
        gap: 0.35rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: #334155;
      }

      .admin-field input,
      .admin-field textarea,
      .admin-field select {
        border: 1px solid #cbd5e1;
        border-radius: 0.65rem;
        padding: 0.55rem 0.7rem;
        background: #ffffff;
        font-size: 0.9rem;
      }

      .admin-field input:focus {
        outline: none;
        border-color: #0f6cbd;
        box-shadow: 0 0 0 2px rgba(15, 108, 189, 0.1);
      }

      .admin-field input[type="date"]:invalid {
        border-color: #dc2626;
      }

      .admin-inline {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.86rem;
        color: #334155;
      }

      button[type="button"] {
        outline: none;
        user-select: none;
      }
    `
  ]
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
