import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  FacilityAdminApiService,
  FacilityDetailResponse,
  FacilitySummaryResponse,
  RuleResponse
} from '../../../core/services/facility-admin-api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-rules-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-slate-900">Facility Rules</h2>
      <p class="text-sm text-slate-600">
        Manage booking rules for published facilities. Select a facility, update rules, and save.
      </p>

      <section class="satori-card space-y-4">
        <label class="admin-field">
          Published Facility
          <select [value]="selectedFacility()?.facilityId ?? ''" (change)="onSelectFacility($any($event.target).value)">
            <option value="" disabled>Select a published facility</option>
            <option *ngFor="let facility of facilities()" [value]="facility.facilityId">
              {{ facility.facilityName }}
            </option>
          </select>
        </label>

        <div
          *ngIf="!loading() && facilities().length === 0"
          class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600"
        >
          No published facilities available. Publish a facility from Facilities or Form Builder first.
        </div>
      </section>

      <form *ngIf="selectedFacility()" [formGroup]="form" class="satori-card grid gap-4 md:grid-cols-2">
        <label class="admin-field">Booking Start Time<input type="time" formControlName="bookingStartTime" /></label>
        <label class="admin-field">Booking Deadline<input type="time" formControlName="bookingDeadline" /></label>
        <label class="admin-field">Reminder Time<input type="time" formControlName="reminderTime" /></label>
        <label class="admin-field">Booking Window (Days)<input type="number" min="0" formControlName="bookingWindowDays" placeholder="e.g. 10" /></label>
        <label class="admin-field">Maximum Capacity<input type="number" min="1" formControlName="maximumCapacity" /></label>
        <label class="admin-inline"><input type="checkbox" formControlName="allowCancellation" /> Allow Cancellation</label>
        <label class="admin-inline"><input type="checkbox" formControlName="qrRequired" /> QR Required</label>
        <label class="admin-inline"><input type="checkbox" formControlName="regularCommuteEnabled" /> Regular Commute Enabled</label>
      </form>

      <!-- Facility Availability Date Range -->
      <section *ngIf="selectedFacility()" class="satori-card">
        <h3 class="text-sm font-semibold text-slate-900">Facility Availability</h3>
        <p class="text-xs text-slate-500">Set when this facility is available for booking. Leave empty for always available.</p>
        <div class="mt-3 grid gap-4 md:grid-cols-2">
          <label class="admin-field">Available From<input type="date" formControlName="facilityAvailableFromDate" /></label>
          <label class="admin-field">Available To<input type="date" formControlName="facilityAvailableToDate" /></label>
        </div>
        <p *ngIf="form.get('facilityAvailableFromDate')?.value || form.get('facilityAvailableToDate')?.value" class="mt-2 text-xs text-[#0f6cbd]">
          Availability: {{ formatDateRange() }}
        </p>
        <p *ngIf="!form.get('facilityAvailableFromDate')?.value && !form.get('facilityAvailableToDate')?.value" class="mt-2 text-xs text-slate-500">
          No restriction — facility available for all dates.
        </p>
      </section>

      <div class="flex justify-end" *ngIf="selectedFacility()">
        <button class="satori-primary" (click)="save()">Save Facility Rules</button>
      </div>
    </div>
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
      .admin-field select {
        border: 1px solid #cbd5e1;
        border-radius: 0.65rem;
        padding: 0.55rem 0.7rem;
        background: #ffffff;
      }

      .admin-inline {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.86rem;
        color: #334155;
      }
    `
  ]
})
export class AdminRulesPageComponent implements OnInit {
  readonly facilities = signal<FacilityDetailResponse[]>([]);
  readonly selectedFacility = signal<FacilityDetailResponse | null>(null);
  readonly loading = signal(false);

  readonly weekDays = [
    { label: 'Monday', value: 'MONDAY' },
    { label: 'Tuesday', value: 'TUESDAY' },
    { label: 'Wednesday', value: 'WEDNESDAY' },
    { label: 'Thursday', value: 'THURSDAY' },
    { label: 'Friday', value: 'FRIDAY' },
    { label: 'Saturday', value: 'SATURDAY' },
    { label: 'Sunday', value: 'SUNDAY' }
  ];

  readonly form = this.fb.group({
    bookingStartTime: [''],
    bookingDeadline: [''],
    reminderTime: [''],
    bookingWindowDays: [null as number | null],
    maximumCapacity: [null as number | null],
    allowCancellation: [true],
    qrRequired: [false],
    regularCommuteEnabled: [false],
    availableDays: [''],
    facilityAvailableFromDate: [''],
    facilityAvailableToDate: ['']
  });

  formatDateRange(): string {
    const from = this.form.get('facilityAvailableFromDate')?.value;
    const to = this.form.get('facilityAvailableToDate')?.value;
    
    if (!from && !to) return '';
    if (from && !to) return `From ${new Date(from as string).toLocaleDateString()}`;
    if (!from && to) return `Until ${new Date(to as string).toLocaleDateString()}`;
    return `${new Date(from as string).toLocaleDateString()} – ${new Date(to as string).toLocaleDateString()}`;
  }

  get selectedDays(): () => string[] {
    return () => {
      const val = this.form.get('availableDays')?.value as string ?? '';
      return val ? val.split(',').map(d => d.trim()).filter(Boolean) : [];
    };
  }

  get selectedDaysLabel(): () => string {
    return () => {
      return this.selectedDays()
        .map(d => d.charAt(0) + d.slice(1).toLowerCase())
        .join(', ');
    };
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays().includes(day);
  }

  toggleDay(day: string): void {
    const current = this.selectedDays();
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];

    this.form.patchValue({ availableDays: updated.join(',') });
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly facilityAdminApi: FacilityAdminApiService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPublishedFacilities();
  }

  async onSelectFacility(facilityId: string): Promise<void> {
    const id = Number(facilityId);
    if (!Number.isFinite(id)) {
      return;
    }

    const facility = this.facilities().find((item) => item.facilityId === id) ?? null;
    this.selectedFacility.set(facility);
    await this.loadRules(id);
  }

  async save(): Promise<void> {
    const facility = this.selectedFacility();
    if (!facility) {
      this.toastService.show('Select a published facility first', 'error');
      return;
    }

    const raw = this.form.value;
    try {
      await firstValueFrom(
        this.facilityAdminApi.saveRules(facility.facilityId, {
          bookingStartTime: raw.bookingStartTime || null,
          bookingDeadline: raw.bookingDeadline || null,
          reminderTime: raw.reminderTime || null,
          bookingWindowDays: raw.bookingWindowDays ?? null,
          maximumCapacity: raw.maximumCapacity ?? null,
          allowCancellation: Boolean(raw.allowCancellation),
          qrRequired: Boolean(raw.qrRequired),
          regularCommuteEnabled: Boolean(raw.regularCommuteEnabled),
          availableDays: raw.availableDays || null,
          facilityAvailableFromDate: raw.facilityAvailableFromDate || null,
          facilityAvailableToDate: raw.facilityAvailableToDate || null
        })
      );
      this.toastService.show('Rules saved successfully', 'success');
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to save rules', 'error');
    }
  }

  private async loadPublishedFacilities(): Promise<void> {
    this.loading.set(true);
    try {
      const summaries = await firstValueFrom(this.facilityAdminApi.getFacilities());
      const detailRequests = summaries.map((summary: FacilitySummaryResponse) =>
        firstValueFrom(this.facilityAdminApi.getFacility(summary.facilityId))
      );

      const details = await Promise.all(detailRequests);
      const published = details.filter((facility) => facility.published);
      this.facilities.set(published);

      if (published.length > 0) {
        this.selectedFacility.set(published[0]);
        await this.loadRules(published[0].facilityId);
      }
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load published facilities', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRules(facilityId: number): Promise<void> {
    try {
      const rules: RuleResponse = await firstValueFrom(this.facilityAdminApi.getRules(facilityId));
      this.form.patchValue({
        bookingStartTime: rules.bookingStartTime ?? '',
        bookingDeadline: rules.bookingDeadline ?? '',
        reminderTime: rules.reminderTime ?? '',
        bookingWindowDays: rules.bookingWindowDays ?? null,
        maximumCapacity: rules.maximumCapacity ?? null,
        allowCancellation: rules.allowCancellation ?? true,
        qrRequired: rules.qrRequired ?? false,
        regularCommuteEnabled: rules.regularCommuteEnabled ?? false,
        availableDays: rules.availableDays ?? '',
        facilityAvailableFromDate: rules.facilityAvailableFromDate ?? '',
        facilityAvailableToDate: rules.facilityAvailableToDate ?? ''
      });
    } catch (error: any) {
      this.toastService.show(error?.error?.message ?? 'Failed to load rules for selected facility', 'error');
    }
  }
}
