import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BookingFieldInput,
  FacilitySpecificationResponse,
  SpecificationField
} from '../../core/models/employee-flow.models';
import { DynamicFieldRendererComponent } from '../facility-form/dynamic-field-renderer.component';
import { BookingApiService } from '../../core/services/booking-api.service';
import { EmployeeApiService } from '../../core/services/employee-api.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-facility-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DynamicFieldRendererComponent],
  template: `
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

      <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4 md:grid-cols-2">
        <ng-container *ngFor="let field of orderedFields()">
          <app-dynamic-field-renderer [field]="field" [form]="form" [controlName]="controlName(field)" />
        </ng-container>

        <div class="md:col-span-2 mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
          <button type="submit" class="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm">Submit Request</button>
          <span *ngIf="message()" class="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">{{ message() }}</span>
          <span *ngIf="error()" class="text-sm font-medium text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg">{{ error() }}</span>
        </div>
      </form>
      </div>
    </section>
  `
})
export class FacilityBookingComponent implements OnInit {
  readonly spec = signal<FacilitySpecificationResponse | null>(null);
  readonly form: FormGroup = this.fb.group({});
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
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
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    const facilityId = Number(this.route.snapshot.paramMap.get('facilityId'));
    if (!facilityId) {
      this.router.navigateByUrl('/employee/dashboard');
      return;
    }

    this.bookingDate = this.route.snapshot.queryParamMap.get('date');

    this.employeeApi.getFacilitySpecification(facilityId).subscribe({
      next: (data) => {
        this.spec.set(data);
        this.rebuildForm(data.fields);
      },
      error: () => {
        this.error.set('Facility specification could not be loaded at this time.');
      }
    });
  }

  controlName(field: SpecificationField): string {
    return `field_${field.fieldId}`;
  }

  submit(): void {
    this.message.set(null);
    this.error.set(null);

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

  private rebuildForm(fields: SpecificationField[]): void {
    Object.keys(this.form.controls).forEach((key) => this.form.removeControl(key));

    for (const field of fields) {
      const validators = this.resolveValidators(field);
      const initialValue = this.resolveInitialValue(field);
      this.form.addControl(this.controlName(field), new FormControl(initialValue, validators));
    }
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
}
