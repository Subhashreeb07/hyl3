import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BookingFieldInput,
  BookingPreferenceResponse,
  FacilitySpecificationResponse,
  SpecificationField
} from '../../core/models/employee-flow.models';
import { DynamicFieldRendererComponent } from '../facility-form/dynamic-field-renderer.component';
import { BookingApiService } from '../../core/services/booking-api.service';
import { EmployeeApiService } from '../../core/services/employee-api.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';
import { SavedPreferencesService } from '../../core/services/saved-preferences.service';

@Component({
  selector: 'app-facility-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DynamicFieldRendererComponent],
  template: `
    <section class="mx-auto max-w-4xl py-6 px-4 md:px-0" *ngIf="accessBlocked() as blockedReason">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-brand-600">Facility Request</p>
          <h2 class="mt-1 text-2xl font-bold text-slate-900">Access Restricted</h2>
          <p *ngIf="bookingDate" class="mt-2 text-sm font-medium text-slate-700 flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-fit">
            <span class="material-icons-outlined text-[1.1em] mr-1.5 text-slate-500">calendar_today</span> Date: <strong class="ml-1 text-slate-900">{{ bookingDate | date: 'EEEE, MMMM d, y' }}</strong>
          </p>
        </div>
        <a routerLink="/employee/dashboard" class="satori-secondary">Return to Dashboard</a>
      </div>

      <div class="bg-white p-6 rounded-xl border border-rose-200 shadow-sm">
        <p class="text-sm font-semibold text-rose-700">{{ blockedReason }}</p>
        <p class="mt-2 text-sm text-slate-500">This facility can only be accessed within the admin-configured date and booking time window.</p>
      </div>
    </section>

    <section class="mx-auto max-w-4xl py-6 px-4 md:px-0" *ngIf="spec() as data">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-brand-600">Facility Request</p>
          <h2 class="mt-1 text-2xl font-bold text-slate-900">{{ data.facilityName }}</h2>
          <p *ngIf="bookingDate" class="mt-2 text-sm font-medium text-slate-700 flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-fit">
            <span class="material-icons-outlined text-[1.1em] mr-1.5 text-slate-500">calendar_today</span> Booking for: <strong class="ml-1 text-slate-900">{{ bookingDate | date: 'EEEE, MMMM d, y' }}</strong>
          </p>
        </div>
        <a routerLink="/employee/dashboard" class="satori-secondary">Return to Dashboard</a>
      </div>

      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p class="mb-6 text-sm text-slate-500">Complete the form below to submit your service request through the portal.</p>

      <!-- Preference action bar -->
      <div class="mb-5 flex flex-wrap items-center gap-2">
        <button *ngIf="hasSavedPref()"
          type="button"
          class="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          (click)="applySavedPreference()">
          <span class="material-icons-outlined" style="font-size:16px">bookmark</span>
          Use Saved Preference
        </button>
        <button *ngIf="data.rules?.regularCommuteEnabled"
          type="button"
          class="flex items-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
          [disabled]="prefillLoading()"
          (click)="applyRegularPreferences()">
          <span class="material-icons-outlined" style="font-size:16px">history</span>
          {{ prefillLoading() ? 'Applying...' : 'Use Regular Preferences' }}
        </button>
        <span *ngIf="!hasSavedPref() && !data.rules?.regularCommuteEnabled" class="text-xs text-slate-400">Fill the form and save as your preference for quick reuse.</span>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4 md:grid-cols-2">
        <ng-container *ngFor="let field of orderedFields()">
          <app-dynamic-field-renderer [field]="field" [form]="form" [controlName]="controlName(field)" />
        </ng-container>

        <div class="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
          <div class="flex flex-wrap items-center gap-3">
            <button type="submit" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm">Submit Request</button>
            <button type="button"
                    class="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    (click)="savePreference()">
              <span class="material-icons-outlined" style="font-size:16px">{{ prefSaveDone() ? 'bookmark' : 'bookmark_border' }}</span>
              {{ prefSaveDone() ? 'Preference Saved!' : (hasSavedPref() ? 'Update Preference' : 'Save as Preference') }}
            </button>
          </div>
          <span *ngIf="message()" class="mt-3 block text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">{{ message() }}</span>
          <span *ngIf="error()" class="mt-3 block text-sm font-medium text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg">{{ error() }}</span>
        </div>
      </form>
      </div>
    </section>
  `
})
export class FacilityBookingComponent implements OnInit {
  private readonly hylandEmailPattern = /^[A-Za-z0-9._%+-]+@hyland\.com$/i;
  readonly spec = signal<FacilitySpecificationResponse | null>(null);
  readonly form: FormGroup = this.fb.group({});
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly accessBlocked = signal<string | null>(null);
  readonly prefillLoading = signal(false);
  readonly hasSavedPref = signal(false);
  readonly prefSaveDone = signal(false);
  bookingDate: string | null = null;

  readonly orderedFields = computed(() => {
    const fields = this.spec()?.fields ?? [];
    return [...fields];
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly employeeApi: EmployeeApiService,
    private readonly bookingApi: BookingApiService,
    private readonly sessionService: SessionService,
    private readonly toastService: ToastService,
    private readonly prefService: SavedPreferencesService
  ) {}

  ngOnInit(): void {
    const facilityId = Number(this.route.snapshot.paramMap.get('facilityId'));
    if (!facilityId) {
      this.router.navigateByUrl('/employee/dashboard');
      return;
    }

    this.bookingDate = this.route.snapshot.queryParamMap.get('date') || this.todayIsoDate();
    this.validateAccessAndLoadSpecification(facilityId, this.bookingDate);
  }

  controlName(field: SpecificationField): string {
    return `field_${field.fieldId}`;
  }

  submit(): void {
    this.message.set(null);
    this.error.set(null);

    if (this.accessBlocked()) {
      const blockedMessage = this.accessBlocked() ?? 'This facility is not accessible at this time.';
      this.error.set(blockedMessage);
      this.toastService.show(blockedMessage, 'error');
      return;
    }

    if (this.form.invalid || !this.spec()) {
      this.form.markAllAsTouched();
      return;
    }

    const employeeId = this.sessionService.getEmployeeId();
    const facility = this.spec();
    if (!employeeId || !facility) {
      this.error.set('Your session has expired. Please sign in again.');
      this.router.navigateByUrl('/login');
      return;
    }

    const responses: BookingFieldInput[] = facility.fields
      .map((field) => {
        const raw = this.form.get(this.controlName(field))?.value;
        const value = Array.isArray(raw) ? raw.join(',') : String(raw ?? '').trim();
        return { fieldId: field.fieldId, value };
      })
      .filter((entry) => entry.value.length > 0);

    if (responses.length === 0) {
      const message = 'Please provide at least one field value before submitting your request.';
      this.error.set(message);
      this.toastService.show(message, 'error');
      return;
    }

    this.bookingApi
      .submitBooking({
        facilityId: facility.facilityId,
        employeeId,
        bookingDate: this.route.snapshot.queryParamMap.get('date') || undefined,
        responses
      })
      .subscribe({
        next: (result) => {
          const successMessage = result.message?.trim().length
            ? `${result.message} (#${result.bookingId})`
            : `Booking request confirmed with ID #${result.bookingId}`;
          this.message.set(successMessage);
          this.toastService.show(successMessage, 'success');
          this.router.navigate(['/employee/bookings', result.bookingId]);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'The booking request was not submitted successfully.');
          this.toastService.show(this.error() ?? 'The booking request was not submitted successfully.', 'error');
        }
      });
  }

  applyRegularPreferences(): void {
    this.error.set(null);
    const employeeId = this.sessionService.getEmployeeId();
    const facility = this.spec();
    if (!employeeId || !facility) {
      this.toastService.show('Your session has expired. Please sign in again.', 'error');
      this.router.navigateByUrl('/login');
      return;
    }

    this.prefillLoading.set(true);
    this.bookingApi.getBookingPreferences(employeeId, facility.facilityId).subscribe({
      next: (response) => {
        this.applyPreferenceResponse(response);
      },
      error: (err) => {
        this.prefillLoading.set(false);
        const message = err?.error?.message ?? 'Could not load your regular preferences.';
        this.toastService.show(message, 'error');
      }
    });
  }

  private rebuildForm(fields: SpecificationField[]): void {
    Object.keys(this.form.controls).forEach((key) => this.form.removeControl(key));

    for (const field of fields) {
      const validators = this.resolveValidators(field);
      const initialValue = this.resolveInitialValue(field);
      this.form.addControl(this.controlName(field), new FormControl(initialValue, validators));
    }
  }

  private applyPreferenceResponse(response: BookingPreferenceResponse): void {
    const facility = this.spec();
    if (!facility) {
      this.prefillLoading.set(false);
      return;
    }

    const byFieldId = new Map(response.preferences.map((item) => [item.fieldId, item]));

    for (const field of facility.fields) {
      const preference = byFieldId.get(field.fieldId);
      if (!preference) {
        continue;
      }

      const control = this.form.get(this.controlName(field));
      if (!control) {
        continue;
      }

      const normalizedType = field.type.toUpperCase();
      if (normalizedType === 'CHECKBOX') {
        const values = preference.value
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0);
        control.setValue(values);
      } else {
        control.setValue(preference.value ?? '');
      }
    }

    this.prefillLoading.set(false);

    if (response.sampleSize === 0) {
      this.toastService.show('No previous confirmed bookings found for this facility yet.', 'success');
      return;
    }

    this.toastService.show(
      `Regular preferences applied from ${response.sampleSize} confirmed booking(s).`,
      'success'
    );
  }

  private resolveInitialValue(field: SpecificationField): string | string[] {
    const type = field.type.toUpperCase();
    if (type === 'CHECKBOX') {
      return [];
    }
    return (field.defaultValue ?? '').toString();
  }

  private resolveValidators(field: SpecificationField): any[] {
    const validators: any[] = [];
    if (field.required) {
      validators.push(Validators.required);
    }

    const type = field.type.toUpperCase();
    if (type === 'EMAIL') {
      validators.push(Validators.email);
      validators.push(Validators.pattern(this.hylandEmailPattern));
    }

    if (type === 'NUMBER') {
      validators.push(Validators.pattern(/^-?\\d+(\\.\\d+)?$/));
    }

    if (type === 'PHONE') {
      validators.push(Validators.pattern(/^[0-9+()\\-\\s]{7,20}$/));
    }

    const rules = this.parseValidationJson(field.validationJson);
    const minLength = rules['minLength'];
    const maxLength = rules['maxLength'];
    const min = rules['min'];
    const max = rules['max'];
    const pattern = rules['pattern'];

    if (typeof minLength === 'number') {
      validators.push(Validators.minLength(minLength));
    }
    if (typeof maxLength === 'number') {
      validators.push(Validators.maxLength(maxLength));
    }
    if (typeof min === 'number') {
      validators.push(Validators.min(min));
    }
    if (typeof max === 'number') {
      validators.push(Validators.max(max));
    }
    if (typeof pattern === 'string' && pattern.trim().length > 0) {
      try {
        validators.push(Validators.pattern(new RegExp(pattern)));
      } catch {
        // Ignore invalid pattern from malformed specification.
      }
    }

    return validators;
  }

  private parseValidationJson(raw?: string | null): Record<string, unknown> {
    if (!raw || raw.trim().length === 0) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  private validateAccessAndLoadSpecification(facilityId: number, bookingDate: string): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) {
      this.error.set('Your session has expired. Please sign in again.');
      this.router.navigateByUrl('/login');
      return;
    }

    this.employeeApi.getAvailableFacilitiesForDate(employeeId, bookingDate).subscribe({
      next: (facilities) => {
        const facilityAvailability = facilities.find((facility) => facility.facilityId === facilityId);
        if (!facilityAvailability) {
          this.accessBlocked.set('Facility is not available for the selected date.');
          return;
        }

        if (!facilityAvailability.bookingAllowed) {
          this.accessBlocked.set(
            facilityAvailability.unavailableReason?.trim() || 'Facility is not accessible at this date/time.'
          );
          return;
        }

        this.accessBlocked.set(null);
        this.loadFacilitySpecification(facilityId);
      },
      error: () => {
        this.error.set('Facility availability could not be verified at this time.');
      }
    });
  }

  private loadFacilitySpecification(facilityId: number): void {
    this.employeeApi.getFacilitySpecification(facilityId).subscribe({
      next: (data) => {
        this.spec.set(data);
        this.rebuildForm(data.fields);
        this.hasSavedPref.set(this.prefService.load(data.facilityId) !== null);
      },
      error: () => {
        this.error.set('Facility specification could not be loaded at this time.');
      }
    });
  }

  savePreference(): void {
    const facility = this.spec();
    if (!facility) return;

    const values = facility.fields
      .map((field) => {
        const raw = this.form.get(this.controlName(field))?.value;
        const value = Array.isArray(raw)
          ? (raw as string[]).join(',')
          : String(raw ?? '').trim();
        return { fieldId: field.fieldId, label: field.label, value };
      })
      .filter((v) => v.value.length > 0);

    this.prefService.save({
      facilityId: facility.facilityId,
      facilityName: facility.facilityName,
      savedAt: new Date().toISOString(),
      values
    });

    this.hasSavedPref.set(true);
    this.prefSaveDone.set(true);
    this.toastService.show(`Preferences saved for ${facility.facilityName}`, 'success');
    setTimeout(() => this.prefSaveDone.set(false), 3000);
  }

  applySavedPreference(): void {
    const facility = this.spec();
    if (!facility) return;

    const pref = this.prefService.load(facility.facilityId);
    if (!pref) return;

    const byFieldId = new Map(pref.values.map((v) => [v.fieldId, v.value]));

    for (const field of facility.fields) {
      const val = byFieldId.get(field.fieldId);
      if (val === undefined) continue;
      const ctrl = this.form.get(this.controlName(field));
      if (!ctrl) continue;
      if (field.type.toUpperCase() === 'CHECKBOX') {
        ctrl.setValue(val.split(',').map((v) => v.trim()).filter((v) => v.length > 0));
      } else {
        ctrl.setValue(val);
      }
    }

    this.toastService.show('Saved preference applied!', 'success');
  }

  private todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
