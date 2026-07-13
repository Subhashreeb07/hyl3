import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BuilderLivePreviewComponent } from './builder-live-preview.component';
import { FacilityBuilderRecord } from '../state/facility-builder-state.service';

export interface FacilityMobilePreviewDialogData {
  facility: FacilityBuilderRecord;
}

@Component({
  selector: 'app-facility-mobile-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, BuilderLivePreviewComponent],
  template: `
    <div class="flex flex-col" style="max-height:90vh;min-width:360px;">

      <!-- ── Header ── -->
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e4d8c 100%);padding:20px 24px 16px;flex-shrink:0;">
        <div class="flex items-start justify-between">
          <div>
            <p style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(148,163,184,1);margin:0 0 4px;">
              {{ data.facility.category || 'General' }}
            </p>
            <h2 style="font-size:18px;font-weight:800;color:#fff;margin:0;line-height:1.25;">
              {{ data.facility.facilityName }}
            </h2>
            <p *ngIf="data.facility.description" style="font-size:12px;color:rgba(148,163,184,0.85);margin:4px 0 0;line-height:1.4;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              {{ data.facility.description }}
            </p>
          </div>
          <button (click)="dialogRef.close()"
                  style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(148,163,184,1);flex-shrink:0;margin-top:2px;"
                  onmouseover="this.style.background='rgba(255,255,255,0.16)'"
                  onmouseout="this.style.background='rgba(255,255,255,0.08)'">
            <mat-icon style="font-size:16px;width:16px;height:16px;">close</mat-icon>
          </button>
        </div>

        <!-- Stat pills -->
        <div class="flex items-center gap-2 mt-3 flex-wrap">
          <span style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700;color:#e2e8f0;letter-spacing:0.04em;">
            <mat-icon style="font-size:10px;width:10px;height:10px;vertical-align:middle;margin-right:4px;">view_list</mat-icon>
            {{ orderedFields().length }} field{{ orderedFields().length !== 1 ? 's' : '' }}
          </span>
          <span style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700;color:#e2e8f0;letter-spacing:0.04em;">
            <mat-icon style="font-size:10px;width:10px;height:10px;vertical-align:middle;margin-right:4px;">smartphone</mat-icon>
            Mobile Preview
          </span>
          <span *ngIf="requiredCount() > 0" style="background:rgba(248,113,113,0.15);border:1px solid rgba(248,113,113,0.3);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700;color:#fca5a5;letter-spacing:0.04em;">
            {{ requiredCount() }} required
          </span>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="overflow-y-auto flex justify-center" style="padding:24px 24px 16px;background:#f8fafc;flex:1;">
        <app-builder-live-preview
          [facilityName]="data.facility.facilityName"
          [fields]="orderedFields()"
        />
      </div>

      <!-- ── Footer note ── -->
      <div style="background:#f1f5f9;border-top:1px solid #e2e8f0;padding:10px 24px;flex-shrink:0;display:flex;align-items:center;gap:6px;">
        <mat-icon style="font-size:14px;width:14px;height:14px;color:#94a3b8;">info_outline</mat-icon>
        <p style="font-size:11px;color:#94a3b8;margin:0;">This is how employees see the form on their phones.</p>
      </div>
    </div>
  `
})
export class FacilityMobilePreviewDialogComponent {
  readonly data = inject<FacilityMobilePreviewDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<FacilityMobilePreviewDialogComponent>);

  readonly orderedFields = computed(() =>
    [...(this.data.facility.fields ?? [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  );

  readonly requiredCount = computed(() =>
    this.orderedFields().filter(f => f.required).length
  );
}

