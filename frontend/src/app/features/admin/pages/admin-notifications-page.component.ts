import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NotificationOpsSummaryResponse, ProcessNotificationsResponse } from '../../../core/models/admin.models';
import { AdminApiService } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-notifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-slate-900">Notifications</h2>

      <section class="satori-card grid gap-4 md:grid-cols-2">
        <article>
          <h3 class="text-lg font-semibold">Create Notification</h3>
          <div class="mt-3 grid gap-3">
            <input class="admin-input" placeholder="Employee ID" [(ngModel)]="employeeId" />
            <input class="admin-input" placeholder="Type (BOOKING_REMINDER)" [(ngModel)]="notificationType" />
            <input class="admin-input" placeholder="Channel (IN_APP/EMAIL/SMS)" [(ngModel)]="channelCode" />
            <textarea class="admin-input" rows="3" placeholder="Message" [(ngModel)]="messageBody"></textarea>
            <button class="satori-primary" (click)="mockCreate()">Create Notification</button>
          </div>
        </article>

        <article>
          <h3 class="text-lg font-semibold">Scheduled Notifications</h3>
          <div class="mt-3 grid gap-3">
            <input type="number" class="admin-input" placeholder="Batch Size" [(ngModel)]="batchSize" />
            <button class="satori-primary" (click)="process()">Process Pending Notifications</button>
            <div *ngIf="processResult() as pr" class="rounded-xl bg-slate-50 p-3 text-sm">
              Attempted {{ pr.attempted }} · Sent {{ pr.sent }} · Retried {{ pr.retried }} · Escalated {{ pr.escalated }}
            </div>
          </div>
        </article>
      </section>

      <section class="satori-card">
        <h3 class="text-lg font-semibold">Reminder Configuration / Push History</h3>
        <div class="mt-3 flex flex-wrap items-end gap-3">
          <label class="admin-field">Report Date<input type="date" [(ngModel)]="reportDate" /></label>
          <button class="satori-primary" (click)="loadSummary()">Load Push History</button>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-3" *ngIf="opsSummary() as ops">
          <article class="rounded-xl bg-slate-50 p-3"><p class="text-xs text-slate-500">Pending</p><p class="text-xl font-bold">{{ ops.pending }}</p></article>
          <article class="rounded-xl bg-slate-50 p-3"><p class="text-xs text-slate-500">Sent</p><p class="text-xl font-bold">{{ ops.sent }}</p></article>
          <article class="rounded-xl bg-slate-50 p-3"><p class="text-xs text-slate-500">Escalated</p><p class="text-xl font-bold">{{ ops.escalated }}</p></article>
        </div>
      </section>
    </div>
  `,
  styles: [
    `.admin-input{width:100%;border:1px solid #cbd5e1;border-radius:.65rem;padding:.55rem .7rem}.admin-field{display:grid;gap:.35rem;font-size:.8rem;font-weight:600;color:#334155}.admin-field input{border:1px solid #cbd5e1;border-radius:.65rem;padding:.55rem .7rem}`
  ]
})
export class AdminNotificationsPageComponent {
  employeeId = 'EMP001';
  notificationType = 'BOOKING_REMINDER';
  channelCode = 'IN_APP';
  messageBody = 'Your booking starts in 30 minutes.';
  batchSize = 100;
  reportDate = '';

  readonly processResult = signal<ProcessNotificationsResponse | null>(null);
  readonly opsSummary = signal<NotificationOpsSummaryResponse | null>(null);

  constructor(private readonly adminApi: AdminApiService) {}

  mockCreate(): void {
    window.alert('Create Notification workflow configured. Connect to create API based on your desired campaign payload.');
  }

  async process(): Promise<void> {
    const data = await firstValueFrom(this.adminApi.processNotifications(this.batchSize));
    this.processResult.set(data);
  }

  async loadSummary(): Promise<void> {
    const data = await firstValueFrom(this.adminApi.getNotificationOpsSummary(this.reportDate || null));
    this.opsSummary.set(data);
  }
}
