import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FacilityField, FieldType } from '../../../core/models/specification.models';

@Component({
  selector: 'app-builder-field-list',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .field-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 0;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
    }
    .field-card:hover {
      box-shadow: 0 4px 20px rgba(99,102,241,0.10);
      border-color: #c7d2fe;
      transform: translateY(-1px);
    }
    .field-card.selected {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12), 0 4px 20px rgba(99,102,241,0.12);
    }

    .add-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border-radius: 10px;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      padding: 0.6rem 0.4rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
      white-space: nowrap;
      text-align: center;
    }
    .add-btn:hover {
      background: #eef2ff;
      border-color: #a5b4fc;
      color: #4f46e5;
      box-shadow: 0 2px 8px rgba(99,102,241,0.10);
    }

    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 8px;
      border: none; background: transparent;
      color: #94a3b8; cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .action-btn:hover { background: #f1f5f9; color: #334155; }
    .action-btn.danger:hover { background: #fef2f2; color: #ef4444; }
  `],
  template: `
    <div class="flex flex-col gap-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-800">Form Fields</h3>
          <p class="text-xs text-slate-400 mt-0.5">{{ fields.length }} field{{ fields.length !== 1 ? 's' : '' }} added</p>
        </div>
      </div>

      <!-- Quick-add grid -->
      <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p class="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Add</p>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button *ngFor="let ft of quickFieldTypes" class="add-btn" (click)="addWithType.emit(ft.type)">
            <span class="material-icons-outlined" style="font-size:20px">{{ ft.icon }}</span>
            {{ ft.label }}
          </button>
        </div>
      </div>

      <!-- Field cards -->
      <div class="flex flex-col gap-3">
        <article *ngFor="let field of fields; let i = index"
                 class="field-card"
                 [class.selected]="activeFieldIndex === i"
                 (click)="activeFieldIndex = i">

          <!-- Card header bar -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100"
               [style.background]="typeColor(field.fieldType).bg">
            <span class="material-icons-outlined" style="font-size:18px" [style.color]="typeColor(field.fieldType).icon">{{ iconFor(field.fieldType) }}</span>
            <span class="flex-1 text-[10px] font-bold uppercase tracking-wider" [style.color]="typeColor(field.fieldType).label">{{ labelFor(field.fieldType) }}</span>
            <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" [style.background]="typeColor(field.fieldType).badge" [style.color]="typeColor(field.fieldType).icon">#{{ field.displayOrder }}</span>
          </div>

          <!-- Card body -->
          <div class="px-4 py-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <p class="text-sm font-semibold text-slate-800">
                  {{ field.label }}<span *ngIf="field.required" class="ml-1 text-rose-500">*</span>
                </p>
                <p class="mt-0.5 text-xs text-slate-400" *ngIf="field.helpText">{{ field.helpText }}</p>

                <!-- Options preview -->
                <div *ngIf="usesOptions(field.fieldType)" class="mt-2.5 flex flex-col gap-1.5">
                  <div *ngFor="let opt of (field.options?.length ? field.options : ['Option 1'])"
                       class="flex items-center gap-2 text-xs text-slate-600">
                    <span class="material-icons-outlined text-slate-300" style="font-size:15px">
                      {{ field.fieldType === 'CHECKBOX' ? 'check_box_outline_blank' : field.fieldType === 'RADIO_BUTTON' ? 'radio_button_unchecked' : 'arrow_drop_down_circle' }}
                    </span>
                    {{ opt }}
                  </div>
                </div>

                <!-- Text-style preview -->
                <div *ngIf="!usesOptions(field.fieldType)"
                     class="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400">
                  {{ labelFor(field.fieldType) }}...
                </div>
              </div>
            </div>
          </div>

          <!-- Action bar (shown on select) -->
          <div *ngIf="activeFieldIndex === i"
               class="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2">
            <div class="flex items-center gap-1">
              <button class="action-btn" title="Move up" (click)="move.emit({ index: i, direction: -1 }); $event.stopPropagation()">
                <span class="material-icons-outlined" style="font-size:18px">arrow_upward</span>
              </button>
              <button class="action-btn" title="Move down" (click)="move.emit({ index: i, direction: 1 }); $event.stopPropagation()">
                <span class="material-icons-outlined" style="font-size:18px">arrow_downward</span>
              </button>
            </div>
            <div class="flex items-center gap-1">
              <button class="action-btn" title="Edit" (click)="edit.emit(field); $event.stopPropagation()">
                <span class="material-icons-outlined" style="font-size:18px">edit</span>
              </button>
              <button class="action-btn" title="Duplicate" (click)="duplicate.emit(field); $event.stopPropagation()">
                <span class="material-icons-outlined" style="font-size:18px">content_copy</span>
              </button>
              <button class="action-btn danger" title="Delete" (click)="remove.emit(field); $event.stopPropagation()">
                <span class="material-icons-outlined" style="font-size:18px">delete_outline</span>
              </button>
            </div>
          </div>
        </article>

        <!-- Empty state -->
        <div *ngIf="fields.length === 0"
             class="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-14 text-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
            <span class="material-icons-outlined text-indigo-500" style="font-size:28px">dynamic_form</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-700">No fields added yet</p>
            <p class="mt-0.5 text-xs text-slate-400">Use the quick-add buttons above to build your form</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BuilderFieldListComponent {
  readonly quickFieldTypes: { type: FieldType; label: string; icon: string }[] = [
    { type: 'TEXTBOX',      label: 'Short Text',  icon: 'short_text' },
    { type: 'TEXTAREA',     label: 'Paragraph',   icon: 'subject' },
    { type: 'RADIO_BUTTON', label: 'Choice',      icon: 'radio_button_checked' },
    { type: 'CHECKBOX',     label: 'Checkboxes',  icon: 'check_box' },
    { type: 'DROPDOWN',     label: 'Dropdown',    icon: 'arrow_drop_down_circle' },
    { type: 'FILE_UPLOAD',  label: 'File',        icon: 'cloud_upload' },
    { type: 'DATE_PICKER',  label: 'Date',        icon: 'event' },
    { type: 'TIME_PICKER',  label: 'Time',        icon: 'schedule' },
    { type: 'NUMBER',       label: 'Number',      icon: 'pin' },
    { type: 'EMAIL',        label: 'Email',       icon: 'alternate_email' },
    { type: 'PHONE',        label: 'Phone',       icon: 'phone' },
    { type: 'TREE_SELECT',  label: 'Tree Select', icon: 'account_tree' },
  ];

  private readonly typeMap: Record<string, { label: string; icon: string }> = Object.fromEntries(
    this.quickFieldTypes.map(ft => [ft.type, { label: ft.label, icon: ft.icon }])
  );

  @Input({ required: true }) fields: FacilityField[] = [];
  @Output() add         = new EventEmitter<void>();
  @Output() edit        = new EventEmitter<FacilityField>();
  @Output() addWithType = new EventEmitter<FieldType>();
  @Output() duplicate   = new EventEmitter<FacilityField>();
  @Output() remove      = new EventEmitter<FacilityField>();
  @Output() move        = new EventEmitter<{ index: number; direction: number }>();

  activeFieldIndex: number = -1;

  iconFor(type: string): string  { return this.typeMap[type]?.icon  ?? 'input'; }
  labelFor(type: string): string { return this.typeMap[type]?.label ?? type; }

  usesOptions(type: FieldType): boolean {
    return type === 'DROPDOWN' || type === 'CHECKBOX' || type === 'RADIO_BUTTON';
  }

  typeColor(type: string): { bg: string; icon: string; label: string; badge: string } {
    const map: Record<string, { bg: string; icon: string; label: string; badge: string }> = {
      TEXTBOX:      { bg: '#f0f7ff', icon: '#3b82f6', label: '#1d4ed8', badge: '#dbeafe' },
      TEXTAREA:     { bg: '#f0f7ff', icon: '#3b82f6', label: '#1d4ed8', badge: '#dbeafe' },
      EMAIL:        { bg: '#f0f7ff', icon: '#3b82f6', label: '#1d4ed8', badge: '#dbeafe' },
      PHONE:        { bg: '#f0f7ff', icon: '#3b82f6', label: '#1d4ed8', badge: '#dbeafe' },
      NUMBER:       { bg: '#f0f7ff', icon: '#3b82f6', label: '#1d4ed8', badge: '#dbeafe' },
      RADIO_BUTTON: { bg: '#fdf4ff', icon: '#a855f7', label: '#7e22ce', badge: '#f3e8ff' },
      CHECKBOX:     { bg: '#fdf4ff', icon: '#a855f7', label: '#7e22ce', badge: '#f3e8ff' },
      DROPDOWN:     { bg: '#fdf4ff', icon: '#a855f7', label: '#7e22ce', badge: '#f3e8ff' },
      DATE_PICKER:  { bg: '#f0fdf4', icon: '#16a34a', label: '#15803d', badge: '#dcfce7' },
      TIME_PICKER:  { bg: '#f0fdf4', icon: '#16a34a', label: '#15803d', badge: '#dcfce7' },
      FILE_UPLOAD:  { bg: '#fffbeb', icon: '#d97706', label: '#b45309', badge: '#fef3c7' },
      TREE_SELECT:  { bg: '#fff7ed', icon: '#ea580c', label: '#c2410c', badge: '#ffedd5' },
      QR_SCANNER:   { bg: '#fff7ed', icon: '#ea580c', label: '#c2410c', badge: '#ffedd5' },
    };
    return map[type] ?? { bg: '#f8fafc', icon: '#64748b', label: '#475569', badge: '#e2e8f0' };
  }
}
