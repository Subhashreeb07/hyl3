import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { BuilderFieldListComponent } from '../components/builder-field-list.component';
import { BuilderLivePreviewComponent } from '../components/builder-live-preview.component';
import { BuilderPublishPanelComponent } from '../components/builder-publish-panel.component';
import { BuilderPreviewStepComponent } from '../components/builder-preview-step.component';
import { BuilderRulesFormComponent } from '../components/builder-rules-form.component';
import { FieldConfigDialogComponent } from '../components/field-config-dialog.component';
import { PublishLocationsDialogComponent } from '../components/publish-locations-dialog.component';
import { SpecificationImportDialogComponent } from '../components/specification-import-dialog.component';
import { FacilityBuilderRecord, FacilityBuilderStateService } from '../state/facility-builder-state.service';
import { FacilityField, FacilitySpecification } from '../../../core/models/specification.models';
import { FacilityAdminApiService } from '../../../core/services/facility-admin-api.service';
import { SpecificationApiService } from '../../../core/services/specification-api.service';

@Component({
  selector: 'app-admin-form-builder-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatStepperModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    BuilderFieldListComponent,
    BuilderLivePreviewComponent,
    BuilderRulesFormComponent,
    BuilderPublishPanelComponent,
    BuilderPreviewStepComponent
  ],
  template: `
    <div class="space-y-6">
      <mat-stepper [linear]="true" class="rounded-2xl bg-white p-4 shadow-sm">
        <mat-step [stepControl]="basicForm" label="Basic Information">
          <form [formGroup]="basicForm" class="grid gap-4 py-4 md:grid-cols-2 pb-48">
            <label class="admin-field">
              Facility Name
              <input type="text" formControlName="facilityName" [class.border-red-500]="basicForm.get('facilityName')?.touched && basicForm.get('facilityName')?.hasError('required')" />
              <span *ngIf="basicForm.get('facilityName')?.touched && basicForm.get('facilityName')?.hasError('required')" class="text-red-500 text-xs font-normal">Facility Name is required.</span>
            </label>

            <!-- Custom category dropdown -->
            <div class="admin-field">
              Type
              <div class="flex gap-3 mt-1 mb-2">
                <label class="flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer transition-all hover:bg-slate-50"
                       [class.border-brand-600]="basicForm.value.type === 'Service'"
                       [class.bg-brand-50]="basicForm.value.type === 'Service'"
                       [class.text-brand-700]="basicForm.value.type === 'Service'"
                       [class.border-slate-200]="basicForm.value.type !== 'Service'">
                  <input type="radio" formControlName="type" value="Service" class="sr-only" />
                  <mat-icon class="!text-[20px] shrink-0 text-brand-600" *ngIf="basicForm.value.type === 'Service'">check_circle</mat-icon>
                  <mat-icon class="!text-[20px] shrink-0 text-slate-400" *ngIf="basicForm.value.type !== 'Service'">radio_button_unchecked</mat-icon>
                  <span class="font-semibold text-sm">Service / Facility</span>
                </label>
                <label class="flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer transition-all hover:bg-slate-50"
                       [class.border-brand-600]="basicForm.value.type === 'Event'"
                       [class.bg-brand-50]="basicForm.value.type === 'Event'"
                       [class.text-brand-700]="basicForm.value.type === 'Event'"
                       [class.border-slate-200]="basicForm.value.type !== 'Event'">
                  <input type="radio" formControlName="type" value="Event" class="sr-only" />
                  <mat-icon class="!text-[20px] shrink-0 text-brand-600" *ngIf="basicForm.value.type === 'Event'">check_circle</mat-icon>
                  <mat-icon class="!text-[20px] shrink-0 text-slate-400" *ngIf="basicForm.value.type !== 'Event'">radio_button_unchecked</mat-icon>
                  <span class="font-semibold text-sm">Event / Gathering</span>
                </label>
              </div>
            </div>

            <div class="admin-field">
              Category
              <div *ngIf="showCategoryDropdown()" class="fixed inset-0 z-40" (click)="showCategoryDropdown.set(false); showAddCategoryInput.set(false)"></div>
              <div class="relative z-50">
                <button type="button"
                  (click)="showCategoryDropdown.set(!showCategoryDropdown()); basicForm.get('category')?.markAsTouched()"
                  class="w-full flex items-center justify-between rounded-xl border bg-slate-50 hover:bg-white px-3.5 py-3 text-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  [class.border-brand-500]="showCategoryDropdown() && !(basicForm.get('category')?.touched && basicForm.get('category')?.invalid)"
                  [class.bg-white]="showCategoryDropdown()"
                  [class.border-slate-200]="!showCategoryDropdown() && !(basicForm.get('category')?.touched && basicForm.get('category')?.invalid)"
                  [class.border-red-500]="basicForm.get('category')?.touched && basicForm.get('category')?.invalid">
                  <span [class.text-slate-400]="!basicForm.value.category">
                    {{ basicForm.value.category || 'Select category...' }}
                  </span>
                  <span class="material-icons-outlined text-slate-400" style="font-size:18px">
                    {{ showCategoryDropdown() ? 'expand_less' : 'expand_more' }}
                  </span>
                </button>
                <div *ngIf="showCategoryDropdown()"
                     class="absolute top-full left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  <div class="max-h-44 overflow-y-auto">
                    <button type="button" *ngFor="let cat of categoryOptions()"
                      (click)="selectCategory(cat)"
                      class="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors"
                      [class.bg-indigo-50]="basicForm.value.category === cat"
                      [class.text-indigo-700]="basicForm.value.category === cat"
                      [class.font-semibold]="basicForm.value.category === cat">
                      {{ cat }}
                    </button>
                  </div>
                  <div class="border-t border-slate-100 px-3 py-2">
                    <ng-container *ngIf="!showAddCategoryInput()">
                      <button type="button" (click)="showAddCategoryInput.set(true)"
                        class="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <span class="material-icons-outlined" style="font-size:15px">add_circle</span> Add Category
                      </button>
                    </ng-container>
                    <ng-container *ngIf="showAddCategoryInput()">
                      <div class="flex gap-1.5 items-center">
                        <input #newCatInput type="text"
                          [value]="newCategoryName()"
                          (input)="newCategoryName.set($any($event.target).value)"
                          (keydown.enter)="addCustomCategory(newCatInput.value)"
                          (keydown.escape)="showAddCategoryInput.set(false); newCategoryName.set('')"
                          placeholder="Category name"
                          class="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                        <button type="button" (click)="addCustomCategory(newCatInput.value)"
                          class="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors">Add</button>
                        <button type="button" (click)="showAddCategoryInput.set(false); newCategoryName.set('')"
                          class="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors">
                          <span class="material-icons-outlined" style="font-size:15px">close</span>
                        </button>
                      </div>
                    </ng-container>
                  </div>
                </div>
              </div>
              <span *ngIf="basicForm.get('category')?.touched && basicForm.get('category')?.hasError('required')" class="text-red-500 text-xs font-normal">Category is required.</span>
            </div>

            <label class="admin-field md:col-span-2">Description<textarea rows="3" formControlName="description" placeholder="Describe what this facility provides..."></textarea></label>
            <!-- Icon picker dropdown -->
            <div class="admin-field">
              Icon
              <div *ngIf="showIconDropdown()" class="fixed inset-0 z-40" (click)="showIconDropdown.set(false); showAddIconInput.set(false)"></div>
              <div class="relative z-50">
                <button type="button"
                  (click)="showIconDropdown.set(!showIconDropdown())"
                  class="w-full flex items-center gap-3 rounded-xl border bg-slate-50 hover:bg-white px-3.5 py-3 text-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  [class.border-brand-500]="showIconDropdown()"
                  [class.bg-white]="showIconDropdown()"
                  [class.border-slate-200]="!showIconDropdown()">
                  <span class="material-icons-outlined" style="font-size:18px;color:#2563eb;">{{ basicForm.value.icon || 'inventory_2' }}</span>
                  <span class="flex-1 text-slate-700">{{ iconLabel(basicForm.value.icon) }}</span>
                  <span class="material-icons-outlined text-slate-400" style="font-size:18px;">{{ showIconDropdown() ? 'expand_less' : 'expand_more' }}</span>
                </button>
                <div *ngIf="showIconDropdown()"
                     class="absolute top-full left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg p-2 z-50 max-h-48 overflow-y-auto">
                  <div class="grid grid-cols-5 gap-1">
                    <button *ngFor="let ic of iconChoices" type="button"
                      (click)="basicForm.patchValue({ icon: ic.value }); showIconDropdown.set(false)"
                      [title]="ic.label"
                      class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-center transition-all hover:bg-brand-50"
                      [style.background]="basicForm.value.icon === ic.value ? '#2563eb' : ''"
                      [style.color]="basicForm.value.icon === ic.value ? '#fff' : '#64748b'">
                      <span class="material-icons-outlined" style="font-size:18px;">{{ ic.value }}</span>
                      <span style="font-size:7.5px;font-weight:600;">{{ ic.label }}</span>
                    </button>
                  </div>
                  <div class="border-t border-slate-100 px-2 py-2 mt-2">
                    <ng-container *ngIf="!showAddIconInput()">
                      <button type="button" (click)="showAddIconInput.set(true)"
                        class="flex items-center justify-center w-full gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <span class="material-icons-outlined" style="font-size:15px">add_circle</span> Add Custom Icon
                      </button>
                    </ng-container>
                    <ng-container *ngIf="showAddIconInput()">
                      <div class="flex gap-1.5 items-center">
                        <input #newIconInp type="text"
                          [value]="newIconName()"
                          (input)="newIconName.set($any($event.target).value)"
                          (keydown.enter)="addCustomIcon(newIconInp.value)"
                          (keydown.escape)="showAddIconInput.set(false); newIconName.set('')"
                          placeholder="Material icon name"
                          class="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                        <button type="button" (click)="addCustomIcon(newIconInp.value)"
                          class="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors">Add</button>
                        <button type="button" (click)="showAddIconInput.set(false); newIconName.set('')"
                          class="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors">
                          <span class="material-icons-outlined" style="font-size:15px">close</span>
                        </button>
                      </div>
                    </ng-container>
                  </div>
                </div>
              </div>
            </div>
          </form>
          <div class="flex justify-end">
            <button mat-flat-button color="primary" matStepperNext (click)="basicForm.markAllAsTouched()">Next</button>
          </div>
        </mat-step>

        <mat-step label="Dynamic Form Builder">
          <div class="grid gap-5 py-6 px-4 xl:grid-cols-[1fr_360px] bg-[#f0ebf8] rounded-xl -mx-4 mt-2 mb-4" style="min-height: 700px;">
            <app-builder-field-list
              [fields]="orderedFields()"
              (add)="addField()"
              (addWithType)="addFieldWithType($event)"
              (edit)="editField($event)"
              (duplicate)="duplicateField($event)"
              (remove)="deleteField($event)"
              (move)="moveField($event.index, $event.direction)"
            />

            <app-builder-live-preview
              [facilityName]="basicForm.value.facilityName || ''"
              [fields]="orderedFields()"
            />
          </div>
          <div class="flex justify-between">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button color="primary" matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step [stepControl]="rulesForm" label="Business Rules">
          <app-builder-rules-form [form]="rulesForm" />
          <div class="flex justify-between">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button color="primary" matStepperNext (click)="rulesForm.markAllAsTouched()">Next</button>
          </div>
        </mat-step>

        <mat-step label="Preview">
          <app-builder-preview-step [fields]="orderedFields()" [facilityName]="basicForm.value.facilityName || ''" [generatedJson]="generatedJson()" />
          <div class="flex justify-between">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button color="primary" matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Publish">
          <app-builder-publish-panel
            [generatedJson]="generatedJson()"
            [isPublished]="isPublished()"
            (saveDraft)="saveDraft()"
            (publish)="publish()"
            (editJson)="applyJsonEdit($event)"
            (downloadJson)="downloadJson()"
            (importJson)="openImportPrompt()"
          />

          <!-- Save as Template button -->
          <div class="mt-4 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-indigo-700">Save as Template</p>
              <p class="text-xs text-slate-500 mt-0.5">Store this facility as a reusable template. Others can create facilities from it.</p>
            </div>
            <button
              mat-flat-button
              color="accent"
              class="shrink-0"
              (click)="saveAsTemplate()"
              [disabled]="!activeFacilityId()">
              <span class="material-icons-outlined text-[1.1em] mr-1">auto_awesome_mosaic</span> Save as Template
            </button>
          </div>

          <div class="mt-4 flex justify-start">
            <button mat-button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [
    `
      .admin-field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #1e293b;
      }

      .admin-field input,
      .admin-field textarea,
      .admin-field select {
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.65rem 0.875rem;
        background: #fff;
        font-size: 0.875rem;
        color: #0f172a;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .admin-field input:focus,
      .admin-field textarea:focus,
      .admin-field select:focus {
        outline: none;
        border-color: #6366f1; /* brand-500 */
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }
      .admin-field input.ng-invalid.ng-touched,
      .admin-field textarea.ng-invalid.ng-touched,
      .admin-field select.ng-invalid.ng-touched {
        border-color: #ef4444; /* red-500 */
      }
      .admin-field input.ng-invalid.ng-touched:focus,
      .admin-field textarea.ng-invalid.ng-touched:focus,
      .admin-field select.ng-invalid.ng-touched:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        border-color: #ef4444;
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
export class AdminFormBuilderPageComponent {
  readonly iconChoices = [
    { value: 'restaurant', label: 'Food' },
    { value: 'directions_bus', label: 'Bus' },
    { value: 'local_parking', label: 'Parking' },
    { value: 'badge', label: 'Badge' },
    { value: 'event', label: 'Event' },
    { value: 'meeting_room', label: 'Room' },
    { value: 'inventory_2', label: 'Inventory' },
    { value: 'computer', label: 'IT' },
    { value: 'security', label: 'Security' },
    { value: 'people', label: 'People' },
    { value: 'fitness_center', label: 'Gym' },
    { value: 'local_cafe', label: 'Café' },
    { value: 'sports_esports', label: 'Recreation' },
    { value: 'local_hospital', label: 'Medical' },
    { value: 'library_books', label: 'Library' },
    { value: 'print', label: 'Print' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'directions_car', label: 'Car' },
    { value: 'apartment', label: 'Office' },
    { value: 'cleaning_services', label: 'Cleaning' },
  ];

  private readonly CUSTOM_CATS_KEY = 'hyhub_custom_categories';
  readonly categoryOptions = signal<string[]>(['Food', 'Mobility', 'Parking', 'Workspace', 'Events', 'Visitors', 'Security', 'IT Services']);
  readonly showCategoryDropdown = signal(false);
  readonly showAddCategoryInput = signal(false);
  readonly newCategoryName = signal('');
  readonly showIconDropdown = signal(false);
  readonly showAddIconInput = signal(false);
  readonly newIconName = signal('');
  private openMode: 'new' | 'edit' = 'new';

  /** Only non-template facilities appear in the working-facility dropdown. */
  readonly facilityLibrary = computed(() => this.state.facilities().filter((f) => !f.isTemplate));
  readonly activeFacilityId = computed(() => this.state.activeFacilityId());
  readonly isPublished = computed(() => this.state.activeFacility()?.published ?? false);
  readonly formFieldCount = computed(() => this.orderedFields().length);
  readonly requiredFieldCount = computed(() => this.orderedFields().filter((field) => field.required).length);
  readonly optionSetCount = computed(() => this.orderedFields().filter((field) => (field.options ?? []).length > 0).length);

  readonly basicForm = this.fb.group({
    type: ['Service', Validators.required],
    facilityName: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    icon: ['inventory_2'],
  });

  readonly rulesForm = this.fb.group({
    facilityAvailableFromDate: [''],
    facilityAvailableToDate: [''],
    bookingStartTime: ['', Validators.required],
    bookingEndTime: ['', Validators.required],
    bookingDeadline: [''],
    reminderTime: ['', Validators.required],
    cancellationDeadline: ['', Validators.required],
    bookingWindowDays: [null as number | null],
    availableDays: [''],
    employeeTypeOnSite: [true],
    employeeTypeRemote: [true],
    employeeTypeHybrid: [true],
    roleHR: [true],
    roleManager: [true],
    roleFinance: [true],
    roleCloud: [true],
    roleRD: [true],
    roleDirector: [true],
    roleIS: [true],
    roleNOC: [true],
    roleOps: [true],
    roleDevops: [true]
  });

  readonly draftFields = signal<FacilityField[]>([]);
  readonly generatedJson = signal('');

  readonly orderedFields = computed(() =>
    this.draftFields()
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialog: MatDialog,
    private readonly state: FacilityBuilderStateService,
    private readonly snackBar: MatSnackBar,
    private readonly facilityAdminApi: FacilityAdminApiService,
    private readonly specificationApi: SpecificationApiService,
    private readonly router: Router
  ) {
    // Capture nav state BEFORE any async work — getCurrentNavigation() returns null after navigation settles.
    const navState = this.router.getCurrentNavigation()?.extras?.state;
    this.openMode = navState?.['editMode'] === true ? 'edit' : 'new';
    this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    try {
      await this.state.loadFromBackend();
    } catch {
      // Keep local builder usable even if backend load fails.
    }
    this.loadInitialFacility();
  }

  createNewDraft(): void {
    this.state.createDraft();
    this.clearForm();
    this.toast('New draft created');
  }

  selectCategory(cat: string): void {
    this.basicForm.patchValue({ category: cat });
    this.showCategoryDropdown.set(false);
    this.showAddCategoryInput.set(false);
    this.newCategoryName.set('');
  }

  addCustomIcon(name: string): void {
    const val = name.trim();
    if (val) {
      // Check if it exists
      if (!this.iconChoices.find(ic => ic.value === val)) {
        // Add custom icon to choices
        this.iconChoices.push({ value: val, label: val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, ' ') });
      }
      this.basicForm.patchValue({ icon: val });
      this.newIconName.set('');
      this.showAddIconInput.set(false);
      this.showIconDropdown.set(false);
    }
  }

  iconLabel(value: string | null | undefined): string {
    return this.iconChoices.find(ic => ic.value === value)?.label ?? value ?? '';
  }

  addCustomCategory(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) { return; }
    if (!this.categoryOptions().includes(trimmed)) {
      this.categoryOptions.update(cats => [...cats, trimmed]);
      try {
        const stored = localStorage.getItem(this.CUSTOM_CATS_KEY);
        const custom: string[] = stored ? JSON.parse(stored) : [];
        if (!custom.includes(trimmed)) { custom.push(trimmed); localStorage.setItem(this.CUSTOM_CATS_KEY, JSON.stringify(custom)); }
      } catch { /* ignore */ }
    }
    this.selectCategory(trimmed);
  }

  addField(): void {
    this.dialog
      .open(FieldConfigDialogComponent, {
        width: '640px',
        data: { displayOrder: this.draftFields().length + 1 }
      })
      .afterClosed()
      .subscribe((field?: FacilityField) => {
        if (!field) {
          return;
        }
        this.draftFields.update((items) => [...items, field]);
        this.normalizeFieldOrder();
        this.refreshJson();
      });
  }

  addFieldWithType(fieldType: FacilityField['fieldType']): void {
    this.dialog
      .open(FieldConfigDialogComponent, {
        width: '640px',
        data: {
          field: {
            label: '',
            fieldType,
            required: false,
            displayOrder: this.draftFields().length + 1,
            options: []
          },
          displayOrder: this.draftFields().length + 1
        }
      })
      .afterClosed()
      .subscribe((field?: FacilityField) => {
        if (!field) {
          return;
        }
        this.draftFields.update((items) => [...items, field]);
        this.normalizeFieldOrder();
        this.refreshJson();
      });
  }

  editField(field: FacilityField): void {
    this.dialog
      .open(FieldConfigDialogComponent, {
        width: '640px',
        data: { field, displayOrder: field.displayOrder }
      })
      .afterClosed()
      .subscribe((next?: FacilityField) => {
        if (!next) {
          return;
        }
        this.draftFields.update((items) => items.map((entry) => (entry === field ? { ...next } : entry)));
        this.normalizeFieldOrder();
        this.refreshJson();
      });
  }

  duplicateField(field: FacilityField): void {
    this.draftFields.update((items) => [...items, { ...field, label: `${field.label} Copy` }]);
    this.normalizeFieldOrder();
    this.refreshJson();
  }

  deleteField(field: FacilityField): void {
    this.draftFields.update((items) => items.filter((entry) => entry !== field));
    this.normalizeFieldOrder();
    this.refreshJson();
  }

  moveField(index: number, direction: number): void {
    const items = this.orderedFields();
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, moved);
    this.draftFields.set(copy);
    this.normalizeFieldOrder();
    this.refreshJson();
  }

  async saveDraft(): Promise<void> {
    if (this.basicForm.invalid) {
      this.basicForm.markAllAsTouched();
      this.toast('Please enter a facility name before saving a draft', 'Close', 3500);
      return;
    }
    try {
      const persisted = await this.persistBuilder(false);
      this.state.upsertFacility(persisted);
      this.refreshJson();
      this.toast('Draft saved');
    } catch (error: any) {
      this.toast(error?.error?.message ?? 'Draft save failed', 'Close', 3200);
    }
  }

  async saveAsTemplate(): Promise<void> {
    if (this.basicForm.invalid) {
      this.basicForm.markAllAsTouched();
      this.toast('Please enter a facility name before saving as template', 'Close', 3500);
      return;
    }
    const id = this.activeFacilityId();
    if (!id || this.state.activeFacility()?.isLocal) {
      this.toast('Save a draft first before saving as template', 'Close', 3000);
      return;
    }
    try {
      // Persist current state first
      const persisted = await this.persistBuilder(false);
      this.state.upsertFacility(persisted);
      // Mark as template on backend
      await this.state.saveAsTemplate(id);
      this.toast('✅ Saved as template! Find it in the Templates section.');
      this.router.navigateByUrl('/admin/facilities');
    } catch (error: any) {
      this.toast(error?.error?.message ?? 'Save as template failed', 'Close', 3200);
    }
  }

  async publish(): Promise<void> {
    if (this.basicForm.invalid) {
      this.basicForm.markAllAsTouched();
      this.toast('Please complete the Basic Information step', 'Close', 3000);
      return;
    }
    if (this.rulesForm.invalid) {
      this.rulesForm.markAllAsTouched();
      this.toast('Please fill all required Business Rules fields', 'Close', 3000);
      return;
    }

    const fieldError = this.validateDraftFields(this.orderedFields());
    if (fieldError) {
      this.toast(fieldError, 'Close', 3400);
      return;
    }

    try {
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

      const persisted = await this.persistBuilder(true, publishConfig.targetLocations);
      this.state.upsertFacility(persisted);
      this.state.publishFacility(persisted.id);
      this.refreshJson();
      this.toast('Facility published successfully');
    } catch (error: any) {
      this.toast(error?.error?.message ?? 'Publish failed', 'Close', 3200);
    }
  }

  refreshJson(): void {
    const json = JSON.stringify(this.currentSpecification(), null, 2);
    this.generatedJson.set(json);
  }

  applyJsonEdit(json: string): void {
    try {
      const parsed = JSON.parse(json) as FacilitySpecification;
      this.validateImportedSpecification(parsed);
      const record = this.state.fromSpecification(parsed);
      // Preserve current active facility id so we don't create a phantom draft
      const activeId = this.state.activeFacilityId();
      if (activeId) {
        record.id = activeId;
      }
      this.patchFromRecord(record);
      this.refreshJson();
      this.toast('JSON applied — review changes then publish');
    } catch (e: any) {
      this.toast(e?.message ?? 'Invalid JSON', 'Close', 4000);
    }
  }

  downloadJson(): void {
    this.refreshJson();
    const blob = new Blob([this.generatedJson()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(this.basicForm.value.facilityName || 'facility').replace(/\s+/g, '-').toLowerCase()}-specification.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.toast('Specification JSON downloaded');
  }

  async openImportPrompt(): Promise<void> {
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
      this.validateImportedSpecification(parsed);
      const uploaded = await firstValueFrom(this.specificationApi.uploadSpecification(parsed));
      await this.state.loadFromBackend();
      const record = this.state.facilities().find((item) => item.id === uploaded.facilityId) ?? this.state.fromSpecification(parsed);
      this.state.setActiveFacility(record.id);
      this.patchFromRecord(record);
      this.refreshJson();
      this.toast('Specification imported successfully');
    } catch (error: any) {
      this.toast(error?.error?.message ?? error?.message ?? 'Invalid specification JSON', 'Close', 5000);
    }
  }

  applyEditedJson(rawJson: string): void {
    try {
      const parsed = JSON.parse(rawJson) as FacilitySpecification;
      this.validateImportedSpecification(parsed);

      if (parsed.facilityName) {
        this.basicForm.patchValue({
          facilityName: parsed.facilityName,
          description: parsed.description ?? '',
          category: this.categoryOptions().includes(parsed.category ?? '') ? parsed.category : 'Other',
          icon: parsed.icon ?? 'inventory_2',
        });
      }

      this.rulesForm.patchValue({
        facilityAvailableFromDate: parsed.rules?.facilityAvailableFromDate ?? '',
        facilityAvailableToDate: parsed.rules?.facilityAvailableToDate ?? '',
        bookingStartTime: parsed.rules?.bookingStartTime ?? '',
        bookingEndTime: parsed.rules?.bookingDeadline ?? '',
        bookingDeadline: parsed.rules?.bookingDeadline ?? '',
        reminderTime: parsed.rules?.reminderTime ?? '',
        cancellationDeadline: parsed.rules?.cancellationDeadline ?? '',
        bookingWindowDays: parsed.rules?.bookingWindowDays ?? null,
        availableDays: parsed.rules?.availableDays ?? '',
        employeeTypeOnSite: (parsed.rules?.employeeTypes ?? []).includes('On-site'),
        employeeTypeRemote: (parsed.rules?.employeeTypes ?? []).includes('Remote'),
        employeeTypeHybrid: (parsed.rules?.employeeTypes ?? []).includes('Hybrid'),
        roleHR: (parsed.rules?.roles ?? []).includes('HR'),
        roleManager: (parsed.rules?.roles ?? []).includes('Manager'),
        roleFinance: (parsed.rules?.roles ?? []).includes('Finance'),
        roleCloud: (parsed.rules?.roles ?? []).includes('Cloud'),
        roleRD: (parsed.rules?.roles ?? []).includes('RD'),
        roleDirector: (parsed.rules?.roles ?? []).includes('Director'),
        roleIS: (parsed.rules?.roles ?? []).includes('IS'),
        roleNOC: (parsed.rules?.roles ?? []).includes('NOC'),
        roleOps: (parsed.rules?.roles ?? []).includes('Ops'),
        roleDevops: (parsed.rules?.roles ?? []).includes('Devops'),
      });

      const parsedFields = (parsed.fields ?? []).map((field, index) => ({
          ...field,
          displayOrder: field.displayOrder ?? index + 1
        }));

      const fieldError = this.validateDraftFields(parsedFields);
      if (fieldError) {
        this.toast(fieldError, 'Close', 3400);
        return;
      }

      this.draftFields.set(parsedFields);

      this.normalizeFieldOrder();
      this.refreshJson();
      this.toast('Edited JSON applied to form');
    } catch (error: any) {
      this.toast(error?.message ?? 'Invalid JSON format', 'Close', 3200);
    }
  }

  switchFacility(facilityIdRaw: string): void {
    const facilityId = Number(facilityIdRaw);
    if (!Number.isFinite(facilityId)) {
      return;
    }

    const selected = this.state.facilities().find((facility) => facility.id === facilityId);
    if (!selected) {
      return;
    }

    this.state.setActiveFacility(selected.id);
    this.patchFromRecord(selected);
    this.refreshJson();
  }

  private validateDraftFields(fields: FacilityField[]): string | null {
    for (const field of fields) {
      const fieldNo = field.displayOrder || 1;
      if (!field.label?.trim()) {
        return `Field ${fieldNo}: label is required`;
      }
      if (this.fieldUsesOptions(field.fieldType) && (!field.options || field.options.length === 0)) {
        return `Field ${fieldNo}: at least one option is required`;
      }
      if (field.validationJson && field.validationJson.trim()) {
        try {
          const parsed = JSON.parse(field.validationJson);
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return `Field ${fieldNo}: validation JSON must be an object`;
          }
        } catch {
          return `Field ${fieldNo}: validation JSON is invalid`;
        }
      }
    }
    return null;
  }

  private validateImportedSpecification(spec: FacilitySpecification): void {
    if (!spec.facilityName?.trim()) {
      throw new Error('facilityName is required');
    }
    if (!Array.isArray(spec.fields)) {
      throw new Error('fields must be an array');
    }

    spec.fields.forEach((field, index) => {
      if (!field.label?.trim()) {
        throw new Error(`Field ${index + 1} label is required`);
      }
      if (!field.fieldType) {
        throw new Error(`Field ${index + 1} fieldType is required`);
      }
    });
  }

  private loadInitialFacility(): void {
    if (this.openMode === 'edit') {
      // Arrived from facilities page — load the facility that was set active before navigation.
      const active = this.state.activeFacility();
      if (active) {
        this.patchFromRecord(active);
        this.refreshJson();
        return;
      }
    }
    // 'new' mode (nav link click) — always start blank.
    this.state.createDraft();
    this.clearForm();
  }

  private currentTimeString(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  private clearForm(): void {
    this.basicForm.reset({ type: 'Service', facilityName: '', description: '', category: '', icon: 'inventory_2' });
    this.rulesForm.reset({
      facilityAvailableFromDate: '',
      facilityAvailableToDate: '',
      bookingStartTime: '',
      bookingEndTime: '',
      bookingDeadline: '',
      reminderTime: '',
      cancellationDeadline: '',
      bookingWindowDays: null,
      availableDays: '',
      employeeTypeOnSite: true,
      employeeTypeRemote: true,
      employeeTypeHybrid: true,
      roleHR: true,
      roleManager: true,
      roleFinance: true,
      roleCloud: true,
      roleRD: true,
      roleDirector: true,
      roleIS: true,
      roleNOC: true,
      roleOps: true,
      roleDevops: true,
    });
    this.draftFields.set([]);
    this.refreshJson();
  }

  private loadCustomCategories(): void {
    try {
      const stored = localStorage.getItem(this.CUSTOM_CATS_KEY);
      if (stored) {
        const custom: string[] = JSON.parse(stored);
        this.categoryOptions.update(cats => {
          const merged = [...cats];
          custom.forEach(c => { if (!merged.includes(c)) merged.push(c); });
          return merged;
        });
      }
    } catch { /* ignore */ }
  }

  private patchFromRecord(record: FacilityBuilderRecord): void {
    let cat = record.category || '';
    let type = 'Service';
    if (cat.endsWith(' [EVENT]')) {
      cat = cat.replace(' [EVENT]', '');
      type = 'Event';
    }

    if (cat && !this.categoryOptions().includes(cat)) {
      this.categoryOptions.update(cats => [...cats, cat]);
    }

    this.basicForm.patchValue({
      type: type,
      facilityName: record.facilityName,
      description: record.description,
      category: cat,
      icon: record.icon,
    });

    this.rulesForm.patchValue({
      facilityAvailableFromDate: record.rules?.facilityAvailableFromDate ?? '',
      facilityAvailableToDate: record.rules?.facilityAvailableToDate ?? '',
      bookingStartTime: record.isTemplate ? this.currentTimeString() : (record.rules?.bookingStartTime || this.currentTimeString()),
      // Patch the visible bookingEndTime field. Also sync the hidden bookingDeadline control
      // so both are in agreement immediately after load (prevents stale-value bug on save).
      bookingEndTime: record.rules?.bookingDeadline ?? '',
      bookingDeadline: record.rules?.bookingDeadline ?? '',
      reminderTime: record.rules?.reminderTime ?? '',
      cancellationDeadline: record.rules?.cancellationDeadline ?? '',
      bookingWindowDays: record.rules?.bookingWindowDays ?? null,
      availableDays: record.rules?.availableDays ?? '',
      employeeTypeOnSite: (record.rules?.employeeTypes ?? []).includes('On-site'),
      employeeTypeRemote: (record.rules?.employeeTypes ?? []).includes('Remote'),
      employeeTypeHybrid: (record.rules?.employeeTypes ?? []).includes('Hybrid'),
      roleHR: (record.rules?.roles ?? []).includes('HR'),
      roleManager: (record.rules?.roles ?? []).includes('Manager'),
      roleFinance: (record.rules?.roles ?? []).includes('Finance'),
      roleCloud: (record.rules?.roles ?? []).includes('Cloud'),
      roleRD: (record.rules?.roles ?? []).includes('RD'),
      roleDirector: (record.rules?.roles ?? []).includes('Director'),
      roleIS: (record.rules?.roles ?? []).includes('IS'),
      roleNOC: (record.rules?.roles ?? []).includes('NOC'),
      roleOps: (record.rules?.roles ?? []).includes('Ops'),
      roleDevops: (record.rules?.roles ?? []).includes('Devops'),
    });

    this.draftFields.set(record.fields.map((field) => ({ ...field })));
    this.normalizeFieldOrder();
  }

  private currentRecord(published: boolean): FacilityBuilderRecord {
    const existing = this.state.activeFacility();

    return {
      id: existing?.id ?? this.state.createDraft().id,
      facilityName: this.basicForm.value.facilityName?.trim() || 'Untitled Facility',
      description: this.basicForm.value.description?.trim() || '',
      category: this.resolveCategoryValue(),
      icon: this.basicForm.value.icon || 'inventory_2',
      colorTheme: '#0f6cbd',
      status: true,
      published,
      isTemplate: existing?.isTemplate ?? false,
      isPublic: existing?.isPublic ?? true,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: this.orderedFields().map((field) => ({ ...field })),
      rules: {
        facilityAvailableFromDate: this.rulesForm.value.facilityAvailableFromDate || null,
        facilityAvailableToDate: this.rulesForm.value.facilityAvailableToDate || null,
        bookingStartTime: this.rulesForm.value.bookingStartTime || null,
        // bookingEndTime is the visible UI input; bookingDeadline is a hidden shadow — prefer visible field.
        bookingDeadline: this.rulesForm.value.bookingEndTime || this.rulesForm.value.bookingDeadline || null,
        reminderTime: this.rulesForm.value.reminderTime || null,
        cancellationDeadline: this.rulesForm.value.cancellationDeadline || null,
        bookingWindowDays: this.rulesForm.value.bookingWindowDays || null,
        availableDays: this.rulesForm.value.availableDays || null,
        allowCancellation: true,
        qrRequired: false,
        regularCommuteEnabled: false,
        employeeTypes: [
          this.rulesForm.value.employeeTypeOnSite ? 'On-site' : null,
          this.rulesForm.value.employeeTypeRemote ? 'Remote' : null,
          this.rulesForm.value.employeeTypeHybrid ? 'Hybrid' : null,
        ].filter((v): v is string => v !== null),
        roles: [
          this.rulesForm.value.roleHR ? 'HR' : null,
          this.rulesForm.value.roleManager ? 'Manager' : null,
          this.rulesForm.value.roleFinance ? 'Finance' : null,
          this.rulesForm.value.roleCloud ? 'Cloud' : null,
          this.rulesForm.value.roleRD ? 'RD' : null,
          this.rulesForm.value.roleDirector ? 'Director' : null,
          this.rulesForm.value.roleIS ? 'IS' : null,
          this.rulesForm.value.roleNOC ? 'NOC' : null,
          this.rulesForm.value.roleOps ? 'Ops' : null,
          this.rulesForm.value.roleDevops ? 'Devops' : null,
        ].filter((v): v is string => v !== null),
      }
    };
  }

  private currentSpecification(): FacilitySpecification {
    const record = this.currentRecord(this.state.activeFacility()?.published ?? false);
    return this.state.toSpecification(record);
  }

  private normalizeFieldOrder(): void {
    this.draftFields.update((items) =>
      items
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((field, index) => ({ ...field, displayOrder: index + 1 }))
    );
  }

  private toast(message: string, action = 'OK', duration = 2400): void {
    this.snackBar.open(message, action, { duration });
  }

  private async persistBuilder(publishAfterSave: boolean, publishLocations: string[] = []): Promise<FacilityBuilderRecord> {
    const base = this.currentRecord(false);
    const existing = this.state.activeFacility();

    let facilityId = existing?.id ?? 0;
    if (!existing || existing.isLocal) {
      const created = await firstValueFrom(
        this.facilityAdminApi.createFacility({
          facilityName: base.facilityName,
          description: base.description,
          category: base.category,
          icon: base.icon,
          status: base.status
        })
      );
      facilityId = created.facilityId;
    } else {
      await firstValueFrom(
        this.facilityAdminApi.updateFacility(existing.id, {
          facilityName: base.facilityName,
          description: base.description,
          category: base.category,
          icon: base.icon,
          status: base.status
        })
      );
      facilityId = existing.id;
    }

    const draftFields = this.orderedFields();
    if (!existing || existing.isLocal) {
      for (const field of draftFields) {
        const createdField = await firstValueFrom(this.facilityAdminApi.addField(facilityId, this.toFieldPayload(field)));
        if (this.fieldUsesOptions(field.fieldType) && (field.options ?? []).length > 0) {
          await firstValueFrom(this.facilityAdminApi.addFieldOptions(createdField.fieldId, field.options ?? []));
        }
      }
    } else {
      const generated = await firstValueFrom(this.specificationApi.getGeneratedSpecification(facilityId));
      const existingFields = generated.fields ?? [];
      const draftById = new Map<number, FacilityField>();
      for (const field of draftFields) {
        if (field.fieldId) {
          draftById.set(field.fieldId, field);
        }
      }

      for (const current of existingFields) {
        if (current.fieldId && !draftById.has(current.fieldId)) {
          await firstValueFrom(this.facilityAdminApi.deleteField(current.fieldId));
        }
      }

      for (const field of draftFields) {
        if (field.fieldId) {
          const previous = existingFields.find((item) => item.fieldId === field.fieldId);
          if (!previous || this.isFieldChanged(previous, field)) {
            await firstValueFrom(this.facilityAdminApi.updateField(field.fieldId, this.toFieldPayload(field)));
            if (this.fieldUsesOptions(field.fieldType)) {
              await firstValueFrom(this.facilityAdminApi.addFieldOptions(field.fieldId, field.options ?? []));
            }
          }
          continue;
        }

        const createdField = await firstValueFrom(this.facilityAdminApi.addField(facilityId, this.toFieldPayload(field)));
        if (this.fieldUsesOptions(field.fieldType)) {
          await firstValueFrom(this.facilityAdminApi.addFieldOptions(createdField.fieldId, field.options ?? []));
        }
      }
    }

    await firstValueFrom(
      this.facilityAdminApi.saveRules(facilityId, {
        // bookingEndTime is the visible UI input; bookingDeadline is a hidden shadow control.
        // Always prefer the visible field so user edits are not overridden by the stale patched value.
        bookingDeadline: this.rulesForm.value.bookingEndTime || this.rulesForm.value.bookingDeadline || null,
        bookingStartTime: this.rulesForm.value.bookingStartTime || null,
        reminderTime: this.rulesForm.value.reminderTime || null,
        qrRequired: false,
        allowCancellation: true,
        maximumCapacity: null,
        regularCommuteEnabled: false,
        availableDays: this.rulesForm.value.availableDays || null,
        bookingWindowDays: this.rulesForm.value.bookingWindowDays ?? null,
        facilityAvailableFromDate: this.rulesForm.value.facilityAvailableFromDate || null,
        facilityAvailableToDate: this.rulesForm.value.facilityAvailableToDate || null,
        cancellationDeadline: this.rulesForm.value.cancellationDeadline || null,
        employeeTypes: [
          this.rulesForm.value.employeeTypeOnSite ? 'On-site' : null,
          this.rulesForm.value.employeeTypeRemote ? 'Remote' : null,
          this.rulesForm.value.employeeTypeHybrid ? 'Hybrid' : null,
        ].filter((v): v is string => v !== null).join(','),
        roles: [
          this.rulesForm.value.roleHR ? 'HR' : null,
          this.rulesForm.value.roleManager ? 'Manager' : null,
          this.rulesForm.value.roleFinance ? 'Finance' : null,
          this.rulesForm.value.roleCloud ? 'Cloud' : null,
          this.rulesForm.value.roleRD ? 'RD' : null,
          this.rulesForm.value.roleDirector ? 'Director' : null,
          this.rulesForm.value.roleIS ? 'IS' : null,
          this.rulesForm.value.roleNOC ? 'NOC' : null,
          this.rulesForm.value.roleOps ? 'Ops' : null,
          this.rulesForm.value.roleDevops ? 'Devops' : null,
        ].filter((v): v is string => v !== null).join(',')
      })
    );

    if (publishAfterSave) {
      await firstValueFrom(this.facilityAdminApi.publishFacility(facilityId, { targetLocations: publishLocations }));
    }

    await this.state.loadFromBackend();
    const refreshed = this.state.facilities().find((item) => item.id === facilityId);
    if (refreshed) {
      this.state.setActiveFacility(refreshed.id);
      this.patchFromRecord(refreshed);
      return refreshed;
    }

    return {
      ...base,
      id: facilityId,
      published: publishAfterSave
    };
  }

  private toFieldPayload(field: FacilityField): {
    label: string;
    fieldType: string;
    placeholder?: string;
    required: boolean;
    displayOrder: number;
    validationJson?: string;
    defaultValue?: string;
  } {
    return {
      label: field.label,
      fieldType: field.fieldType,
      placeholder: field.placeholder,
      required: field.required,
      displayOrder: field.displayOrder,
      validationJson: field.validationJson,
      defaultValue: field.defaultValue
    };
  }

  private isFieldChanged(previous: FacilityField, next: FacilityField): boolean {
    if (previous.label !== next.label) {
      return true;
    }
    if (previous.fieldType !== next.fieldType) {
      return true;
    }
    if ((previous.placeholder ?? '') !== (next.placeholder ?? '')) {
      return true;
    }
    if (Boolean(previous.required) !== Boolean(next.required)) {
      return true;
    }
    if ((previous.displayOrder ?? 0) !== (next.displayOrder ?? 0)) {
      return true;
    }
    if ((previous.validationJson ?? '') !== (next.validationJson ?? '')) {
      return true;
    }
    if ((previous.defaultValue ?? '') !== (next.defaultValue ?? '')) {
      return true;
    }

    const oldOptions = (previous.options ?? []).map((item) => item.trim());
    const newOptions = (next.options ?? []).map((item) => item.trim());
    if (oldOptions.length !== newOptions.length) {
      return true;
    }
    for (let i = 0; i < oldOptions.length; i += 1) {
      if (oldOptions[i] !== newOptions[i]) {
        return true;
      }
    }
    return false;
  }

  private fieldUsesOptions(type: string): boolean {
    return type === 'DROPDOWN' || type === 'CHECKBOX' || type === 'RADIO_BUTTON';
  }

  private resolveCategoryValue(): string {
    let cat = (this.basicForm.value.category ?? '').trim() || 'General';
    if (this.basicForm.value.type === 'Event') {
      if (!cat.endsWith(' [EVENT]')) {
        cat += ' [EVENT]';
      }
    }
    return cat;
  }

  private defaultLabelForFieldType(type: FacilityField['fieldType']): string {
    const map: Record<string, string> = {
      TEXTBOX: 'Text Input',
      TEXTAREA: 'Long Answer',
      DROPDOWN: 'Select Option',
      CHECKBOX: 'Checkbox Group',
      RADIO_BUTTON: 'Single Choice',
      DATE_PICKER: 'Select Date',
      TIME_PICKER: 'Select Time',
      EMAIL: 'Email Address',
      PHONE: 'Phone Number',
      NUMBER: 'Numeric Value',
      FILE_UPLOAD: 'Upload File',
      QR_SCANNER: 'QR Code',
      SIGNATURE: 'Signature'
    };
    return map[type] ?? 'Field';
  }
}
