import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationHistoryItem
} from '../../../core/models/admin.models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { FacilityAdminApiService } from '../../../core/services/facility-admin-api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-notifications-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="space-y-6 max-w-[1000px] mx-auto animate-fade-in px-4 pb-12">
      <!-- Title Bar -->
      <header class="flex flex-col md:flex-row md:items-center justify-between border border-slate-200/80 bg-white px-6 py-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Notification Dispatch Center</h2>
          <p class="text-xs text-slate-500 mt-1">Manage, draft, and dispatch real-time space alerts and office advisories to active teams.</p>
        </div>
        <button class="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition" (click)="loadHistory(1)">
          <mat-icon class="!text-[14px] leading-[14px]">refresh</mat-icon> Reload Log Feed
        </button>
      </header>

      <div class="grid grid-cols-1 gap-6">
        
        <!-- Compose Section -->
        <section class="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="text-slate-500 !text-[18px]">edit_note</mat-icon>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Draft Notification</h3>
          </div>

          <form [formGroup]="broadcastForm" class="space-y-6">
            
            <!-- Segmented Target Selection -->
            <div class="space-y-2">
              <label class="admin-field-label">Recipient Target Audience</label>
              <div class="flex p-1 bg-slate-100 rounded-lg max-w-md border border-slate-200/40">
                <button type="button" 
                        class="flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all duration-200"
                        [class.bg-white]="broadcastForm.value.targetType === 'ALL'"
                        [class.text-slate-900]="broadcastForm.value.targetType === 'ALL'"
                        [class.shadow-sm]="broadcastForm.value.targetType === 'ALL'"
                        [class.text-slate-500]="broadcastForm.value.targetType !== 'ALL'"
                        (click)="setTargetType('ALL')">
                  All Employees
                </button>
                <button type="button" 
                        class="flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all duration-200"
                        [class.bg-white]="broadcastForm.value.targetType === 'DIRECT'"
                        [class.text-slate-900]="broadcastForm.value.targetType === 'DIRECT'"
                        [class.shadow-sm]="broadcastForm.value.targetType === 'DIRECT'"
                        [class.text-slate-500]="broadcastForm.value.targetType !== 'DIRECT'"
                        (click)="setTargetType('DIRECT')">
                  Specific Employees
                </button>
              </div>
            </div>

            <!-- Comma-separated IDs (Visible only if Specific Employees selected) -->
            <div *ngIf="broadcastForm.value.targetType === 'DIRECT'" class="animate-fade-in space-y-1.5">
              <label class="admin-field-label">Target Employee IDs</label>
              <input class="admin-input" formControlName="employeeIdsCsv" placeholder="e.g. EMP001, EMP002 (separate with commas)" />
            </div>

            <!-- Notification Subject -->
            <div class="space-y-1.5">
              <label class="admin-field-label">Notification Subject</label>
              <input class="admin-input" formControlName="subject" placeholder="e.g. System Maintenance Update" />
            </div>

            <!-- Notification Message -->
            <div class="space-y-1.5">
              <label class="admin-field-label">Message Content</label>
              <textarea class="admin-input" rows="5" formControlName="messageBody" placeholder="Type your notification message here..."></textarea>
            </div>

            <button mat-flat-button class="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-all shadow-sm" type="button" (click)="sendBroadcast()">
              Dispatch Notification
            </button>
          </form>
        </section>

        <!-- Sent Feed Log Section -->
        <section class="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="text-slate-500 !text-[18px]">history</mat-icon>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Sent Logs & Dispatch History</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            <div *ngIf="historyItems().length === 0" class="md:col-span-2 py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No notification logs found.
            </div>
            
            <div *ngFor="let item of historyItems()" 
                 class="flex items-start gap-3.5 p-4 border border-slate-150/70 bg-white hover:border-slate-350 rounded-xl transition shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md">
              <!-- Circular User Initials Profile -->
              <div class="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200 shrink-0">
                {{ getInitials(item.employeeName || item.employeeId) }}
              </div>
              
              <div class="flex-1 min-w-0 space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-bold text-xs text-slate-800 truncate">{{ item.employeeName || item.employeeId }}</p>
                  <span class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border shrink-0" 
                        [ngClass]="statusClass(item.status)">
                    {{ item.status }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed font-semibold">{{ item.templateName || 'System Alert' }}</p>
                <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-50">
                  <span>Channel: <strong class="text-slate-500 font-semibold">{{ item.channel }}</strong></span>
                  <span>{{ item.sentTime | date: 'mediumDate' }} · {{ item.sentTime | date: 'shortTime' }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [
    `
      .admin-input {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.6rem 0.8rem;
        background: #ffffff;
        font-size: 0.8rem;
        color: #1e293b;
        transition: all 0.2s ease-in-out;
      }
      .admin-input:focus {
        border-color: #0f172a;
        box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.05);
        outline: none;
      }
      .admin-field-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: block;
      }
    `
  ]
})
export class AdminNotificationsPageComponent implements OnInit {
  readonly historyItems = signal<NotificationHistoryItem[]>([]);
  readonly facilities = signal<any[]>([]);
  readonly historyPageSize = 20;

  readonly broadcastForm = this.fb.group({
    targetType: ['ALL', Validators.required],
    subject: ['', Validators.required],
    messageBody: ['', Validators.required],
    employeeIdsCsv: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly adminApi: AdminApiService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadHistory(1);
  }

  setTargetType(type: 'ALL' | 'DIRECT'): void {
    this.broadcastForm.patchValue({ targetType: type });
    this.onTargetTypeChange();
  }

  onTargetTypeChange(): void {
    const raw = this.broadcastForm.value;
    if (raw.targetType === 'ALL') {
      this.broadcastForm.patchValue({ employeeIdsCsv: '' });
    }
  }

  getInitials(name: string): string {
    const cleanName = (name || '').trim();
    if (!cleanName) return '??';
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  }

  async sendBroadcast(): Promise<void> {
    if (this.broadcastForm.invalid) {
      this.broadcastForm.markAllAsTouched();
      this.toastService.show('Please complete the required details before sending.', 'error');
      return;
    }

    try {
      const response = await firstValueFrom(this.adminApi.sendNotificationBroadcast(this.buildPayload()));
      this.toastService.show(response.message || 'Notification sent successfully.', 'success');
      this.broadcastForm.patchValue({
        subject: '',
        messageBody: ''
      });
      this.loadHistory(1);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Notification could not be sent.', 'error');
    }
  }

  async loadHistory(page: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.adminApi.getNotificationHistory({
          query: null,
          facility: null,
          status: null,
          channel: null,
          date: null,
          page,
          pageSize: this.historyPageSize
        })
      );
      this.historyItems.set(response.items ?? []);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Notification history could not be loaded.', 'error');
      this.historyItems.set([]);
    }
  }

  statusClass(status: string): string {
    const s = (status ?? '').toUpperCase();
    if (s === 'SENT' || s === 'READ') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'PENDING' || s === 'SCHEDULED') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s === 'PROCESSING' || s === 'RETRYING') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  private buildPayload() {
    const raw = this.broadcastForm.getRawValue();
    let employeeIds: string[] = [];
    if (raw.targetType === 'DIRECT') {
      employeeIds = (raw.employeeIdsCsv ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    }

    return {
      notificationType: 'SYSTEM_ANNOUNCEMENT',
      channels: ['IN_APP', 'EMAIL'] as NotificationChannel[],
      subject: raw.subject ?? 'System Alert',
      messageBody: raw.messageBody ?? '',
      employeeIds: employeeIds.length > 0 ? employeeIds : undefined,
      location: 'ALL',
      workMode: 'ALL',
      preference: 'ALL',
      activeOnly: true,
      dryRun: false
    };
  }
}
