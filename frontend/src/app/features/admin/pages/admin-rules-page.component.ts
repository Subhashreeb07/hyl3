import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-rules-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-slate-900">Rules Presets</h2>
      <p class="text-sm text-slate-600">Define organization-wide defaults used by the Form Builder wizard.</p>

      <form [formGroup]="form" class="satori-card grid gap-4 md:grid-cols-2">
        <label class="admin-field">Default Booking Window<input type="text" formControlName="bookingWindow" placeholder="e.g. 7 days" /></label>
        <label class="admin-field">Default Reminder Time<input type="time" formControlName="reminderTime" /></label>
        <label class="admin-inline"><input type="checkbox" formControlName="allowCancellation" /> Default Allow Cancellation</label>
        <label class="admin-inline"><input type="checkbox" formControlName="approvalRequired" /> Default Approval Required</label>
        <label class="admin-inline"><input type="checkbox" formControlName="weekendEnabled" /> Weekend Bookings Enabled</label>
        <label class="admin-inline"><input type="checkbox" formControlName="holidayEnabled" /> Holiday Bookings Enabled</label>
      </form>

      <div class="flex justify-end"><button class="satori-primary" (click)="save()">Save Rule Defaults</button></div>
    </div>
  `,
  styles: [
    `.admin-field{display:grid;gap:.35rem;font-size:.8rem;font-weight:600;color:#334155}.admin-field input{border:1px solid #cbd5e1;border-radius:.65rem;padding:.55rem .7rem}`
  ]
})
export class AdminRulesPageComponent {
  readonly form = this.fb.group({
    bookingWindow: ['7 days'],
    reminderTime: ['09:00'],
    allowCancellation: [true],
    approvalRequired: [false],
    weekendEnabled: [false],
    holidayEnabled: [false]
  });

  constructor(private readonly fb: FormBuilder) {}

  save(): void {
    window.alert('Rule defaults saved for admin builder context.');
  }
}
