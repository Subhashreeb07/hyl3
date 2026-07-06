import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FacilityField, FieldType } from '../../../core/models/specification.models';

@Component({
  selector: 'app-builder-field-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900">Fields</h3>
        <button class="satori-primary" (click)="add.emit()">Add Field</button>
      </div>

      <article *ngFor="let field of fields; let i = index" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-semibold text-slate-900">{{ field.label }}</p>
            <p class="text-xs uppercase tracking-[0.12em] text-slate-500">{{ field.fieldType }} · Order {{ field.displayOrder }}</p>
            <p class="text-xs text-slate-500" *ngIf="field.helpText">{{ field.helpText }}</p>
          </div>
          <div class="flex flex-wrap gap-2 text-xs">
            <button class="satori-mini" (click)="move.emit({ index: i, direction: -1 })">Move Up</button>
            <button class="satori-mini" (click)="move.emit({ index: i, direction: 1 })">Move Down</button>
            <button class="satori-mini" (click)="edit.emit(field)">Edit</button>
            <button class="satori-mini" (click)="duplicate.emit(field)">Duplicate</button>
            <button class="satori-mini-danger" (click)="remove.emit(field)">Delete</button>
          </div>
        </div>

        <div *ngIf="usesOptions(field.fieldType)" class="mt-2 flex flex-wrap gap-2 text-xs">
          <span class="rounded-full bg-white px-2 py-1" *ngFor="let option of field.options || []">{{ option }}</span>
        </div>
      </article>

      <p *ngIf="fields.length === 0" class="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No fields yet. Click Add Field to start building the dynamic form.</p>
    </div>
  `,
  styles: [
    `
      .satori-mini,
      .satori-mini-danger {
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        padding: 0.2rem 0.6rem;
        background: #fff;
      }

      .satori-mini-danger {
        border-color: #fecaca;
        color: #b91c1c;
      }
    `
  ]
})
export class BuilderFieldListComponent {
  @Input({ required: true }) fields: FacilityField[] = [];

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<FacilityField>();
  @Output() duplicate = new EventEmitter<FacilityField>();
  @Output() remove = new EventEmitter<FacilityField>();
  @Output() move = new EventEmitter<{ index: number; direction: number }>();

  usesOptions(type: FieldType): boolean {
    return type === 'DROPDOWN' || type === 'CHECKBOX' || type === 'RADIO_BUTTON';
  }
}
