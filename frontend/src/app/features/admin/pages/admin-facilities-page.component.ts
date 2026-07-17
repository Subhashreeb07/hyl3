import { CommonModule } from '@angular/common';
import { Component, computed, signal, Inject, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FacilityBuilderStateService, FacilityBuilderRecord } from '../state/facility-builder-state.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog.component';
import { FacilityMobilePreviewDialogComponent } from '../components/facility-mobile-preview-dialog.component';
import { FacilityAdminApiService } from '../../../core/services/facility-admin-api.service';
import { PublishLocationsDialogComponent } from '../components/publish-locations-dialog.component';
import { firstValueFrom } from 'rxjs';
import { SpecificationImportDialogComponent } from '../components/specification-import-dialog.component';
import { SpecificationApiService } from '../../../core/services/specification-api.service';
import { FacilitySpecification } from '../../../core/models/specification.models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminBookingSearchItem } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-facilities-page',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSnackBarModule, MatMenuModule, MatIconModule, MatButtonModule],
  template: `
    <div class="flex flex-col gap-6 h-full">

      <!-- ── Header ── -->
      <section class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Facilities</h2>
          <p class="text-sm text-slate-600">Manage all dynamic employee facilities from a single place.</p>
        </div>
        <div class="flex gap-2">
          <button class="satori-secondary" (click)="goImport()">
            <span class="material-icons-outlined text-[1.1em]">upload_file</span> Import JSON
          </button>
          <button class="satori-primary" (click)="createFacility()">
            <span class="material-icons-outlined text-[1.1em]">add</span> Create Facility
          </button>
        </div>
      </section>

      <!-- ── Facility Templates strip ── -->
      <section>
          <div class="mb-4 flex items-center justify-between border-b border-slate-200 pb-2">
            <div class="flex items-center gap-2 text-slate-800">
              <span class="material-icons-outlined text-brand-600">auto_awesome_mosaic</span>
              <h2 class="text-sm font-semibold uppercase tracking-widest">Facility Templates</h2>
            </div>
            <span class="text-xs text-slate-400 font-medium">Select a template to preview →</span>
          </div>

          <!-- Horizontally scrollable template pills -->
          <div class="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
            <button
              *ngFor="let t of templates()"
              (click)="selectTemplate(t)"
              class="group relative snap-start shrink-0 flex flex-col items-start gap-1.5 rounded-2xl border px-5 py-4 text-left transition-all min-w-[240px]"
              [ngClass]="{
                'border-brand-500 bg-brand-50 shadow-md ring-2 ring-brand-500/20': selectedTemplate()?.id === t.id,
                'border-slate-200 bg-white hover:border-brand-300 hover:shadow-lg': selectedTemplate()?.id !== t.id
              }">
              
              <div class="flex items-center justify-between w-full">
                <span class="text-[10px] font-bold uppercase tracking-wider"
                      [class.text-brand-600]="selectedTemplate()?.id === t.id"
                      [class.text-slate-400]="selectedTemplate()?.id !== t.id">
                  {{ t.category || 'Template' }}
                </span>
                <span class="flex items-center justify-center w-6 h-6 rounded-full"
                      [class.bg-brand-100]="selectedTemplate()?.id === t.id"
                      [class.text-brand-600]="selectedTemplate()?.id === t.id"
                      [class.bg-slate-100]="selectedTemplate()?.id !== t.id"
                      [class.text-slate-400]="selectedTemplate()?.id !== t.id">
                  <mat-icon class="!text-[14px]">auto_awesome</mat-icon>
                </span>
              </div>
              
              <span class="text-base font-bold mt-1"
                    [class.text-brand-900]="selectedTemplate()?.id === t.id"
                    [class.text-slate-800]="selectedTemplate()?.id !== t.id">
                {{ t.facilityName }}
              </span>
              
              <span class="mt-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    [class.bg-emerald-100]="t.isPublic && selectedTemplate()?.id !== t.id"
                    [class.text-emerald-700]="t.isPublic && selectedTemplate()?.id !== t.id"
                    [class.bg-slate-100]="!t.isPublic && selectedTemplate()?.id !== t.id"
                    [class.text-slate-600]="!t.isPublic && selectedTemplate()?.id !== t.id"
                    [class.bg-brand-200]="selectedTemplate()?.id === t.id"
                    [class.text-brand-800]="selectedTemplate()?.id === t.id">
                <span class="material-icons-outlined" style="font-size:12px;line-height:1;">{{ t.isPublic ? 'public' : 'lock' }}</span>
                {{ t.isPublic ? 'Public' : 'Private' }}
              </span>
            </button>
          </div>
        </section>

      <!-- ── Main split area ── -->
      <div class="flex flex-col md:flex-row gap-6 flex-1 min-h-0">

        <!-- LEFT: Regular facilities -->
        <div class="flex flex-col gap-4 flex-1 overflow-y-auto min-w-0">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-widest text-slate-500">
              All Facilities
              <span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {{ regularFacilities().length }}
              </span>
            </h3>
          </div>

          <div class="grid gap-4 md:grid-cols-2 content-start">
            <article *ngFor="let facility of regularFacilities()"
                     class="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-lg cursor-pointer"
                     (click)="viewFacilityBookings(facility)">
              
              <div>
                <div class="flex items-start justify-between">
                  <span class="inline-block rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {{ facility.category || 'Facility' }}
                  </span>
                  
                  <div class="flex items-center gap-2">
                    <span *ngIf="facility.published" class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      <span class="h-2 w-2 rounded-full bg-emerald-500"></span> Published
                    </span>
                    <span *ngIf="!facility.published" class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <span class="h-2 w-2 rounded-full bg-amber-500"></span> Draft
                    </span>
                    
                    <button mat-icon-button [matMenuTriggerFor]="cardMenu" class="!text-slate-400 hover:!text-slate-700 !h-8 !w-8" (click)="$event.stopPropagation()">
                      <mat-icon class="!text-[20px]">more_vert</mat-icon>
                    </button>
                    <mat-menu #cardMenu="matMenu" class="!rounded-xl !py-2">
                      <button *ngIf="!facility.published" mat-menu-item (click)="publishFacility(facility.id)" class="!text-emerald-700">
                        <mat-icon class="!text-emerald-700">rocket_launch</mat-icon>
                        <span>Publish</span>
                      </button>
                      <button mat-menu-item (click)="duplicateFacility(facility.id)">
                        <mat-icon>content_copy</mat-icon>
                        <span>Duplicate</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="deleteFacility(facility.id)" class="!text-rose-600">
                        <mat-icon class="!text-rose-600">delete_outline</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>

                <h3 class="mt-3 text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{{ facility.facilityName }}</h3>
                <p class="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                  {{ facility.description || 'No description added yet.' }}
                </p>
              </div>

              <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span class="text-xs font-medium text-slate-400">Added {{ facility.createdAt | date: 'mediumDate' }}</span>
                <button class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800" (click)="editFacility(facility.id); $event.stopPropagation()">
                  Edit <mat-icon class="!text-[16px]">arrow_forward</mat-icon>
                </button>
              </div>
            </article>

            <!-- Empty state -->
            <div *ngIf="regularFacilities().length === 0"
                 class="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center gap-3">
              <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              <p class="text-slate-400 text-sm">No facilities yet.</p>
              <p class="text-slate-400 text-xs">Create one above or click a template to get started.</p>
            </div>
          </div>
        </div>

        <!-- Modal Overlay: Template detail panel (shown when a template is selected) -->
        <div *ngIf="selectedTemplate()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <!-- Backdrop click to close -->
          <div class="absolute inset-0" (click)="clearTemplate()"></div>
          
          <aside class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh] z-10 border border-slate-200">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-700">
                Template Detail
              </span>
              <button (click)="clearTemplate()"
                      class="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                      title="Close panel">
                ✕
              </button>
            </div>
            
            <!-- Body -->
            <div class="p-6 overflow-y-auto flex flex-col gap-6">
              
              <!-- Name + category -->
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-brand-600">
                  {{ selectedTemplate()!.category || 'General' }}
                </p>
                <h3 class="mt-1 text-2xl font-bold text-slate-900 leading-tight">
                  {{ selectedTemplate()!.facilityName }}
                </h3>
                <p class="mt-2 text-sm text-slate-600">
                  {{ selectedTemplate()!.description || 'No description provided.' }}
                </p>
              </div>
              
              <!-- Stats row -->
              <div class="flex gap-3">
                <div class="flex-1 rounded-lg bg-brand-50 px-3 py-3 text-center border border-brand-100">
                  <p class="text-xl font-bold text-brand-700">{{ selectedTemplate()!.fields?.length || 0 }}</p>
                  <p class="text-[10px] uppercase tracking-wider text-brand-600">Fields</p>
                </div>
                <div class="flex-1 rounded-lg bg-brand-50 px-3 py-3 text-center border border-brand-100">
                  <p class="text-xl font-bold text-brand-700">{{ countRules(selectedTemplate()!) }}</p>
                  <p class="text-[10px] uppercase tracking-wider text-brand-600">Rules</p>
                </div>
                <div class="flex-1 rounded-lg bg-slate-50 px-3 py-3 text-center border border-slate-200">
                  <p class="text-xl font-bold text-slate-700">
                    <span class="material-icons-outlined text-[1.2em]">{{ selectedTemplate()!.isPublic ? 'public' : 'lock' }}</span>
                  </p>
                  <p class="text-[10px] uppercase tracking-wider text-slate-500">
                    {{ selectedTemplate()!.isPublic ? 'Public' : 'Private' }}
                  </p>
                </div>
              </div>
              
              <!-- Visibility toggle -->
              <div class="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <div>
                  <p class="text-sm font-semibold text-slate-700">Admin Visibility</p>
                  <p class="text-xs text-slate-400">
                    {{ selectedTemplate()!.isPublic ? 'Other admins can see this template' : 'Hidden from other admins' }}
                  </p>
                </div>
                <!-- Toggle switch -->
                <button
                  (click)="toggleVisibility(selectedTemplate()!.id, selectedTemplate()!.isPublic)"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  [ngClass]="selectedTemplate()!.isPublic ? 'bg-emerald-500' : 'bg-slate-300'"
                  [title]="selectedTemplate()!.isPublic ? 'Set Private' : 'Set Public'">
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                        [ngClass]="selectedTemplate()!.isPublic ? 'translate-x-6' : 'translate-x-1'">
                  </span>
                </button>
              </div>
            </div>
            
            <!-- Footer actions -->
            <div class="border-t border-slate-100 bg-slate-50 p-6 flex flex-col sm:flex-row gap-3">
              <button class="satori-secondary flex-1" (click)="previewFacility(selectedTemplate()!.id)">
                <span class="material-icons-outlined text-[1.1em]">visibility</span> Preview Form
              </button>
              <button class="satori-secondary flex-1" (click)="duplicateFacility(selectedTemplate()!.id)">
                <span class="material-icons-outlined text-[1.1em]">content_copy</span> Duplicate
              </button>
              <button class="satori-primary flex-1" (click)="useTemplate(selectedTemplate()!.id)">
                <span class="material-icons-outlined text-[1.1em]">add_circle</span> Use Template
              </button>
              <button class="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors" (click)="deleteTemplate(selectedTemplate()!.id)">
                <span class="material-icons-outlined text-[1.1em]">delete_outline</span> Delete
              </button>
            </div>
            
          </aside>
        </div>

      </div>
    </div>
  `
})
export class AdminFacilitiesPageComponent {
  readonly facilities = computed(() => this.state.filteredFacilities());
  readonly templates = computed(() => this.facilities().filter((f) => f.isTemplate));
  readonly regularFacilities = computed(() => this.facilities().filter((f) => !f.isTemplate));
  readonly selectedTemplate = signal<FacilityBuilderRecord | null>(null);

  constructor(
    private readonly state: FacilityBuilderStateService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly facilityAdminApi: FacilityAdminApiService,
    private readonly specificationApi: SpecificationApiService
  ) {
    this.refreshFromBackend();
  }

  selectTemplate(t: FacilityBuilderRecord): void {
    // Toggle: clicking the same template again closes the panel
    this.selectedTemplate.set(this.selectedTemplate()?.id === t.id ? null : t);
  }

  clearTemplate(): void {
    this.selectedTemplate.set(null);
  }

  /** Count non-empty rule values on a record */
  countRules(record: FacilityBuilderRecord): number {
    if (!record?.rules) return 0;
    return Object.values(record.rules).filter(
      (v) => v !== null && v !== undefined && v !== ''
    ).length;
  }

  createFacility(): void {
    // No editMode state → Form Builder opens a blank new draft.
    this.router.navigateByUrl('/admin/form-builder');
  }

  async goImport(): Promise<void> {
    const json = await firstValueFrom(
      this.dialog
        .open(SpecificationImportDialogComponent, {
          width: '760px',
          maxWidth: '95vw'
        })
        .afterClosed()
    );

    if (!json) {
      return;
    }

    try {
      const parsed = JSON.parse(json) as FacilitySpecification;
      if (!parsed.facilityName?.trim()) throw new Error('facilityName is required');
      if (!Array.isArray(parsed.fields)) throw new Error('fields must be an array');
      parsed.fields.forEach((field, index) => {
        if (!field.label?.trim()) throw new Error(`Field ${index + 1} label is required`);
        if (!field.fieldType) throw new Error(`Field ${index + 1} fieldType is required`);
      });

      const uploaded = await firstValueFrom(this.specificationApi.uploadSpecification(parsed));
      await this.refreshFromBackend();
      this.snackBar.open('Facility created successfully from JSON', 'OK', { duration: 3000 });
      
      this.state.setActiveFacility(uploaded.facilityId);
      this.router.navigate(['/admin/form-builder'], { state: { editMode: true } });
    } catch (error: any) {
      this.snackBar.open(error?.error?.message ?? error?.message ?? 'Invalid specification JSON', 'Close', { duration: 5000 });
    }
  }

  viewFacilityBookings(facility: FacilityBuilderRecord): void {
    if (!facility.published) {
      this.snackBar.open('Only published facilities have bookings.', 'Close', { duration: 3000 });
      return;
    }
    this.router.navigate(['/admin/facilities', facility.id, 'bookings'], {
      state: { facilityName: facility.facilityName }
    });
  }

  editFacility(id: number): void {
    const facility = this.state.facilities().find((f) => f.id === id);
    if (facility?.isTemplate) {
      // Templates are immutable — create a working copy instead of editing in-place.
      this.useTemplate(id);
      return;
    }
    this.state.setActiveFacility(id);
    this.router.navigate(['/admin/form-builder'], { state: { editMode: true } });
  }

  previewFacility(id: number): void {
    const facility = this.state.facilities().find(f => f.id === id);
    if (!facility) return;
    this.dialog.open(FacilityMobilePreviewDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      panelClass: 'preview-dialog-panel',
      data: { facility }
    });
  }

  async useTemplate(templateId: number): Promise<void> {
    try {
      const record = await this.state.createFromTemplate(templateId);
      this.snackBar.open(`"${record.facilityName}" created — all fields pre-filled. Edit and publish.`, 'OK', { duration: 4000 });
      // Pass editMode so Form Builder loads the newly created copy, not a blank draft.
      this.router.navigate(['/admin/form-builder'], { state: { editMode: true } });
    } catch (err: any) {
      this.snackBar.open(err?.error?.message ?? 'Failed to create from template', 'Close', { duration: 3500 });
    }
  }

  toggleVisibility(facilityId: number, currentlyPublic: boolean): void {
    const newValue = !currentlyPublic;
    this.facilityAdminApi.updateTemplateVisibility(facilityId, newValue).subscribe({
      next: () => {
        this.state.facilities.update((items) =>
          items.map((f) => (f.id === facilityId ? { ...f, isPublic: newValue } : f))
        );
        // Refresh the selected template panel if it's the toggled one
        if (this.selectedTemplate()?.id === facilityId) {
          const updated = this.state.facilities().find((f) => f.id === facilityId);
          if (updated) this.selectedTemplate.set(updated);
        }
        this.snackBar.open(`Template set to ${newValue ? 'Public' : 'Private'}`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Visibility update failed', 'Close', { duration: 3000 });
      }
    });
  }

  async publishFacility(id: number): Promise<void> {
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

    this.facilityAdminApi.publishFacility(id, {
      targetLocations: publishConfig.targetLocations,
      targetEmployeeIds: publishConfig.targetEmployeeIds ?? []
    }).subscribe({
      next: () => {
        this.state.publishFacility(id);
        this.snackBar.open('Facility published', 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Publish failed', 'Close', { duration: 3000 });
      }
    });
  }

  duplicateFacility(id: number): void {
    this.state.duplicateFacility(id);
  }

  deleteTemplate(id: number): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Template',
          message: 'Are you sure you want to delete this template? This cannot be undone.',
          confirmText: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.facilityAdminApi.deleteFacility(id).subscribe({
            next: () => {
              this.state.deleteFacility(id);
              this.clearTemplate();
              this.snackBar.open('Template deleted', 'OK', { duration: 2000 });
            },
            error: (err) => {
              this.snackBar.open(err?.error?.message ?? 'Delete failed', 'Close', { duration: 3000 });
            }
          });
        }
      });
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
            next: () => {
              this.state.deleteFacility(id);
              this.snackBar.open('Facility deleted', 'OK', { duration: 2000 });
            },
            error: (err) => {
              this.snackBar.open(err?.error?.message ?? 'Delete failed', 'Close', { duration: 3000 });
            }
          });
        }
      });
  }

  private async refreshFromBackend(): Promise<void> {
    try {
      await this.state.loadFromBackend();
    } catch (error: any) {
      this.snackBar.open(error?.error?.message ?? 'Failed to load facilities from backend', 'Close', { duration: 3500 });
    }
  }
}

@Component({
  selector: 'app-facility-bookings-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="flex flex-col h-full max-h-[80vh]">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ data.facilityName }} Bookings</h2>
          <p class="text-xs text-slate-500">All bookings for this facility</p>
        </div>
        <button mat-icon-button mat-dialog-close class="!text-slate-400 hover:!text-slate-700">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        <div *ngIf="loading" class="flex justify-center py-10">
          <mat-icon class="animate-spin text-slate-400">refresh</mat-icon>
        </div>
        
        <div *ngIf="!loading && bookings.length === 0" class="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-white">
          <mat-icon class="!text-[40px] !h-10 !w-10 text-slate-300 mb-2">event_busy</mat-icon>
          <p class="text-slate-700 font-semibold text-sm">No bookings found</p>
          <p class="text-slate-500 text-xs">There are no bookings for this facility yet.</p>
        </div>
        
        <div *ngIf="!loading && bookings.length > 0" class="space-y-3">
          <div *ngFor="let b of bookings" class="rounded-xl border border-slate-200 bg-white p-4 flex justify-between items-center shadow-sm hover:border-brand-200 transition-colors">
            <div class="flex items-center gap-4">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <mat-icon class="!text-[20px]">person</mat-icon>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ b.employeeId }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <mat-icon class="!text-[12px] text-slate-400">calendar_today</mat-icon>
                  <p class="text-[11px] text-slate-500 font-medium">{{ b.bookingDate | date:'mediumDate' }}</p>
                  <span class="text-slate-300">·</span>
                  <p class="text-[10px] text-slate-400">Created: {{ b.createdAt | date:'shortTime' }}</p>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <span class="rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border"
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border-emerald-200': b.status === 'CONFIRMED',
                      'bg-rose-50 text-rose-700 border-rose-200': b.status === 'CANCELLED',
                      'bg-amber-50 text-amber-700 border-amber-200': b.status === 'PENDING'
                    }">
                {{ b.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FacilityBookingsDialogComponent implements OnInit {
  bookings: AdminBookingSearchItem[] = [];
  loading = true;

  public data = inject<{ facilityId: number, facilityName: string }>(MAT_DIALOG_DATA);
  private adminApi = inject(AdminApiService);

  constructor() {}

  ngOnInit() {
    this.adminApi.searchBookings({ facilityId: this.data.facilityId }).subscribe({
      next: (res) => {
        this.bookings = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
