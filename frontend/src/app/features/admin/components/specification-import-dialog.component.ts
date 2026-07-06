import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface SpecificationImportDialogData {
  initialJson?: string;
}

@Component({
  selector: 'app-specification-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title class="!text-lg !font-semibold">Import Specification JSON</h2>

    <mat-dialog-content class="!pt-2">
      <p class="mb-3 text-sm text-slate-600">Paste JSON directly or upload a JSON file.</p>

      <form [formGroup]="form" class="grid gap-3">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Specification JSON</mat-label>
          <textarea matInput rows="14" formControlName="jsonText" placeholder="Paste full facility specification JSON"></textarea>
        </mat-form-field>
      </form>

      <div class="flex flex-wrap items-center gap-2">
        <label class="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <input type="file" accept="application/json,.json" class="hidden" (change)="onFileSelected($event)" />
          Upload JSON File
        </label>
        <span class="text-xs text-slate-500" *ngIf="fileName()">{{ fileName() }}</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="importJson()" [disabled]="form.invalid">Import</button>
    </mat-dialog-actions>
  `
})
export class SpecificationImportDialogComponent {
  readonly data = inject<SpecificationImportDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<SpecificationImportDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly fileName = signal<string>('');

  readonly form = this.fb.group({
    jsonText: [this.data?.initialJson ?? '', Validators.required]
  });

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.fileName.set(file.name);
    const text = await file.text();
    this.form.patchValue({ jsonText: text });
  }

  importJson(): void {
    const jsonText = (this.form.value.jsonText ?? '').trim();
    if (!jsonText) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(jsonText);
  }
}
