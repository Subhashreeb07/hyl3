import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FacilityField, FacilitySpecification } from '../../core/models/specification.models';
import { SpecificationApiService } from '../../core/services/specification-api.service';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold text-slate-900">{{ spec()?.facilityName || 'Facility Form' }}</h2>
          <p class="text-sm text-slate-600">{{ spec()?.description || 'Dynamic form rendered from backend specification.' }}</p>
        </div>
        <button
          type="button"
          class="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900"
          (click)="loadTemplate()"
        >
          Reload Template
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4 md:grid-cols-2">
        <ng-container *ngFor="let field of orderedFields()">
          <div class="flex flex-col gap-2" [ngClass]="{ 'md:col-span-2': field.fieldType === 'TEXTAREA' }">
            <label class="text-sm font-medium text-slate-700">
              {{ field.label }}
              <span class="text-red-600" *ngIf="field.required">*</span>
            </label>

            <input
              *ngIf="isInputField(field.fieldType)"
              [type]="inputType(field.fieldType)"
              [formControlName]="controlName(field)"
              [placeholder]="field.placeholder || ''"
              class="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-brand-300 focus:ring"
            />

            <textarea
              *ngIf="field.fieldType === 'TEXTAREA'"
              [formControlName]="controlName(field)"
              [placeholder]="field.placeholder || ''"
              class="min-h-28 rounded-xl border border-slate-300 px-3 py-2 outline-none ring-brand-300 focus:ring"
            ></textarea>

            <select
              *ngIf="field.fieldType === 'DROPDOWN'"
              [formControlName]="controlName(field)"
              class="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-brand-300 focus:ring"
            >
              <option value="">Select</option>
              <option *ngFor="let option of field.options || []" [value]="option">{{ option }}</option>
            </select>

            <div *ngIf="field.fieldType === 'RADIO_BUTTON'" class="flex flex-wrap gap-4">
              <label *ngFor="let option of field.options || []" class="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" [formControlName]="controlName(field)" [value]="option" />
                <span>{{ option }}</span>
              </label>
            </div>

            <div *ngIf="field.fieldType === 'CHECKBOX'" class="flex flex-wrap gap-4">
              <label *ngFor="let option of field.options || []" class="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" [value]="option" (change)="onCheckboxChange(field, option, $event)" />
                <span>{{ option }}</span>
              </label>
            </div>
          </div>
        </ng-container>

        <div class="md:col-span-2 mt-2 flex items-center gap-3">
          <button
            type="submit"
            class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Submit Booking (Template)
          </button>
          <span class="text-xs text-slate-500">Wire this to booking API next.</span>
        </div>
      </form>

      <pre class="mt-5 overflow-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100">{{ form.value | json }}</pre>
    </div>
  `
})
export class DynamicFormComponent implements OnInit {
  readonly spec = signal<FacilitySpecification | null>(null);
  readonly form: FormGroup = this.fb.group({});

  readonly orderedFields = computed(() => {
    const fields = this.spec()?.fields ?? [];
    return [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly specificationApi: SpecificationApiService
  ) {}

  ngOnInit(): void {
    this.loadTemplate();
  }

  loadTemplate(): void {
    this.specificationApi.getTemplate().subscribe((data) => {
      this.spec.set(data);
      this.rebuildForm(data.fields);
    });
  }

  controlName(field: FacilityField): string {
    return `${field.label}_${field.displayOrder}`.replace(/\s+/g, '_').toLowerCase();
  }

  isInputField(type: string): boolean {
    return ['TEXTBOX', 'EMAIL', 'NUMBER', 'PHONE', 'DATE_PICKER', 'TIME_PICKER'].includes(type);
  }

  inputType(type: string): string {
    if (type === 'EMAIL') {
      return 'email';
    }
    if (type === 'NUMBER') {
      return 'number';
    }
    if (type === 'PHONE') {
      return 'tel';
    }
    if (type === 'DATE_PICKER') {
      return 'date';
    }
    if (type === 'TIME_PICKER') {
      return 'time';
    }
    return 'text';
  }

  onCheckboxChange(field: FacilityField, option: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const key = this.controlName(field);
    const current = (this.form.get(key)?.value as string[]) || [];

    const next = checked ? [...current, option] : current.filter((entry) => entry !== option);
    this.form.get(key)?.setValue(next);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('Template submission payload', this.form.value);
  }

  private rebuildForm(fields: FacilityField[]): void {
    Object.keys(this.form.controls).forEach((key) => this.form.removeControl(key));

    for (const field of fields) {
      const validators = field.required ? [Validators.required] : [];
      const initialValue = field.fieldType === 'CHECKBOX' ? [] : '';
      this.form.addControl(this.controlName(field), new FormControl(initialValue, validators));
    }
  }
}
