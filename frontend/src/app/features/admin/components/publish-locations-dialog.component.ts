import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LocationApiService, LocationResponse } from '../../../core/services/location-api.service';

export interface PublishLocationsDialogResult {
  targetLocations: string[];
}

@Component({
  selector: 'app-publish-locations-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Select Office Locations</h2>
    <mat-dialog-content class="space-y-3" style="min-width:320px">
      <p class="text-sm text-slate-600">
        Employees from selected locations will see this published facility.
      </p>

      <!-- Loading -->
      <div *ngIf="loading()" class="py-4 text-center text-sm text-slate-500">
        Loading locations…
      </div>

      <!-- Location checkboxes -->
      <div *ngIf="!loading()" class="space-y-2">
        <label
          *ngFor="let loc of locations()"
          class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 cursor-pointer hover:bg-slate-50 transition"
          [class.border-indigo-400]="isSelected(loc.locationName)"
          [class.bg-indigo-50]="isSelected(loc.locationName)"
        >
          <input
            type="checkbox"
            [checked]="isSelected(loc.locationName)"
            (change)="toggle(loc.locationName)"
            class="accent-indigo-600 h-4 w-4"
          />
          {{ loc.locationName | titlecase }}
        </label>

        <p *ngIf="locations().length === 0" class="text-sm text-slate-400 italic">
          No locations configured. Add locations from the dashboard first.
        </p>
      </div>

      <p *ngIf="showError" class="text-xs text-rose-600 mt-1">Select at least one location.</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button
        mat-flat-button color="primary"
        type="button"
        [disabled]="loading() || locations().length === 0"
        (click)="submit()"
      >Publish</button>
    </mat-dialog-actions>
  `
})
export class PublishLocationsDialogComponent implements OnInit {
  readonly locations = signal<LocationResponse[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<Set<string>>(new Set());
  showError = false;

  constructor(
    private readonly locationApi: LocationApiService,
    readonly dialogRef: MatDialogRef<PublishLocationsDialogComponent, PublishLocationsDialogResult>
  ) {}

  ngOnInit(): void {
    this.locationApi.getLocations().subscribe({
      next: (locs) => {
        this.locations.set(locs);
        // Pre-select all by default
        this.selected.set(new Set(locs.map(l => l.locationName.toUpperCase())));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  isSelected(name: string): boolean {
    return this.selected().has(name.toUpperCase());
  }

  toggle(name: string): void {
    const key = name.toUpperCase();
    const next = new Set(this.selected());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.selected.set(next);
    this.showError = false;
  }

  submit(): void {
    const locations = [...this.selected()];
    if (locations.length === 0) {
      this.showError = true;
      return;
    }
    this.dialogRef.close({ targetLocations: locations });
  }
}

