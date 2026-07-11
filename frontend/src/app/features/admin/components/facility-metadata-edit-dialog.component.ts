import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FacilityBuilderRecord } from '../state/facility-builder-state.service';

export interface FacilityMetadataEditDialogData {
  facility: FacilityBuilderRecord;
}

export interface FacilityMetadataEditDialogResult {
  facilityName: string;
  description?: string;
  category?: string;
  icon?: string;
  status: boolean;
}

@Component({
  selector: 'app-facility-metadata-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Edit Facility</h2>

    <form class="grid gap-3" [formGroup]="form" (ngSubmit)="save()">
      <label class="admin-field">
        Facility Name
        <input type="text" formControlName="facilityName" />
      </label>

      <label class="admin-field">
        Category
        <select formControlName="category">
          <option *ngFor="let category of categoryOptions" [value]="category">{{ category }}</option>
        </select>
      </label>

      <label class="admin-field" *ngIf="form.value.category === 'Other'">
        Custom Category
        <input type="text" formControlName="customCategory" placeholder="Enter category" />
      </label>

      <label class="admin-field">
        Icon
        <select formControlName="icon">
          <option *ngFor="let icon of iconChoices" [value]="icon">{{ icon }}</option>
        </select>
      </label>

      <label class="admin-field">
        Description
        <textarea rows="3" formControlName="description"></textarea>
      </label>

      <label class="admin-inline">
        <input type="checkbox" formControlName="status" /> Enable Facility
      </label>

      <div mat-dialog-actions align="end">
        <button type="button" class="satori-secondary" (click)="cancel()">Cancel</button>
        <button type="submit" class="satori-primary" [disabled]="form.invalid">Save</button>
      </div>
    </form>
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
      .admin-field textarea,
      .admin-field select {
        border: 1px solid #cbd5e1;
        border-radius: 0.65rem;
        padding: 0.55rem 0.7rem;
        background: #ffffff;
        font-size: 0.9rem;
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
export class FacilityMetadataEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject<FacilityMetadataEditDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<FacilityMetadataEditDialogComponent, FacilityMetadataEditDialogResult>
  );

  readonly iconChoices = ['restaurant', 'directions_bus', 'local_parking', 'badge', 'event', 'meeting_room', 'inventory_2'];
  readonly categoryOptions = ['Food', 'Mobility', 'Parking', 'Workspace', 'Events', 'Visitors', 'Security', 'IT Services', 'Other'];

  readonly form = this.fb.group({
    facilityName: ['', Validators.required],
    description: [''],
    category: ['General', Validators.required],
    customCategory: [''],
    icon: ['inventory_2'],
    status: [true]
  });

  constructor() {
    const mappedCategory = this.categoryOptions.includes(this.data.facility.category) ? this.data.facility.category : 'Other';
    this.form.patchValue({
      facilityName: this.data.facility.facilityName,
      description: this.data.facility.description ?? '',
      category: mappedCategory,
      customCategory: mappedCategory === 'Other' ? this.data.facility.category : '',
      icon: this.data.facility.icon || 'inventory_2',
      status: this.data.facility.status
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedCategory = (this.form.value.category ?? '').trim();
    const customCategory = (this.form.value.customCategory ?? '').trim();
    const category = selectedCategory === 'Other' ? customCategory || 'General' : selectedCategory || 'General';

    this.dialogRef.close({
      facilityName: (this.form.value.facilityName ?? '').trim(),
      description: (this.form.value.description ?? '').trim(),
      category,
      icon: this.form.value.icon ?? 'inventory_2',
      status: Boolean(this.form.value.status)
    });
  }
}
