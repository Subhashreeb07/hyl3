import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BuilderLivePreviewComponent } from './builder-live-preview.component';
import { FacilityBuilderRecord } from '../state/facility-builder-state.service';

export interface FacilityMobilePreviewDialogData {
  facility: FacilityBuilderRecord;
}

@Component({
  selector: 'app-facility-mobile-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, BuilderLivePreviewComponent],
  template: `
    <h2 mat-dialog-title>Employee Mobile Preview</h2>

    <mat-dialog-content class="max-h-[78vh] overflow-auto">
      <p class="mb-3 text-sm text-slate-600">
        This is how the selected facility form appears to employees on mobile.
      </p>

      <app-builder-live-preview
        [facilityName]="data.facility.facilityName"
        [fields]="orderedFields()"
      />
    </mat-dialog-content>
  `
})
export class FacilityMobilePreviewDialogComponent {
  readonly data = inject<FacilityMobilePreviewDialogData>(MAT_DIALOG_DATA);

  readonly orderedFields = computed(() =>
    [...(this.data.facility.fields ?? [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  );
}
