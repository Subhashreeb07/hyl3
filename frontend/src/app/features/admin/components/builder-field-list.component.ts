import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FacilityField, FieldType } from '../../../core/models/specification.models';

@Component({
  selector: 'app-builder-field-list',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      border-radius: 4px; border: 1px solid transparent;
      background: #fff; padding: 0.5rem 0.8rem;
      font-size: 0.8rem; font-weight: 500; color: #3c4043;
      cursor: pointer; transition: background 0.2s, box-shadow 0.2s; white-space: nowrap;
      box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
    }
    .chip:hover { background: #f8f9fa; box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15); }
    
    .gform-card {
      background: #fff;
      border: 1px solid #dadce0;
      border-radius: 8px;
      padding: 1.5rem;
      position: relative;
      transition: box-shadow 0.2s;
      cursor: pointer;
    }
    .gform-card:hover {
      box-shadow: 0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12);
    }
    .gform-card.active-card {
      border-left: 6px solid #4285f4;
      box-shadow: 0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12);
    }
    .mini {
      border-radius: 4px; border: none; padding: 8px; background: transparent; font-size: 0.8rem; font-weight: 500; color: #5f6368; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center;
    }
    .mini:hover { background: rgba(95,99,104,0.08); color: #202124; }
    
    .mini-icon-btn {
      width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; color: #5f6368; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center;
    }
    .mini-icon-btn:hover { background: rgba(95,99,104,0.08); color: #202124; }
    .mini-icon-btn.danger:hover { background: rgba(217,48,37,0.08); color: #d93025; }

    .gform-input {
      border: none;
      border-bottom: 1px solid #e0e0e0;
      border-radius: 0;
      background: #f1f3f4;
      padding: 12px 16px;
      font-size: 1rem;
      color: #202124;
      width: 100%;
      pointer-events: none; /* Disabled for preview */
    }
    .gform-label {
      font-size: 1rem;
      font-weight: 500;
      color: #202124;
      margin-bottom: 1rem;
      display: block;
    }
  `],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 class="text-xl font-normal text-[#202124]">Form Questions</h3>
          <p class="text-sm text-[#5f6368]">Build your custom form</p>
        </div>
      </div>

      <!-- Quick-add chips -->
      <div class="p-1 mb-6">
        <div class="flex flex-wrap gap-3">
          <button *ngFor="let ft of quickFieldTypes" class="chip" (click)="addWithType.emit(ft.type)">
            <span class="material-icons-outlined text-[#5f6368]" style="font-size:18px">{{ ft.icon }}</span>
            {{ ft.label }}
          </button>
        </div>
      </div>

      <!-- Field rows -->
      <article *ngFor="let field of fields; let i = index"
               class="gform-card"
               [class.active-card]="activeFieldIndex === i"
               (click)="activeFieldIndex = i">
        
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="gform-label">
              {{ field.label }}<span *ngIf="field.required" class="text-[#d93025] ml-1">*</span>
            </div>
            
            <p class="text-sm text-[#5f6368] mb-3" *ngIf="field.helpText">{{ field.helpText }}</p>

            <!-- Mock Input based on type -->
            <div *ngIf="usesOptions(field.fieldType); else textInput">
              <div class="flex flex-col gap-2 mt-2">
                <div *ngFor="let opt of (field.options?.length ? field.options : ['Option 1'])" class="flex items-center gap-3 text-sm text-[#202124]">
                  <span class="material-icons-outlined text-[#bdc1c6]" style="font-size: 20px;">
                    {{ field.fieldType === 'CHECKBOX' ? 'check_box_outline_blank' : (field.fieldType === 'RADIO_BUTTON' ? 'radio_button_unchecked' : 'arrow_drop_down_circle') }}
                  </span>
                  {{ opt }}
                </div>
              </div>
            </div>
            <ng-template #textInput>
              <div class="gform-input">
                {{ labelFor(field.fieldType) }}
              </div>
            </ng-template>

          </div>
          
          <div class="flex flex-col items-center gap-1 shrink-0">
             <div class="text-[10px] font-medium uppercase tracking-wider text-[#bdc1c6] mb-2">#{{ field.displayOrder }}</div>
             <span class="material-icons-outlined text-[#bdc1c6] mb-4" style="font-size:24px">{{ iconFor(field.fieldType) }}</span>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-[#dadce0] flex justify-end gap-1" *ngIf="activeFieldIndex === i">
          <button class="mini-icon-btn" title="Edit" (click)="edit.emit(field); $event.stopPropagation()">
            <span class="material-icons-outlined" style="font-size: 20px;">edit</span>
          </button>
          <button class="mini-icon-btn" title="Duplicate" (click)="duplicate.emit(field); $event.stopPropagation()">
            <span class="material-icons-outlined" style="font-size: 20px;">content_copy</span>
          </button>
          <button class="mini-icon-btn danger" title="Delete" (click)="remove.emit(field); $event.stopPropagation()">
            <span class="material-icons-outlined" style="font-size: 20px;">delete</span>
          </button>
        </div>
      </article>

      <div *ngIf="fields.length === 0"
           class="flex flex-col items-center justify-center gap-3 rounded-lg border border-[#dadce0] bg-white py-12 text-center" style="border-top: 8px solid #673ab7;">
        <span class="material-icons-outlined text-[#673ab7]" style="font-size:40px">post_add</span>
        <span class="text-base text-[#202124]">No questions added yet</span>
        <span class="text-sm text-[#5f6368]">Use the buttons above to add a question</span>
      </div>
    </div>
  `
})
export class BuilderFieldListComponent {
  readonly quickFieldTypes: { type: FieldType; label: string; icon: string }[] = [
    { type: 'TEXTBOX',      label: 'Short answer', icon: 'short_text' },
    { type: 'TEXTAREA',     label: 'Paragraph',    icon: 'subject' },
    { type: 'RADIO_BUTTON', label: 'Multiple choice', icon: 'radio_button_checked' },
    { type: 'CHECKBOX',     label: 'Checkboxes',   icon: 'check_box' },
    { type: 'DROPDOWN',     label: 'Dropdown',     icon: 'arrow_drop_down_circle' },
    { type: 'FILE_UPLOAD',  label: 'File upload',  icon: 'cloud_upload' },
    { type: 'DATE_PICKER',  label: 'Date',         icon: 'event' },
    { type: 'TIME_PICKER',  label: 'Time',         icon: 'schedule' },
    { type: 'NUMBER',       label: 'Number',       icon: 'pin' },
    { type: 'EMAIL',        label: 'Email',        icon: 'alternate_email' },
    { type: 'PHONE',        label: 'Phone',        icon: 'phone' },
    { type: 'SIGNATURE',    label: 'Signature',    icon: 'draw' },
    { type: 'TREE_SELECT',  label: 'Tree Select',  icon: 'account_tree' },
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

  activeFieldIndex: number = -1;

  iconFor(type: string): string  { return this.typeMap[type]?.icon  ?? 'input'; }
  labelFor(type: string): string { return this.typeMap[type]?.label ?? type; }

  usesOptions(type: FieldType): boolean {
    return type === 'DROPDOWN' || type === 'CHECKBOX' || type === 'RADIO_BUTTON';
  }
}

