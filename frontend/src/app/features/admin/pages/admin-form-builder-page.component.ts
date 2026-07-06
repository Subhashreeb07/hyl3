import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
      <section class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Create Facility Wizard</h2>
          <p class="text-sm text-slate-600">Visual low-code builder. The platform generates specification JSON automatically.</p>
        </div>
        <div class="flex gap-2">
          <button class="satori-secondary" (click)="createNewDraft()">New Draft</button>
          <button class="satori-secondary" (click)="openImportPrompt()">Import JSON</button>
        </div>
      </section>

      <mat-stepper [linear]="false" class="rounded-2xl bg-white p-4 shadow-sm">
        <mat-step [stepControl]="basicForm" label="Basic Information">
          <form [formGroup]="basicForm" class="grid gap-4 py-4 md:grid-cols-2">
            <label class="admin-field">Facility Name<input type="text" formControlName="facilityName" /></label>
            <label class="admin-field">Category<input type="text" formControlName="category" /></label>
            <label class="admin-field md:col-span-2">Description<textarea rows="3" formControlName="description"></textarea></label>
            <label class="admin-field">Icon
              <select formControlName="icon">
                <option *ngFor="let icon of iconChoices" [value]="icon">{{ icon }}</option>
              </select>
            </label>
            <label class="admin-field">Color Theme<input type="color" formControlName="colorTheme" /></label>
            <label class="admin-inline"><input type="checkbox" formControlName="status" /> Enable Facility</label>
          </form>
          <div class="flex justify-end"><button mat-flat-button color="primary" matStepperNext>Next</button></div>
        </mat-step>

        <mat-step label="Dynamic Form Builder">
          <div class="grid gap-5 py-4 xl:grid-cols-[1fr_360px]">
            <app-builder-field-list
              [fields]="orderedFields()"
              (add)="addField()"
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
            <button mat-flat-button color="primary" matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Preview">
          <app-builder-preview-step [fields]="orderedFields()" [generatedJson]="generatedJson()" />
          <div class="flex justify-between">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button color="primary" matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Publish">
          <app-builder-publish-panel
            [generatedJson]="generatedJson()"
            (saveDraft)="saveDraft()"
            (publish)="publish()"
            (generateJson)="refreshJson()"
            (downloadJson)="downloadJson()"
            (importJson)="openImportPrompt()"
          />

          <div class="mt-4 flex justify-start">
            <button mat-button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: []
})
export class AdminFormBuilderPageComponent {
  readonly iconChoices = ['restaurant', 'directions_bus', 'local_parking', 'badge', 'event', 'meeting_room', 'inventory_2'];

  readonly basicForm = this.fb.group({
    facilityName: ['', Validators.required],
    description: [''],
    category: ['General', Validators.required],
    icon: ['inventory_2'],
    colorTheme: ['#0f6cbd'],
    status: [true]
  });

  readonly rulesForm = this.fb.group({
    bookingStartTime: [''],
    bookingEndTime: [''],
    bookingDeadline: [''],
    reminderTime: [''],
    maximumCapacity: [null as number | null],
    allowCancellation: [true],
    cancellationDeadline: [''],
    qrRequired: [false],
    approvalRequired: [false],
    regularCommuteEnabled: [false],
    autoCloseFacility: [false],
    bookingWindow: [''],
    weekendEnabled: [false],
    holidayEnabled: [false]
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
    private readonly specificationApi: SpecificationApiService
  ) {
    this.loadInitialFacility();
  }

  createNewDraft(): void {
    const draft = this.state.createDraft();
    this.patchFromRecord(draft);
    this.refreshJson();
    this.toast('New draft facility created');
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
    try {
      const persisted = await this.persistBuilder(false);
      this.state.upsertFacility(persisted);
      this.refreshJson();
      this.toast('Draft saved');
    } catch (error: any) {
      this.toast(error?.error?.message ?? 'Draft save failed', 'Close', 3200);
    }
  }

  async publish(): Promise<void> {
    try {
      const persisted = await this.persistBuilder(true);
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
      this.toast(error?.message ?? 'Invalid specification JSON', 'Close', 5000);
    }
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
    const active = this.state.activeFacility() ?? this.state.facilities()[0] ?? this.state.createDraft();
    this.state.setActiveFacility(active.id);
    this.patchFromRecord(active);
    this.refreshJson();
  }

  private patchFromRecord(record: FacilityBuilderRecord): void {
    this.basicForm.patchValue({
      facilityName: record.facilityName,
      description: record.description,
      category: record.category,
      icon: record.icon,
      colorTheme: record.colorTheme,
      status: record.status
    });

    this.rulesForm.patchValue({
      bookingStartTime: record.rules.bookingStartTime ?? '',
      bookingEndTime: record.rules.bookingEndTime ?? '',
      bookingDeadline: record.rules.bookingDeadline ?? '',
      reminderTime: record.rules.reminderTime ?? '',
      maximumCapacity: record.rules.maximumCapacity ?? null,
      allowCancellation: record.rules.allowCancellation ?? true,
      cancellationDeadline: record.rules.cancellationDeadline ?? '',
      qrRequired: record.rules.qrRequired ?? false,
      approvalRequired: record.rules.approvalRequired ?? false,
      regularCommuteEnabled: record.rules.regularCommuteEnabled ?? false,
      autoCloseFacility: record.rules.autoCloseFacility ?? false,
      bookingWindow: record.rules.bookingWindow ?? '',
      weekendEnabled: record.rules.weekendEnabled ?? false,
      holidayEnabled: record.rules.holidayEnabled ?? false
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
      category: this.basicForm.value.category?.trim() || 'General',
      icon: this.basicForm.value.icon || 'inventory_2',
      colorTheme: this.basicForm.value.colorTheme || '#0f6cbd',
      status: Boolean(this.basicForm.value.status),
      published,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: this.orderedFields().map((field) => ({ ...field })),
      rules: {
        bookingStartTime: this.rulesForm.value.bookingStartTime || null,
        bookingEndTime: this.rulesForm.value.bookingEndTime || null,
        bookingDeadline: this.rulesForm.value.bookingDeadline || null,
        reminderTime: this.rulesForm.value.reminderTime || null,
        maximumCapacity: this.rulesForm.value.maximumCapacity ?? null,
        allowCancellation: Boolean(this.rulesForm.value.allowCancellation),
        cancellationDeadline: this.rulesForm.value.cancellationDeadline || null,
        qrRequired: Boolean(this.rulesForm.value.qrRequired),
        approvalRequired: Boolean(this.rulesForm.value.approvalRequired),
        regularCommuteEnabled: Boolean(this.rulesForm.value.regularCommuteEnabled),
        autoCloseFacility: Boolean(this.rulesForm.value.autoCloseFacility),
        bookingWindow: this.rulesForm.value.bookingWindow || null,
        weekendEnabled: Boolean(this.rulesForm.value.weekendEnabled),
        holidayEnabled: Boolean(this.rulesForm.value.holidayEnabled)
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

  private async persistBuilder(publishAfterSave: boolean): Promise<FacilityBuilderRecord> {
    const base = this.currentRecord(false);
    const existing = this.state.activeFacility();

    let facilityId = existing?.id ?? 0;
    if (!existing || existing.facilityName === 'Untitled Facility') {
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
    if (!existing || existing.facilityName === 'Untitled Facility') {
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
        bookingDeadline: this.rulesForm.value.bookingDeadline || null,
        bookingStartTime: this.rulesForm.value.bookingStartTime || null,
        reminderTime: this.rulesForm.value.reminderTime || null,
        qrRequired: Boolean(this.rulesForm.value.qrRequired),
        allowCancellation: Boolean(this.rulesForm.value.allowCancellation),
        maximumCapacity: this.rulesForm.value.maximumCapacity ?? null,
        regularCommuteEnabled: Boolean(this.rulesForm.value.regularCommuteEnabled)
      })
    );

    if (publishAfterSave) {
      await firstValueFrom(this.facilityAdminApi.publishFacility(facilityId));
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
}
