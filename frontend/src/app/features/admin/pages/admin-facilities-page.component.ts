import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FacilityBuilderStateService } from '../state/facility-builder-state.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog.component';
import { FacilityAdminApiService } from '../../../core/services/facility-admin-api.service';
import { PublishLocationsDialogComponent } from '../components/publish-locations-dialog.component';
import { firstValueFrom } from 'rxjs';
import { FacilityMobilePreviewDialogComponent } from '../components/facility-mobile-preview-dialog.component';

@Component({
  selector: 'app-admin-facilities-page',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="space-y-6">
      <section class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Facilities</h2>
          <p class="text-sm text-slate-600">Manage all dynamic employee facilities from a single place.</p>
        </div>
        <div class="flex gap-2">
          <button class="satori-secondary" (click)="goImport()">Import JSON</button>
          <button class="satori-primary" (click)="createFacility()">Create Facility</button>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ng-container *ngIf="!loading()">
          <article *ngFor="let facility of facilities()" class="satori-card">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.12em] text-slate-500">{{ facility.category }}</p>
              <h3 class="mt-1 text-xl font-semibold text-slate-900">{{ facility.facilityName }}</h3>
              <p class="mt-1 text-xs text-slate-500">Created {{ facility.createdAt | date: 'mediumDate' }}</p>
            </div>
            <div class="rounded-full px-2 py-1 text-xs font-semibold" [ngClass]="facility.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
              {{ facility.published ? 'Published' : 'Draft' }}
            </div>
          </div>

          <p class="mt-3 text-sm text-slate-600 line-clamp-2">{{ facility.description || 'No description added yet.' }}</p>

          <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
            <button class="satori-secondary" (click)="editFacility(facility.id)">Edit</button>
            <button class="satori-secondary" (click)="previewFacility(facility.id)">Preview</button>
            <button
              class="satori-secondary"
              [disabled]="isPublishing(facility.id)"
              (click)="publishFacility(facility.id)"
            >
              {{ isPublishing(facility.id) ? 'Publishing...' : (facility.published ? 'Republish' : 'Publish') }}
            </button>
            <button class="satori-secondary" (click)="duplicateFacility(facility.id)">Duplicate</button>
            <button class="satori-danger col-span-2" (click)="deleteFacility(facility.id)">Delete</button>
          </div>
        </article>
        </ng-container>

        <ng-container *ngIf="!loading() && facilities().length === 0">
          <div class="col-span-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p class="text-sm text-slate-600">No facilities created yet.</p>
            <p class="mt-1 text-xs text-slate-500">Create a new facility or import one using JSON to get started.</p>
          </div>
        </ng-container>

        <ng-container *ngIf="loading()">
          <div class="col-span-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p class="text-sm text-slate-600">Loading facilities...</p>
          </div>
        </ng-container>
      </section>
    </div>
  `
})
export class AdminFacilitiesPageComponent {
  readonly facilities = computed(() => this.state.filteredFacilities());
  readonly publishingFacilityIds = signal<number[]>([]);
  readonly loading = signal(false);

  constructor(
    private readonly state: FacilityBuilderStateService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly facilityAdminApi: FacilityAdminApiService
  ) {
    this.refreshFromBackend();
  }

  createFacility(): void {
    this.router.navigate(['/admin/form-builder'], { queryParams: { mode: 'create' } });
  }

  goImport(): void {
    this.router.navigate(['/admin/form-builder'], { queryParams: { mode: 'import' } });
  }

  editFacility(id: number): void {
    this.state.setActiveFacility(id);
    this.router.navigate(['/admin/form-builder'], { queryParams: { mode: 'edit', facilityId: id } });
  }

  previewFacility(id: number): void {
    const facility = this.state.facilities().find((item) => item.id === id);
    if (!facility) {
      this.snackBar.open('Facility not found', 'Close', { duration: 2600 });
      return;
    }

    this.dialog.open(FacilityMobilePreviewDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      data: { facility }
    });
  }

  async publishFacility(id: number): Promise<void> {
    const facility = this.state.facilities().find((item) => item.id === id);
    const publishConfig = await firstValueFrom(
      this.dialog
        .open(PublishLocationsDialogComponent, {
          width: '420px',
          maxWidth: '95vw'
        })
        .afterClosed()
    );

    if (!publishConfig?.targetLocations?.length) {
      return;
    }

    this.publishingFacilityIds.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
    this.facilityAdminApi.publishFacility(id, { targetLocations: publishConfig.targetLocations }).subscribe({
      next: () => {
        this.state.publishFacility(id);
        this.snackBar.open('Facility published', 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Publish failed', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.publishingFacilityIds.update((ids) => ids.filter((existingId) => existingId !== id));
      }
    });
  }

  isPublishing(facilityId: number): boolean {
    return this.publishingFacilityIds().includes(facilityId);
  }

  duplicateFacility(id: number): void {
    this.state.duplicateFacility(id);
  }

  deleteFacility(id: number): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Facility',
          message: 'Are you sure you want to delete this facility? This action cannot be undone.',
          confirmText: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.facilityAdminApi.deleteFacility(id).subscribe({
            next: async () => {
              this.state.deleteFacility(id);
              await this.refreshFromBackend();
              this.snackBar.open('Facility deleted', 'OK', { duration: 2000 });
            },
            error: async (err) => {
              const status = Number(err?.status ?? 0);

              // Allow deleting local draft records that are not yet persisted to backend.
              if (status === 404) {
                this.state.deleteFacility(id);
                this.snackBar.open('Local draft deleted', 'OK', { duration: 2200 });
                return;
              }

              await this.refreshFromBackend();
              this.snackBar.open(err?.error?.message ?? 'Delete failed', 'Close', { duration: 3200 });
            }
          });
        }
      });
  }

  private async refreshFromBackend(): Promise<void> {
    this.loading.set(true);
    try {
      await this.state.loadFromBackend();
    } catch (error: any) {
      this.snackBar.open(error?.error?.message ?? 'Failed to load facilities from backend', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }
}
