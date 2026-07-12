import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FacilityBuilderStateService, FacilityBuilderRecord } from '../state/facility-builder-state.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog.component';
import { FacilityAdminApiService } from '../../../core/services/facility-admin-api.service';
import { PublishLocationsDialogComponent } from '../components/publish-locations-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-facilities-page',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="flex flex-col gap-6 h-full">

      <!-- ── Header ── -->
      <section class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Facilities</h2>
          <p class="text-sm text-slate-600">Manage all dynamic employee facilities from a single place.</p>
        </div>
        <div class="flex gap-2">
          <button class="satori-secondary" (click)="goImport()">Import JSON</button>
          <button class="satori-primary" (click)="createFacility()">+ Create Facility</button>
        </div>
      </section>

      <!-- ── Templates strip ── -->
      <ng-container *ngIf="templates().length > 0">
        <section>
          <div class="mb-3 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
              ⬡ Templates
            </span>
            <span class="text-xs text-slate-400">Click a template to preview details →</span>
          </div>

          <!-- Horizontally scrollable template pills -->
          <div class="flex gap-3 overflow-x-auto pb-2 snap-x">
            <button
<<<<<<< HEAD
              class="satori-secondary"
              [disabled]="isPublishing(facility.id)"
              (click)="publishFacility(facility.id)"
            >
              {{ isPublishing(facility.id) ? 'Publishing...' : (facility.published ? 'Republish' : 'Publish') }}
=======
              *ngFor="let t of templates()"
              (click)="selectTemplate(t)"
              [class.ring-2]="selectedTemplate()?.id === t.id"
              [class.ring-indigo-500]="selectedTemplate()?.id === t.id"
              [class.bg-indigo-600]="selectedTemplate()?.id === t.id"
              [class.text-white]="selectedTemplate()?.id === t.id"
              [class.bg-white]="selectedTemplate()?.id !== t.id"
              [class.text-slate-700]="selectedTemplate()?.id !== t.id"
              class="snap-start shrink-0 flex flex-col items-start gap-1 rounded-xl border border-indigo-200 px-4 py-3 text-left shadow-sm transition-all hover:border-indigo-400 hover:shadow-md min-w-[180px]">
              <span class="text-[10px] font-bold uppercase tracking-widest opacity-60">{{ t.category || 'Template' }}</span>
              <span class="text-sm font-semibold leading-tight">{{ t.facilityName }}</span>
              <span class="mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    [class.bg-emerald-200]="t.isPublic && selectedTemplate()?.id === t.id"
                    [class.text-emerald-800]="t.isPublic && selectedTemplate()?.id === t.id"
                    [class.bg-white]="t.isPublic && selectedTemplate()?.id !== t.id"
                    [class.text-emerald-700]="t.isPublic && selectedTemplate()?.id !== t.id"
                    [class.bg-slate-200]="!t.isPublic && selectedTemplate()?.id !== t.id"
                    [class.text-slate-500]="!t.isPublic && selectedTemplate()?.id !== t.id"
                    [class.bg-indigo-500]="!t.isPublic && selectedTemplate()?.id === t.id"
                    [class.text-indigo-100]="!t.isPublic && selectedTemplate()?.id === t.id">
                {{ t.isPublic ? '🌐 Public' : '🔒 Private' }}
              </span>
>>>>>>> facility-project/main
            </button>
          </div>
        </section>
      </ng-container>

      <!-- ── Main split area ── -->
      <div class="flex gap-6 flex-1 min-h-0">

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
                     class="satori-card hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-xs uppercase tracking-[0.12em] text-slate-500">{{ facility.category }}</p>
                  <h3 class="mt-1 text-lg font-semibold text-slate-900">{{ facility.facilityName }}</h3>
                  <p class="mt-0.5 text-xs text-slate-400">Created {{ facility.createdAt | date: 'mediumDate' }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      [ngClass]="facility.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                  {{ facility.published ? '✓ Published' : '◎ Draft' }}
                </span>
              </div>

              <p class="mt-2 text-sm text-slate-600 line-clamp-2">
                {{ facility.description || 'No description added yet.' }}
              </p>

              <!-- Action buttons -->
              <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
                <button class="satori-secondary" (click)="editFacility(facility.id)">✏ Edit</button>
                <button class="satori-secondary" (click)="previewFacility(facility.id)">👁 Preview</button>
                <button class="satori-secondary" (click)="publishFacility(facility.id)">🚀 Publish</button>
                <button class="satori-secondary" (click)="duplicateFacility(facility.id)">⧉ Duplicate</button>
                <button class="satori-danger col-span-2" (click)="deleteFacility(facility.id)">🗑 Delete</button>
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

        <!-- RIGHT: Template detail panel (shown when a template is selected) -->
        <aside *ngIf="selectedTemplate()"
               class="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto">

          <!-- Panel header -->
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
              Template Detail
            </span>
            <button (click)="clearTemplate()"
                    class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Close panel">
              ✕
            </button>
          </div>

          <!-- Template card -->
          <div class="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm flex flex-col gap-4">

            <!-- Name + category -->
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-indigo-400">
                {{ selectedTemplate()!.category || 'General' }}
              </p>
              <h3 class="mt-1 text-xl font-bold text-slate-900 leading-tight">
                {{ selectedTemplate()!.facilityName }}
              </h3>
              <p class="mt-2 text-sm text-slate-600">
                {{ selectedTemplate()!.description || 'No description provided.' }}
              </p>
            </div>

            <!-- Stats row -->
            <div class="flex gap-3">
              <div class="flex-1 rounded-lg bg-indigo-100/70 px-3 py-2 text-center">
                <p class="text-lg font-bold text-indigo-700">{{ selectedTemplate()!.fields?.length || 0 }}</p>
                <p class="text-[10px] uppercase tracking-wider text-indigo-500">Fields</p>
              </div>
              <div class="flex-1 rounded-lg bg-indigo-100/70 px-3 py-2 text-center">
                <p class="text-lg font-bold text-indigo-700">{{ countRules(selectedTemplate()!) }}</p>
                <p class="text-[10px] uppercase tracking-wider text-indigo-500">Rules</p>
              </div>
              <div class="flex-1 rounded-lg bg-indigo-100/70 px-3 py-2 text-center">
                <p class="text-lg font-bold text-indigo-700">
                  {{ selectedTemplate()!.isPublic ? '🌐' : '🔒' }}
                </p>
                <p class="text-[10px] uppercase tracking-wider text-indigo-500">
                  {{ selectedTemplate()!.isPublic ? 'Public' : 'Private' }}
                </p>
              </div>
            </div>

            <!-- Visibility toggle -->
            <div class="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <div>
                <p class="text-sm font-semibold text-slate-700">Visibility</p>
                <p class="text-xs text-slate-400">
                  {{ selectedTemplate()!.isPublic ? 'Employees can see this template' : 'Hidden from employees' }}
                </p>
              </div>
              <!-- Toggle switch -->
              <button
                (click)="toggleVisibility(selectedTemplate()!.id, selectedTemplate()!.isPublic)"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                [ngClass]="selectedTemplate()!.isPublic ? 'bg-emerald-500' : 'bg-slate-300'"
                [title]="selectedTemplate()!.isPublic ? 'Set Private' : 'Set Public'">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                      [ngClass]="selectedTemplate()!.isPublic ? 'translate-x-6' : 'translate-x-1'">
                </span>
              </button>
            </div>

            <!-- What gets pre-filled notice -->
            <div class="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p class="text-xs font-semibold text-amber-700 mb-1">What happens when you use this template?</p>
              <ul class="text-xs text-amber-600 space-y-1">
                <li>✓ All {{ selectedTemplate()!.fields?.length || 0 }} fields are pre-created</li>
                <li>✓ All rules are pre-configured</li>
                <li>✓ You can edit any field before publishing</li>
                <li>✓ Original template stays unchanged</li>
              </ul>
            </div>

            <!-- Action buttons -->
            <button
              (click)="useTemplate(selectedTemplate()!.id)"
              class="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all">
              ✨ Create from this Template
            </button>

            <button
              (click)="useTemplate(selectedTemplate()!.id)"
              class="w-full rounded-xl border-2 border-indigo-300 bg-white py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors">
              ✏ Edit a Copy
            </button>

          </div>
        </aside>

        <!-- RIGHT: empty state when no template selected but templates exist -->
        <aside *ngIf="!selectedTemplate() && templates().length > 0"
               class="w-72 shrink-0 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-8 text-center gap-3">
          <div class="rounded-full bg-indigo-100 p-4">
            <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-indigo-600">Select a template</p>
          <p class="text-xs text-slate-400 leading-relaxed">
            Click any template above to see its details, toggle visibility, and create a facility from it.
          </p>
        </aside>

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
    private readonly facilityAdminApi: FacilityAdminApiService
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

  goImport(): void {
    // No editMode state → Form Builder opens a blank new draft.
    this.router.navigateByUrl('/admin/form-builder');
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
    this.state.setActiveFacility(id);
    this.router.navigate(['/admin/form-builder'], { state: { editMode: true } });
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
        this.snackBar.open(`Template set to ${newValue ? 'Public 🌐' : 'Private 🔒'}`, 'OK', { duration: 2000 });
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

    this.facilityAdminApi.publishFacility(id, { targetLocations: publishConfig.targetLocations }).subscribe({
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
