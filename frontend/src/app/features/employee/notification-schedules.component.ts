import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { NotificationScheduleApiService, ScheduleResponse, CreateScheduleRequest, UpdateScheduleRequest } from '../../core/services/notification-schedule-api.service';
import { ToastService } from '../../core/services/toast.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-notification-schedules',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatChipsModule
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-slate-900">Notification Schedules</h2>
        <button class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition flex items-center gap-2"
                (click)="openCreateDialog()">
          <mat-icon class="!text-[20px]">add</mat-icon>
          New Schedule
        </button>
      </div>

      <div *ngIf="schedules().length === 0" class="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <mat-icon class="!text-[48px] text-slate-300 block mx-auto mb-4">notifications_none</mat-icon>
        <p class="text-slate-600">No notification schedules yet. Create one to get started.</p>
      </div>

      <div *ngIf="schedules().length > 0" class="grid gap-4">
        <div *ngFor="let schedule of schedules()" class="rounded-lg border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-semibold text-slate-900">{{ schedule.templateName }}</h3>
                <span class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-blue-100 text-blue-700': schedule.frequency === 'ONCE',
                        'bg-green-100 text-green-700': schedule.frequency === 'DAILY',
                        'bg-purple-100 text-purple-700': schedule.frequency === 'WEEKLY',
                        'bg-orange-100 text-orange-700': schedule.frequency === 'MONTHLY'
                      }">
                  {{ schedule.frequency }}
                </span>
                <span *ngIf="schedule.active" class="inline-block px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Active
                </span>
                <span *ngIf="!schedule.active" class="inline-block px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  Inactive
                </span>
              </div>
              <p class="text-sm text-slate-500 mt-1">Created: {{ formatDate(schedule.createdAt) }}</p>
            </div>
            <div class="flex gap-2">
              <button class="rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition"
                      (click)="openEditDialog(schedule)"
                      title="Edit">
                <mat-icon class="!text-[20px]">edit</mat-icon>
              </button>
              <button class="rounded-md bg-red-50 p-2 text-red-600 hover:bg-red-100 transition"
                      (click)="deleteSchedule(schedule.scheduleId)"
                      title="Delete">
                <mat-icon class="!text-[20px]">delete</mat-icon>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-slate-500 text-xs font-semibold uppercase">Start Date</p>
              <p class="text-slate-900 font-medium">{{ formatDate(schedule.startDate) }}</p>
            </div>
            <div *ngIf="schedule.endDate">
              <p class="text-slate-500 text-xs font-semibold uppercase">End Date</p>
              <p class="text-slate-900 font-medium">{{ formatDate(schedule.endDate) }}</p>
            </div>
            <div *ngIf="schedule.timeOfDay">
              <p class="text-slate-500 text-xs font-semibold uppercase">Time</p>
              <p class="text-slate-900 font-medium">{{ schedule.timeOfDay }}</p>
            </div>
            <div *ngIf="schedule.timezone">
              <p class="text-slate-500 text-xs font-semibold uppercase">Timezone</p>
              <p class="text-slate-900 font-medium">{{ schedule.timezone }}</p>
            </div>
          </div>

          <div *ngIf="schedule.daysOfWeek" class="mt-4">
            <p class="text-slate-500 text-xs font-semibold uppercase mb-2">Days</p>
            <div class="flex gap-2 flex-wrap">
              <span *ngFor="let day of schedule.daysOfWeek.split(',')" class="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {{ day.trim() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class NotificationSchedulesComponent implements OnInit {
  schedules = signal<ScheduleResponse[]>([]);
  loading = signal(false);

  constructor(
    private scheduleApi: NotificationScheduleApiService,
    private toastService: ToastService,
    private sessionService: SessionService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  private loadSchedules(): void {
    this.loading.set(true);
    this.scheduleApi.getEmployeeSchedules().subscribe({
      next: (response) => {
        this.schedules.set(response.items);
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Failed to load schedules');
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    this.dialog.open(CreateScheduleDialogComponent, {
      width: '600px',
      disableClose: false
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadSchedules();
      }
    });
  }

  openEditDialog(schedule: ScheduleResponse): void {
    this.dialog.open(EditScheduleDialogComponent, {
      width: '600px',
      data: schedule,
      disableClose: false
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadSchedules();
      }
    });
  }

  deleteSchedule(scheduleId: number): void {
    if (confirm('Are you sure you want to delete this schedule?')) {
      this.scheduleApi.deleteSchedule(scheduleId).subscribe({
        next: () => {
          this.toastService.success('Schedule deleted successfully');
          this.loadSchedules();
        },
        error: (error) => {
          this.toastService.error('Failed to delete schedule');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  }
}

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject, Optional } from '@angular/core';

@Component({
  selector: 'app-create-schedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  template: `
    <div class="p-6 space-y-6">
      <h2 class="text-xl font-bold text-slate-900">Create New Schedule</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <mat-form-field class="w-full">
          <mat-label>Template</mat-label>
          <mat-select formControlName="templateId" required>
            <mat-option *ngFor="let template of templates" [value]="template.templateId">
              {{ template.templateName }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Frequency</mat-label>
          <mat-select formControlName="frequency" required (selectionChange)="onFrequencyChange()">
            <mat-option value="ONCE">One Time</mat-option>
            <mat-option value="DAILY">Daily</mat-option>
            <mat-option value="WEEKLY">Weekly</mat-option>
            <mat-option value="MONTHLY">Monthly</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full" *ngIf="frequency === 'ONCE'">
          <mat-label>Schedule Date & Time</mat-label>
          <input matInput type="datetime-local" formControlName="scheduledAt" required />
        </mat-form-field>

        <mat-form-field class="w-full" *ngIf="frequency !== 'ONCE'">
          <mat-label>Time of Day</mat-label>
          <input matInput type="time" formControlName="timeOfDay" required />
        </mat-form-field>

        <mat-form-field class="w-full" *ngIf="frequency === 'WEEKLY'">
          <mat-label>Days of Week (comma separated)</mat-label>
          <input matInput placeholder="MON,WED,FRI" formControlName="daysOfWeek" />
        </mat-form-field>

        <mat-form-field class="w-full" *ngIf="frequency === 'MONTHLY'">
          <mat-label>Day of Month</mat-label>
          <mat-select formControlName="dayOfMonth">
            <mat-option *ngFor="let day of daysOfMonth" [value]="day">{{ day }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Start Date</mat-label>
          <input matInput type="date" formControlName="startDate" required />
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>End Date (Optional)</mat-label>
          <input matInput type="date" formControlName="endDate" />
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Timezone</mat-label>
          <mat-select formControlName="timezone">
            <mat-option value="UTC">UTC</mat-option>
            <mat-option value="EST">EST</mat-option>
            <mat-option value="CST">CST</mat-option>
            <mat-option value="MST">MST</mat-option>
            <mat-option value="PST">PST</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="flex gap-2 pt-4">
          <button type="button" mat-stroked-button (click)="onCancel()" class="flex-1">Cancel</button>
          <button type="submit" mat-raised-button color="primary" class="flex-1" [disabled]="!form.valid || loading()">
            Create Schedule
          </button>
        </div>
      </form>
    </div>
  `
})
export class CreateScheduleDialogComponent implements OnInit {
  form!: FormGroup;
  templates: any[] = [];
  frequency: string = 'ONCE';
  daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateScheduleDialogComponent>,
    private scheduleApi: NotificationScheduleApiService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      templateId: ['', Validators.required],
      frequency: ['ONCE', Validators.required],
      scheduledAt: [''],
      timeOfDay: [''],
      daysOfWeek: [''],
      dayOfMonth: [''],
      startDate: ['', Validators.required],
      endDate: [''],
      timezone: ['UTC']
    });
  }

  ngOnInit(): void {
    this.frequency = this.form.get('frequency')?.value || 'ONCE';
  }

  onFrequencyChange(): void {
    this.frequency = this.form.get('frequency')?.value || 'ONCE';
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.loading.set(true);
    const request: CreateScheduleRequest = {
      templateId: this.form.get('templateId')?.value,
      frequency: this.form.get('frequency')?.value,
      scheduledAt: this.form.get('scheduledAt')?.value,
      timeOfDay: this.form.get('timeOfDay')?.value,
      daysOfWeek: this.form.get('daysOfWeek')?.value,
      dayOfMonth: this.form.get('dayOfMonth')?.value,
      startDate: this.form.get('startDate')?.value,
      endDate: this.form.get('endDate')?.value,
      timezone: this.form.get('timezone')?.value
    };

    this.scheduleApi.createSchedule(request).subscribe({
      next: () => {
        this.toastService.success('Schedule created successfully');
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.toastService.error('Failed to create schedule');
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-edit-schedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  template: `
    <div class="p-6 space-y-6">
      <h2 class="text-xl font-bold text-slate-900">Edit Schedule</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <mat-form-field class="w-full">
          <mat-label>Template</mat-label>
          <mat-select formControlName="templateId" required>
            <mat-option *ngFor="let template of templates" [value]="template.templateId">
              {{ template.templateName }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Status</mat-label>
          <mat-select formControlName="active">
            <mat-option [value]="true">Active</mat-option>
            <mat-option [value]="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Frequency</mat-label>
          <mat-select formControlName="frequency" required (selectionChange)="onFrequencyChange()">
            <mat-option value="ONCE">One Time</mat-option>
            <mat-option value="DAILY">Daily</mat-option>
            <mat-option value="WEEKLY">Weekly</mat-option>
            <mat-option value="MONTHLY">Monthly</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full" *ngIf="frequency === 'ONCE'">
          <mat-label>Schedule Date & Time</mat-label>
          <input matInput type="datetime-local" formControlName="scheduledAt" />
        </mat-form-field>

        <mat-form-field class="w-full" *ngIf="frequency !== 'ONCE'">
          <mat-label>Time of Day</mat-label>
          <input matInput type="time" formControlName="timeOfDay" />
        </mat-form-field>

        <mat-form-field class="w-full" *ngIf="frequency === 'WEEKLY'">
          <mat-label>Days of Week (comma separated)</mat-label>
          <input matInput placeholder="MON,WED,FRI" formControlName="daysOfWeek" />
        </mat-form-field>

        <mat-form-field class="w-full" *ngIf="frequency === 'MONTHLY'">
          <mat-label>Day of Month</mat-label>
          <mat-select formControlName="dayOfMonth">
            <mat-option *ngFor="let day of daysOfMonth" [value]="day">{{ day }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Start Date</mat-label>
          <input matInput type="date" formControlName="startDate" required />
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>End Date (Optional)</mat-label>
          <input matInput type="date" formControlName="endDate" />
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Timezone</mat-label>
          <mat-select formControlName="timezone">
            <mat-option value="UTC">UTC</mat-option>
            <mat-option value="EST">EST</mat-option>
            <mat-option value="CST">CST</mat-option>
            <mat-option value="MST">MST</mat-option>
            <mat-option value="PST">PST</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="flex gap-2 pt-4">
          <button type="button" mat-stroked-button (click)="onCancel()" class="flex-1">Cancel</button>
          <button type="submit" mat-raised-button color="primary" class="flex-1" [disabled]="!form.valid || loading()">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  `
})
export class EditScheduleDialogComponent implements OnInit {
  form!: FormGroup;
  templates: any[] = [];
  frequency: string = 'ONCE';
  daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditScheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private scheduleApi: NotificationScheduleApiService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      scheduleId: [data.scheduleId],
      templateId: [data.templateId, Validators.required],
      frequency: [data.frequency, Validators.required],
      scheduledAt: [data.scheduledAt || ''],
      timeOfDay: [data.timeOfDay || ''],
      daysOfWeek: [data.daysOfWeek || ''],
      dayOfMonth: [data.dayOfMonth || ''],
      startDate: [data.startDate, Validators.required],
      endDate: [data.endDate || ''],
      timezone: [data.timezone || 'UTC'],
      active: [data.active]
    });
  }

  ngOnInit(): void {
    this.frequency = this.form.get('frequency')?.value || 'ONCE';
  }

  onFrequencyChange(): void {
    this.frequency = this.form.get('frequency')?.value || 'ONCE';
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.loading.set(true);
    const request: UpdateScheduleRequest = {
      scheduleId: this.form.get('scheduleId')?.value,
      templateId: this.form.get('templateId')?.value,
      frequency: this.form.get('frequency')?.value,
      scheduledAt: this.form.get('scheduledAt')?.value,
      timeOfDay: this.form.get('timeOfDay')?.value,
      daysOfWeek: this.form.get('daysOfWeek')?.value,
      dayOfMonth: this.form.get('dayOfMonth')?.value,
      startDate: this.form.get('startDate')?.value,
      endDate: this.form.get('endDate')?.value,
      timezone: this.form.get('timezone')?.value,
      active: this.form.get('active')?.value
    };

    this.scheduleApi.updateSchedule(request).subscribe({
      next: () => {
        this.toastService.success('Schedule updated successfully');
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.toastService.error('Failed to update schedule');
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
