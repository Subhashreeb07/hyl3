import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-slate-900">Settings</h2>

      <form [formGroup]="form" class="grid gap-5 lg:grid-cols-2">
        <section class="satori-card space-y-3">
          <h3 class="text-lg font-semibold">Company Settings</h3>
          <label class="admin-field">Company Name<input formControlName="companyName" /></label>
          <label class="admin-field">Timezone<input formControlName="timezone" /></label>
        </section>

        <section class="satori-card space-y-3">
          <h3 class="text-lg font-semibold">Working Days & Business Hours</h3>
          <label class="admin-field">Working Days<input formControlName="workingDays" /></label>
          <label class="admin-field">Business Hours<input formControlName="businessHours" /></label>
        </section>

        <section class="satori-card space-y-3">
          <h3 class="text-lg font-semibold">Holiday Calendar</h3>
          <label class="admin-field">Calendar Source<input formControlName="holidayCalendar" /></label>
        </section>

        <section class="satori-card space-y-3">
          <h3 class="text-lg font-semibold">Notification & Security</h3>
          <label class="admin-field">Notification Policy<input formControlName="notificationPolicy" /></label>
          <label class="admin-field">Security Mode<input formControlName="securityMode" /></label>
        </section>
      </form>

      <div class="flex justify-end"><button class="satori-primary" (click)="save()">Save Settings</button></div>
    </div>
  `,
  styles: [`.admin-field{display:grid;gap:.35rem;font-size:.8rem;font-weight:600;color:#334155}.admin-field input{border:1px solid #cbd5e1;border-radius:.65rem;padding:.55rem .7rem}`]
})
export class AdminSettingsPageComponent {
  readonly form = this.fb.group({
    companyName: ['HyHub Enterprises'],
    timezone: ['Asia/Kolkata'],
    workingDays: ['Mon-Fri'],
    businessHours: ['09:00 - 18:00'],
    holidayCalendar: ['India Corporate Calendar'],
    notificationPolicy: ['Immediate + Reminder'],
    securityMode: ['Role-based Access Control']
  });

  constructor(private readonly fb: FormBuilder) {}

  save(): void {
    window.alert('Settings saved.');
  }
}
