import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FacilityField, FieldType } from '../../../core/models/specification.models';

@Component({
  selector: 'app-builder-field-list',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      border-radius: 999px; border: 1.5px solid #e2e8f0;
      background: #f8fafc; padding: 0.28rem 0.7rem;
      font-size: 0.75rem; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    .chip:hover { border-color: #818cf8; background: #eef2ff; color: #4f46e5; }
    .mini { border-radius: 999px; border: 1px solid #e2e8f0; padding: 0.2rem 0.65rem; background: #fff; font-size: 0.75rem; cursor: pointer; transition: all 0.12s; }
    .mini:hover { border-color: #94a3b8; background: #f1f5f9; }
    .mini-danger { border-radius: 999px; border: 1px solid #fecaca; padding: 0.2rem 0.65rem; background: #fff; font-size: 0.75rem; color: #b91c1c; cursor: pointer; transition: all 0.12s; }
    .mini-danger:hover { background: #fef2f2; }
  `],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-base font-bold text-slate-900">Form Fields</h3>
          <p class="text-xs text-slate-400">Build the employee form step by step.</p>
        </div>
        <button class="satori-primary text-sm" (click)="add.emit()">
          <span class="material-icons-outlined" style="font-size:15px;vertical-align:-2px">add</span>
          Custom Field
        </button>
      </div>

      <!-- Quick-add chips -->
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Quick Add</p>
        <div class="flex flex-wrap gap-1.5">
          <button *ngFor="let ft of quickFieldTypes" class="chip" (click)="addWithType.emit(ft.type)">
            <span class="material-icons-outlined" style="font-size:13px">{{ ft.icon }}</span>
            {{ ft.label }}
          </button>
        </div>
      </div>

      <!-- Field rows -->
      <article *ngFor="let field of fields; let i = index"
               class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="flex items-start gap-2.5">
            <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <span class="material-icons-outlined" style="font-size:16px">{{ iconFor(field.fieldType) }}</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ field.label }}</p>
              <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {{ labelFor(field.fieldType) }} · #{{ field.displayOrder }}
                <span *ngIf="field.required" class="ml-1 text-rose-500">required</span>
              </p>
              <p class="mt-0.5 text-xs text-slate-400" *ngIf="field.helpText">{{ field.helpText }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button class="mini" (click)="move.emit({ index: i, direction: -1 })">↑</button>
            <button class="mini" (click)="move.emit({ index: i, direction: 1 })">↓</button>
            <button class="mini" (click)="edit.emit(field)">Edit</button>
            <button class="mini" (click)="duplicate.emit(field)">Copy</button>
            <button class="mini-danger" (click)="remove.emit(field)">Delete</button>
          </div>
        </div>
        <div *ngIf="usesOptions(field.fieldType) && (field.options?.length ?? 0) > 0"
             class="mt-2 flex flex-wrap gap-1.5">
          <span *ngFor="let opt of field.options"
                class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
            {{ opt }}
          </span>
        </div>
      </article>

      <p *ngIf="fields.length === 0"
         class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
        <span class="material-icons-outlined text-slate-300" style="font-size:32px">dynamic_form</span>
        <span class="text-sm text-slate-400">No fields yet — use Quick Add or Custom Field</span>
      </p>
    </div>
  `
})
export class BuilderFieldListComponent {
  readonly quickFieldTypes: { type: FieldType; label: string; icon: string }[] = [
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

  private readonly typeMap: Record<string, { label: string; icon: string }> = Object.fromEntries(
    this.quickFieldTypes.map(ft => [ft.type, { label: ft.label, icon: ft.icon }])
  );

  @Input({ required: true }) fields: FacilityField[] = [];

  @Output() add        = new EventEmitter<void>();
  @Output() edit       = new EventEmitter<FacilityField>();
  @Output() addWithType = new EventEmitter<FieldType>();
  @Output() duplicate  = new EventEmitter<FacilityField>();
  @Output() remove     = new EventEmitter<FacilityField>();
  @Output() move       = new EventEmitter<{ index: number; direction: number }>();

  iconFor(type: string): string  { return this.typeMap[type]?.icon  ?? 'input'; }
  labelFor(type: string): string { return this.typeMap[type]?.label ?? type; }

  usesOptions(type: FieldType): boolean {
    return type === 'DROPDOWN' || type === 'CHECKBOX' || type === 'RADIO_BUTTON';
  }
}
