import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FacilityField, FieldType } from '../../../core/models/specification.models';

export interface FieldDialogData {
  field?: FacilityField;
  displayOrder: number;
}

@Component({
  selector: 'app-field-config-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  styles: [`
    :host { display: block; }
    .field-input {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 0.6rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: #1e293b;
      background: #fff;
      transition: border-color 0.15s, box-shadow 0.15s;
      outline: none;
    }
    .field-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .type-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      border-radius: 0.7rem;
      border: 1.5px solid #e2e8f0;
      background: #fff;
      padding: 0.55rem 0.3rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }
    .type-btn:hover { border-color: #a5b4fc; background: #eef2ff; color: #4f46e5; }
    .type-btn.active { border-color: #6366f1; background: #eef2ff; color: #4f46e5; }
    .toggle-wrap { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; }
    .toggle-track {
      position: relative; width: 36px; height: 20px; border-radius: 999px;
      background: #e2e8f0; transition: background 0.2s;
    }
    .toggle-track.on { background: #6366f1; }
    .toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }
    .toggle-track.on .toggle-thumb { transform: translateX(16px); }
  `],
  template: `
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h2 class="text-base font-bold text-slate-900">{{ data.field ? 'Edit Field' : 'Add Field' }}</h2>
        <p class="text-xs text-slate-400 mt-0.5">Configure this form field</p>
      </div>
      <button (click)="dialogRef.close()" class="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 transition-colors">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>

    <mat-dialog-content class="!px-5 !pt-4 !pb-2 !max-h-[65vh]">
      <form [formGroup]="form" class="flex flex-col gap-4">

        <!-- Field Type grid -->
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Field Type</p>
          <div class="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            <button *ngFor="let ft of fieldTypes" type="button"
              (click)="form.patchValue({ fieldType: ft.type })"
              class="type-btn"
              [class.active]="form.value.fieldType === ft.type">
              <span class="material-icons-outlined" style="font-size:17px">{{ ft.icon }}</span>
              {{ ft.label }}
            </button>
          </div>
        </div>

        <!-- Label + Order row -->
        <div class="grid grid-cols-[1fr_80px] gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-500">Label <span class="text-red-400">*</span></label>
            <input formControlName="label" type="text" placeholder="e.g. Full Name" class="field-input"
              [style.border-color]="form.get('label')?.invalid && form.get('label')?.touched ? '#f87171' : ''" />
            <span *ngIf="form.get('label')?.invalid && form.get('label')?.touched" class="text-[10px] text-red-500 mt-0.5">Label is required</span>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-500">Order</label>
            <input formControlName="displayOrder" type="number" min="1" class="field-input" />
          </div>
        </div>

        <!-- Placeholder -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-500">Placeholder</label>
          <input formControlName="placeholder" type="text" placeholder="e.g. Enter your full name" class="field-input" />
        </div>

        <!-- Help Text -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-500">Help Text</label>
          <input formControlName="helpText" type="text" placeholder="Short hint shown below the field" class="field-input" />
        </div>

        <!-- Options (DROPDOWN / CHECKBOX / RADIO) -->
        <div *ngIf="usesOptions(form.value.fieldType)" class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-slate-500">Options</label>
          <div *ngFor="let opt of optionsList; let i = index; trackBy: trackByIndex" class="flex items-center gap-2">
            <span class="material-icons-outlined text-slate-400" style="font-size:16px">{{ optionIcon(form.value.fieldType) }}</span>
            <input
              type="text"
              [value]="opt"
              (input)="updateOption(i, $event)"
              [placeholder]="'Option ' + (i + 1)"
              class="field-input flex-1"
            />
            <button type="button" (click)="removeOption(i)"
              class="rounded-full p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              [disabled]="optionsList.length === 1">
              <span class="material-icons-outlined" style="font-size:16px">close</span>
            </button>
          </div>
          <button type="button" (click)="addOption()"
            class="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 mt-0.5 self-start">
            <span class="material-icons-outlined" style="font-size:15px">add</span>
            Add option
          </button>
          <span *ngIf="showOptionsError" class="text-[10px] text-red-500 mt-0.5">At least one valid option is required</span>
        </div>

        <!-- Tree Editor (TREE_SELECT) -->
        <div *ngIf="usesTree(form.value.fieldType)" class="flex flex-col gap-3">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tree Structure
            <span class="text-slate-400 font-normal normal-case ml-1">(Routes → Stops)</span>
          </label>

          <div *ngFor="let node of treeNodes; let ri = index; trackBy: trackByIndex"
               class="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <!-- Route label row -->
            <div class="flex items-center gap-2 mb-2">
              <span class="material-icons-outlined text-indigo-400" style="font-size:16px">account_tree</span>
              <input type="text" [value]="node.label" (input)="updateRouteLabel(ri, $event)"
                placeholder="Route / Category name" class="field-input flex-1"
                style="background:#fff;border-color:#e0e7ff;" />
              <button type="button" (click)="removeRoute(ri)"
                class="rounded-full p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                [disabled]="treeNodes.length === 1">
                <span class="material-icons-outlined" style="font-size:16px">delete</span>
              </button>
            </div>
            <!-- Stops -->
            <div class="ml-6 flex flex-col gap-1.5">
              <div *ngFor="let stop of node.children; let si = index; trackBy: trackByIndex" class="flex items-center gap-2">
                <span class="material-icons-outlined text-slate-400" style="font-size:13px">subdirectory_arrow_right</span>
                <input type="text" [value]="stop" (input)="updateStop(ri, si, $event)"
                  placeholder="Stop name" class="field-input flex-1" style="font-size:0.8rem;" />
                <button type="button" (click)="removeStop(ri, si)"
                  class="rounded-full p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  [disabled]="node.children.length === 1">
                  <span class="material-icons-outlined" style="font-size:15px">close</span>
                </button>
              </div>
              <button type="button" (click)="addStop(ri)"
                class="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 mt-1 self-start">
                <span class="material-icons-outlined" style="font-size:14px">add</span>
                Add Stop
              </button>
            </div>
          </div>

          <button type="button" (click)="addRoute()"
            class="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-colors self-start">
            <span class="material-icons-outlined" style="font-size:16px">add</span>
            Add Route
          </button>
          <span *ngIf="showTreeError" class="text-[10px] text-red-500 mt-0.5">At least one valid route is required</span>
        </div>

        <!-- Required toggle -->
        <label class="toggle-wrap">
          <div class="toggle-track" [class.on]="form.value.required">
            <div class="toggle-thumb"></div>
          </div>
          <input type="checkbox" formControlName="required" class="sr-only" />
          <span class="text-xs font-semibold text-slate-600">Required field</span>
        </label>

      </form>
    </mat-dialog-content>

    <!-- Footer actions -->
    <div class="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
      <button (click)="dialogRef.close()"
        class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
        Cancel
      </button>
      <button (click)="save()"
        class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
        {{ data.field ? 'Save Changes' : 'Add Field' }}
      </button>
    </div>
  `
})
export class FieldConfigDialogComponent {
  readonly data = inject<FieldDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<FieldConfigDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly fieldTypes: { type: FieldType; label: string; icon: string }[] = [
    { type: 'TEXTBOX',      label: 'Text',       icon: 'short_text' },
    { type: 'TEXTAREA',     label: 'Paragraph',  icon: 'subject' },
    { type: 'DROPDOWN',     label: 'Dropdown',   icon: 'arrow_drop_down_circle' },
    { type: 'RADIO_BUTTON', label: 'Radio',      icon: 'radio_button_checked' },
    { type: 'CHECKBOX',     label: 'Checkbox',   icon: 'check_box' },
    { type: 'DATE_PICKER',  label: 'Date',       icon: 'calendar_today' },
    { type: 'TIME_PICKER',  label: 'Time',       icon: 'schedule' },
    { type: 'NUMBER',       label: 'Number',     icon: 'pin' },
    { type: 'EMAIL',        label: 'Email',      icon: 'alternate_email' },
    { type: 'PHONE',        label: 'Phone',      icon: 'phone' },
    { type: 'FILE_UPLOAD',  label: 'File',       icon: 'attach_file' },
    { type: 'SIGNATURE',    label: 'Signature',  icon: 'draw' },
    { type: 'TREE_SELECT',  label: 'Tree Select',icon: 'account_tree' },
  ];

  readonly form = this.fb.group({
    fieldType:    [this.data.field?.fieldType    ?? 'TEXTBOX', Validators.required],
    label:        [this.data.field?.label        ?? '',        Validators.required],
    placeholder:  [this.data.field?.placeholder  ?? ''],
    helpText:     [this.data.field?.helpText     ?? ''],
    displayOrder: [this.data.field?.displayOrder ?? this.data.displayOrder, [Validators.required, Validators.min(1)]],
    required:     [this.data.field?.required     ?? false],
  });

  optionsList: string[] = this.data.field?.options?.length
    ? [...this.data.field.options]
    : [''];

  treeNodes: { label: string; children: string[] }[] = (() => {
    if (this.data.field?.fieldType === 'TREE_SELECT' && this.data.field.validationJson) {
      try { return JSON.parse(this.data.field.validationJson); } catch { /* fall through */ }
    }
    return [{ label: 'Route A', children: ['Stop 1', 'Stop 2'] }];
  })();

  usesOptions(type: FieldType | null | undefined): boolean {
    return type === 'DROPDOWN' || type === 'CHECKBOX' || type === 'RADIO_BUTTON';
  }

  showOptionsError = false;
  showTreeError = false;

  trackByIndex(index: number): number {
    return index;
  }

  usesTree(type: FieldType | null | undefined): boolean {
    return type === 'TREE_SELECT';
  }

  optionIcon(type: FieldType | null | undefined): string {
    if (type === 'RADIO_BUTTON') return 'radio_button_unchecked';
    if (type === 'CHECKBOX') return 'check_box_outline_blank';
    return 'list';
  }

  addOption(): void { this.optionsList.push(''); }

  removeOption(i: number): void {
    if (this.optionsList.length > 1) this.optionsList.splice(i, 1);
  }

  updateOption(i: number, event: Event): void {
    this.optionsList[i] = (event.target as HTMLInputElement).value;
  }

  // ── Tree methods ──────────────────────────────────────
  addRoute(): void {
    this.treeNodes = [...this.treeNodes, { label: 'New Route', children: ['Stop 1'] }];
  }

  removeRoute(ri: number): void {
    if (this.treeNodes.length > 1) this.treeNodes = this.treeNodes.filter((_, i) => i !== ri);
  }

  updateRouteLabel(ri: number, event: Event): void {
    this.treeNodes[ri].label = (event.target as HTMLInputElement).value;
  }

  addStop(ri: number): void {
    this.treeNodes[ri].children = [...this.treeNodes[ri].children, ''];
  }

  removeStop(ri: number, si: number): void {
    if (this.treeNodes[ri].children.length > 1)
      this.treeNodes[ri].children = this.treeNodes[ri].children.filter((_, i) => i !== si);
  }

  updateStop(ri: number, si: number, event: Event): void {
    this.treeNodes[ri].children[si] = (event.target as HTMLInputElement).value;
  }

  save(): void {
    this.showOptionsError = false;
    this.showTreeError = false;
    let hasCustomError = false;

    if (this.usesOptions(this.form.value.fieldType)) {
      const validOptions = this.optionsList.map(s => s.trim()).filter(Boolean);
      if (validOptions.length === 0) {
        this.showOptionsError = true;
        hasCustomError = true;
      }
    }

    if (this.usesTree(this.form.value.fieldType)) {
      const validRoutes = this.treeNodes.filter(n => n.label.trim() !== '');
      if (validRoutes.length === 0) {
        this.showTreeError = true;
        hasCustomError = true;
      }
    }

    if (this.form.invalid || hasCustomError) {
      this.form.markAllAsTouched();
      return;
    }
    
    const v = this.form.getRawValue();
    const isTree = v.fieldType === 'TREE_SELECT';
    const field: FacilityField = {
      ...(this.data.field?.fieldId ? { fieldId: this.data.field.fieldId } : {}),
      label:          (v.label        ?? '').trim(),
      fieldType:      v.fieldType     ?? 'TEXTBOX',
      placeholder:    (v.placeholder  ?? '').trim() || undefined,
      helpText:       (v.helpText     ?? '').trim() || undefined,
      required:       Boolean(v.required),
      displayOrder:   Number(v.displayOrder),
      options:        this.usesOptions(v.fieldType) ? this.optionsList.map(s => s.trim()).filter(Boolean) : [],
      validationJson: isTree
        ? JSON.stringify(this.treeNodes.map(n => ({ label: n.label.trim(), children: n.children.map(c => c.trim()).filter(Boolean) })))
        : undefined,
    };
    this.dialogRef.close(field);
  }
}
