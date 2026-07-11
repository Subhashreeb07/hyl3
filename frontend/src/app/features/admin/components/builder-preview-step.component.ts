import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FacilityField } from '../../../core/models/specification.models';

@Component({
  selector: 'app-builder-preview-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid gap-5 py-4 xl:grid-cols-2">
      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 class="text-lg font-semibold text-slate-900">Editable Employee Form Preview</h3>
        <p class="text-sm text-slate-500">Try the fields directly before publishing.</p>
        <div class="mt-4 space-y-3">
          <div *ngFor="let field of fields" class="rounded-lg bg-slate-50 p-3 text-sm">
            <label class="mb-1 block font-semibold text-slate-800">{{ field.label }}</label>
            <ng-container [ngSwitch]="field.fieldType">
              <select *ngSwitchCase="'DROPDOWN'" class="admin-preview-input">
                <option *ngFor="let option of field.options || []">{{ option }}</option>
              </select>

              <div *ngSwitchCase="'CHECKBOX'" class="space-y-1 rounded-lg border border-slate-200 bg-white p-2 text-xs">
                <label class="block" *ngFor="let option of field.options || []"><input type="checkbox" /> {{ option }}</label>
              </div>

              <div *ngSwitchCase="'RADIO_BUTTON'" class="space-y-1 rounded-lg border border-slate-200 bg-white p-2 text-xs">
                <label class="block" *ngFor="let option of field.options || []"><input type="radio" [name]="field.label" /> {{ option }}</label>
              </div>

              <textarea *ngSwitchCase="'TEXTAREA'" class="admin-preview-input" rows="2" [placeholder]="field.placeholder || ''"></textarea>
              <input *ngSwitchCase="'DATE_PICKER'" class="admin-preview-input" type="date" />
              <input *ngSwitchCase="'TIME_PICKER'" class="admin-preview-input" type="time" />
              <input *ngSwitchCase="'NUMBER'" class="admin-preview-input" type="number" [placeholder]="field.placeholder || ''" />
              <input *ngSwitchCase="'EMAIL'" class="admin-preview-input" type="email" [placeholder]="field.placeholder || ''" />
              <input *ngSwitchCase="'PHONE'" class="admin-preview-input" type="tel" [placeholder]="field.placeholder || ''" />
              <input *ngSwitchDefault class="admin-preview-input" [placeholder]="field.placeholder || ''" />
            </ng-container>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 class="text-lg font-semibold text-slate-900">Specification JSON</h3>
        <p class="text-sm text-slate-500">Edit JSON and apply it to update the preview/form.</p>
        <textarea
          class="json-editor mt-4"
          [value]="editableJson"
          (input)="onJsonEdit($event)"
        ></textarea>
        <div class="mt-3 flex justify-end">
          <button type="button" class="satori-secondary" (click)="applyEditedJson()">Apply JSON</button>
        </div>
      </article>
    </section>
  `
  ,
  styles: [
    `
      .admin-preview-input {
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 0.55rem;
        padding: 0.45rem 0.55rem;
        font-size: 0.85rem;
        background: #fff;
      }

      .json-editor {
        width: 100%;
        min-height: 460px;
        border: 1px solid #1e293b;
        border-radius: 0.75rem;
        padding: 0.75rem;
        background: #0f172a;
        color: #e2e8f0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size: 0.78rem;
        line-height: 1.35;
      }
    `
  ]
})
export class BuilderPreviewStepComponent implements OnChanges {
  @Input({ required: true }) fields: FacilityField[] = [];
  @Input() generatedJson = '';
  @Output() applyJson = new EventEmitter<string>();

  editableJson = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['generatedJson']) {
      this.editableJson = this.generatedJson;
    }
  }

  onJsonEdit(event: Event): void {
    this.editableJson = (event.target as HTMLTextAreaElement).value;
  }

  applyEditedJson(): void {
    this.applyJson.emit(this.editableJson);
  }
}
