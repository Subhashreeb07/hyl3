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
    <div class="space-y-6 max-w-[800px] mx-auto animate-fade-in">
      <!-- Title Bar -->
      <header class="flex items-center justify-between border border-slate-200 bg-white px-6 py-5 rounded-lg shadow-sm">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Send Notification</h2>
          <p class="text-xs text-slate-500 mt-0.5">Send structured booking alerts, facility closures, or custom announcements to employees.</p>
        </div>
      </header>

      <!-- Simple Structured Compose Card -->
      <section class="border border-slate-200 bg-white p-6 rounded-lg shadow-sm">
        <form [formGroup]="broadcastForm" class="space-y-5">
          
          <!-- Target Recipients Selection -->
          <div class="space-y-2">
            <label class="admin-field-label">Target Audience</label>
            <div class="flex gap-4 items-center bg-slate-50/50 p-3 rounded-md border border-slate-200">
              <label class="flex items-center gap-2 font-semibold text-xs text-slate-700 cursor-pointer">
                <input type="radio" value="ALL" formControlName="targetType" (change)="onTargetTypeChange()" />
                All Employees
              </label>
              <label class="flex items-center gap-2 font-semibold text-xs text-slate-700 cursor-pointer">
                <input type="radio" value="DIRECT" formControlName="targetType" (change)="onTargetTypeChange()" />
                Specific Employees (By ID)
              </label>
            </div>
          </div>

          <!-- Comma-separated IDs (Visible only if Specific Employees selected) -->
          <div *ngIf="broadcastForm.value.targetType === 'DIRECT'" class="animate-fade-in space-y-1.5">
            <label class="admin-field-label">Employee IDs</label>
            <input class="admin-input" formControlName="employeeIdsCsv" placeholder="e.g. EMP001, EMP002" />
            <p class="text-[10px] text-slate-400">Separate multiple IDs with commas.</p>
          </div>

          <!-- Template Preset Dropdown -->
          <div class="space-y-1.5">
            <label class="admin-field-label">Notification Type / Preset</label>
            <select class="admin-input" formControlName="presetType">
              <option value="CUSTOM">Custom Announcement (Free-form Text)</option>
              <option value="MAINTENANCE">Facility Maintenance & Closure Notice</option>
              <option value="DESK_RELEASE">Desk Booking Confirmation/Release Reminder</option>
              <option value="EMERGENCY_WFH">Emergency Work-From-Home (WFH) Advisory</option>
            </select>
          </div>

          <!-- DYNAMIC FIELDS DEPENDING ON PRESET -->
          <div class="space-y-4 pt-4 border-t border-slate-100" *ngIf="broadcastForm.value.presetType !== 'CUSTOM'">
            
            <!-- Facility Selection (Maintenance) -->
            <div class="space-y-1.5" *ngIf="broadcastForm.value.presetType === 'MAINTENANCE'">
              <label class="admin-field-label">Affected Facility</label>
              <select class="admin-input" formControlName="facilityId">
                <option value="">Select facility...</option>
                <option *ngFor="let fac of facilities()" [value]="fac.facilityId">{{ fac.facilityName }}</option>
              </select>
            </div>

            <!-- Date Selector (Maintenance, Release, Emergency WFH) -->
            <div class="space-y-1.5" *ngIf="showDateField()">
              <label class="admin-field-label">Target Date</label>
              <input type="date" class="admin-input" formControlName="date" />
            </div>

            <!-- Office Location Selection (Emergency WFH) -->
            <div class="space-y-1.5" *ngIf="broadcastForm.value.presetType === 'EMERGENCY_WFH'">
              <label class="admin-field-label">Office Location</label>
              <select class="admin-input" formControlName="location">
                <option value="Hyderabad Office">Hyderabad Office</option>
                <option value="Kolkata Office">Kolkata Office</option>
                <option value="All Offices">All Offices</option>
              </select>
            </div>

            <!-- Reason / Details (Maintenance, Emergency WFH) -->
            <div class="space-y-1.5" *ngIf="showReasonField()">
              <label class="admin-field-label">Reason / Special Details</label>
              <input class="admin-input" formControlName="reason" placeholder="e.g. system upgrades, heavy rain forecast" />
            </div>

          </div>

          <!-- Free-form message (Custom Option) -->
          <div class="space-y-1.5" *ngIf="broadcastForm.value.presetType === 'CUSTOM'">
            <label class="admin-field-label">Message Content</label>
            <textarea class="admin-input" rows="5" formControlName="messageBody" placeholder="Type your custom broadcast message..."></textarea>
          </div>

          <!-- Live Preview Box -->
          <div class="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-1 text-xs">
            <span class="font-bold text-[10px] uppercase tracking-wider text-slate-400">Live Message Preview</span>
            <p class="text-slate-700 italic mt-1 font-semibold leading-relaxed">{{ getGeneratedPreview() || '(Message text is empty)' }}</p>
          </div>

          <button mat-flat-button class="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md py-2.5 text-xs font-semibold tracking-wide transition" type="button" (click)="sendBroadcast()">
            Send Notification
          </button>
        </form>
      </section>

      <!-- Simple Recent History Feed -->
      <section class="border border-slate-200 bg-white p-5 rounded-lg shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Notifications</h3>
          <button class="text-xs text-slate-500 hover:text-slate-900 font-semibold" (click)="loadHistory(1)">Refresh</button>
        </div>

        <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          <div *ngIf="historyItems().length === 0" class="py-8 text-center text-xs text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-md">
            No recently sent notifications.
          </div>
          <div *ngFor="let item of historyItems()" class="flex items-start justify-between p-3 border border-slate-100 bg-slate-50/30 rounded-md text-xs animate-slide-in">
            <div class="space-y-1 flex-1 pr-4">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">{{ item.employeeName || item.employeeId }}</span>
                <span class="text-[10px] text-slate-400">via {{ item.channel }}</span>
              </div>
              <p class="text-slate-600 font-semibold leading-relaxed">{{ item.templateName || 'System Alert' }}</p>
            </div>
            <div class="text-right space-y-1">
              <span class="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border" [ngClass]="statusClass(item.status)">
                {{ item.status }}
              </span>
              <p class="text-[9px] text-slate-400 mt-1.5">{{ item.sentTime | date: 'shortTime' }}</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [
    `
      .admin-input {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        padding: 0.55rem 0.7rem;
        background: #ffffff;
        font-size: 0.8rem;
        color: #334155;
      }
      .admin-input:focus {
        border-color: #94a3b8;
        outline: none;
      }
      .admin-field-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        display: block;
      }
    `
  ]
})
export class AdminNotificationsPageComponent implements OnInit {
  readonly historyItems = signal<NotificationHistoryItem[]>([]);
  readonly facilities = signal<any[]>([]);
  readonly historyPageSize = 15;

  readonly broadcastForm = this.fb.group({
    targetType: ['ALL', Validators.required],
    presetType: ['CUSTOM', Validators.required],
    messageBody: ['', Validators.required],
    employeeIdsCsv: [''],
    facilityId: [''],
    date: [''],
    location: ['Hyderabad Office'],
    reason: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly adminApi: AdminApiService,
    private readonly facilityApi: FacilityAdminApiService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFacilities();
    this.loadHistory(1);
  }

  onTargetTypeChange(): void {
    const raw = this.broadcastForm.value;
    if (raw.targetType === 'ALL') {
      this.broadcastForm.patchValue({ employeeIdsCsv: '' });
    }
  }

  showDateField(): boolean {
    const preset = this.broadcastForm.value.presetType;
    return preset === 'MAINTENANCE' || preset === 'DESK_RELEASE' || preset === 'EMERGENCY_WFH';
  }

  showReasonField(): boolean {
    const preset = this.broadcastForm.value.presetType;
    return preset === 'MAINTENANCE' || preset === 'EMERGENCY_WFH';
  }

  getGeneratedPreview(): string {
    const raw = this.broadcastForm.value;
    const preset = raw.presetType;
    if (preset === 'CUSTOM') {
      return raw.messageBody ?? '';
    }
    
    const dateStr = raw.date 
      ? new Date(raw.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : '[Date]';
    
    if (preset === 'MAINTENANCE') {
      const facilityId = Number(raw.facilityId);
      const facName = this.facilities().find(f => f.facilityId === facilityId)?.facilityName ?? '[Facility]';
      const reason = raw.reason || '[Reason]';
      return `Attention: The facility "${facName}" will be temporarily closed on ${dateStr} due to: ${reason}. Any active bookings for this facility on this day have been cancelled.`;
    }
    
    if (preset === 'DESK_RELEASE') {
      return `Reminder: Please confirm your office space booking for ${dateStr}. Unconfirmed bookings will be automatically released by 6:00 PM today.`;
    }
    
    if (preset === 'EMERGENCY_WFH') {
      const loc = raw.location || '[Office Location]';
      const details = raw.reason || '[Reason/Details]';
      return `Safety Update: Due to "${details}", all employees located at the ${loc} are advised to work WFH (Work From Home) on ${dateStr}.`;
    }
    
    return '';
  }

  async sendBroadcast(): Promise<void> {
    const generatedMsg = this.getGeneratedPreview().trim();
    if (!generatedMsg) {
      this.toastService.show('Please complete the required details before sending.', 'error');
      return;
    }

    try {
      const response = await firstValueFrom(this.adminApi.sendNotificationBroadcast(this.buildPayload(generatedMsg)));
      this.toastService.show(response.message || 'Notification sent successfully.', 'success');
      this.broadcastForm.patchValue({
        messageBody: '',
        facilityId: '',
        date: '',
        reason: ''
      });
      this.loadHistory(1);
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Notification could not be sent.', 'error');
    }
  }

  async loadFacilities(): Promise<void> {
    try {
      const list = await firstValueFrom(this.facilityApi.getFacilities());
      this.facilities.set(list ?? []);
    } catch (error) {
      console.warn('Could not load facilities list for maintenance dropdown preset.', error);
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
      return 'bg-emerald-50 text-emerald-700 border-emerald-250';
    }
    if (s === 'PENDING' || s === 'SCHEDULED') {
      return 'bg-amber-50 text-amber-700 border-amber-250';
    }
    if (s === 'PROCESSING' || s === 'RETRYING') {
      return 'bg-blue-50 text-blue-700 border-blue-250';
    }
    return 'bg-rose-50 text-rose-700 border-rose-250';
  }

  private buildPayload(messageContent: string) {
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
      subject: 'HyHub Alert',
      messageBody: messageContent,
      employeeIds: employeeIds.length > 0 ? employeeIds : undefined,
      location: 'ALL',
      workMode: 'ALL',
      preference: 'ALL',
      activeOnly: true,
      dryRun: false
    };
  }
}
