import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FacilityField, FieldType } from '../../../core/models/specification.models';

export interface FieldDialogData {
  field?: FacilityField;
  displayOrder: number;
}

@Component({
  selector: 'app-field-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title class="!text-lg !font-semibold">{{ data.field ? 'Edit Field' : 'Add Field' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="grid gap-3 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>Field Type</mat-label>
          <mat-select formControlName="fieldType">
            <mat-option *ngFor="let type of fieldTypes" [value]="type">{{ type }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Field Label</mat-label>
          <input matInput formControlName="label" />
          <mat-error *ngIf="form.controls.label.hasError('required')">Field label is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Placeholder</mat-label>
          <input matInput formControlName="placeholder" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Help Text</mat-label>
          <input matInput formControlName="helpText" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Default Value</mat-label>
          <input matInput formControlName="defaultValue" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Validation JSON</mat-label>
          <input matInput formControlName="validationJson" placeholder='{"min":1,"max":10}' />
          <mat-error *ngIf="form.controls.validationJson.hasError('invalidJson')">Validation JSON must be valid JSON object</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Conditional Visibility</mat-label>
          <input matInput formControlName="conditionalVisibility" placeholder="Meal Type = Veg" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Display Order</mat-label>
          <input type="number" matInput formControlName="displayOrder" />
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="usesOptions(form.value.fieldType)">
          <mat-label>Options (comma-separated)</mat-label>
          <input matInput formControlName="optionsCsv" placeholder="Veg,Non-Veg,No Preference" />
          <mat-error *ngIf="form.controls.optionsCsv.hasError('optionsRequired')">At least one option is required</mat-error>
        </mat-form-field>

        <mat-slide-toggle formControlName="required">Required</mat-slide-toggle>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Save Field</button>
    </mat-dialog-actions>
  `
})
export class FieldConfigDialogComponent {
  readonly data = inject<FieldDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<FieldConfigDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly fieldTypes: FieldType[] = [
    'TEXTBOX',
    'TEXTAREA',
    'DROPDOWN',
    'CHECKBOX',
    'RADIO_BUTTON',
    'DATE_PICKER',
    'TIME_PICKER',
    'EMAIL',
    'PHONE',
    'NUMBER',
    'FILE_UPLOAD',
    'QR_SCANNER',
    'SIGNATURE'
  ];

  readonly form = this.fb.group({
    fieldType: [this.data.field?.fieldType ?? 'TEXTBOX', Validators.required],
    label: [this.data.field?.label ?? '', [Validators.required, Validators.maxLength(80)]],
    placeholder: [this.data.field?.placeholder ?? ''],
    helpText: [this.data.field?.helpText ?? ''],
    defaultValue: [this.data.field?.defaultValue ?? ''],
    validationJson: [this.data.field?.validationJson ?? '', [this.validationJsonValidator]],
    conditionalVisibility: [this.data.field?.conditionalVisibility ?? ''],
    displayOrder: [this.data.field?.displayOrder ?? this.data.displayOrder, [Validators.required, Validators.min(1)]],
    required: [this.data.field?.required ?? false],
    optionsCsv: [(this.data.field?.options ?? []).join(','), [this.optionsValidator.bind(this)]]
  });

  usesOptions(type: FieldType | null | undefined): boolean {
    return type === 'DROPDOWN' || type === 'CHECKBOX' || type === 'RADIO_BUTTON';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const options = this.usesOptions(value.fieldType)
      ? (value.optionsCsv ?? '')
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => !!entry)
      : [];

    const defaultValue = (value.defaultValue ?? '').trim() || undefined;
    if (defaultValue && !this.isDefaultValueCompatible(value.fieldType ?? 'TEXTBOX', defaultValue, options)) {
      this.form.controls.defaultValue.setErrors({ invalidDefault: true });
      this.form.controls.defaultValue.markAsTouched();
      return;
    }

    const nextField: FacilityField = {
      label: (value.label ?? '').trim(),
      fieldType: value.fieldType ?? 'TEXTBOX',
      placeholder: (value.placeholder ?? '').trim() || undefined,
      required: Boolean(value.required),
      displayOrder: Number(value.displayOrder),
      helpText: (value.helpText ?? '').trim() || undefined,
      defaultValue,
      validationJson: (value.validationJson ?? '').trim() || undefined,
      conditionalVisibility: (value.conditionalVisibility ?? '').trim() || undefined,
      options
    };

    this.dialogRef.close(nextField);
  }

  private validationJsonValidator(control: AbstractControl): ValidationErrors | null {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return null;
      }
      return { invalidJson: true };
    } catch {
      return { invalidJson: true };
    }
  }

  private optionsValidator(control: AbstractControl): ValidationErrors | null {
    const fieldType = control.parent?.get('fieldType')?.value as FieldType | null | undefined;
    if (!this.usesOptions(fieldType)) {
      return null;
    }

    const options = String(control.value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return options.length > 0 ? null : { optionsRequired: true };
  }

  private isDefaultValueCompatible(type: FieldType, value: string, options: string[]): boolean {
    switch (type) {
      case 'EMAIL':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'PHONE':
        return /^[0-9+()\-\s]{7,20}$/.test(value);
      case 'NUMBER':
        return /^-?\d+(\.\d+)?$/.test(value);
      case 'DROPDOWN':
      case 'RADIO_BUTTON':
        return options.includes(value);
      default:
        return true;
    }
  }
}
