import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SpecificationField } from '../../core/models/employee-flow.models';

type RenderKind = 'input' | 'textarea' | 'dropdown' | 'radio' | 'checkbox' | 'file' | 'signature' | 'tree-select' | 'unsupported';

@Component({
  selector: 'app-dynamic-field-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    .tree-node-row {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
    }
    .tree-node-row:hover { background: #f8fafc; }
    .tree-node-row.expanded { background: #eef2ff; }
    .tree-leaf-row {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 14px 9px 36px; cursor: pointer; border-bottom: 1px solid #f8fafc;
      transition: background 0.15s; font-size: 0.875rem; color: #475569;
    }
    .tree-leaf-row:hover { background: #f0f7ff; }
    .tree-leaf-row.selected { background: #eef2ff; color: #4338ca; font-weight: 600; }
  `],
  template: `
    <div class="grid gap-2" [formGroup]="form" [ngClass]="{ 'md:col-span-2': isWideField() }">
      <label class="text-sm font-medium text-slate-700">
        {{ field.label }} <span *ngIf="field.required" class="text-rose-600">*</span>
      </label>

      <input
        *ngIf="renderKind() === 'input'"
        [type]="inputType()"
        [formControlName]="controlName"
        [placeholder]="field.placeholder ?? ''"
        class="rounded-xl border px-3 py-2"
        [ngClass]="isInvalid() ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'"
      />

      <textarea
        *ngIf="renderKind() === 'textarea'"
        [formControlName]="controlName"
        [placeholder]="field.placeholder ?? ''"
        class="min-h-28 rounded-xl border px-3 py-2"
        [ngClass]="isInvalid() ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'"
      ></textarea>

      <select
        *ngIf="renderKind() === 'dropdown'"
        [formControlName]="controlName"
        class="rounded-xl border px-3 py-2"
        [ngClass]="isInvalid() ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'"
      >
        <option value="">Select</option>
        <option *ngFor="let option of field.options || []" [value]="option">{{ option }}</option>
      </select>

      <div *ngIf="renderKind() === 'radio'" class="flex flex-wrap gap-3 text-sm">
        <label *ngFor="let option of field.options || []" class="inline-flex items-center gap-2">
          <input type="radio" [formControlName]="controlName" [value]="option" />
          <span>{{ option }}</span>
        </label>
      </div>

      <div *ngIf="renderKind() === 'checkbox'" class="flex flex-wrap gap-3 text-sm">
        <label *ngFor="let option of field.options || []" class="inline-flex items-center gap-2">
          <input type="checkbox" [checked]="isChecked(option)" (change)="onCheckboxChange(option, $event)" />
          <span>{{ option }}</span>
        </label>
      </div>

      <div *ngIf="renderKind() === 'file'" class="grid gap-2">
        <input type="file" (change)="onFileSelected($event)" class="rounded-xl border px-3 py-2" [ngClass]="isInvalid() ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'" />
        <p *ngIf="form.get(controlName)?.value" class="text-xs text-slate-500">Selected: {{ form.get(controlName)?.value }}</p>
      </div>

      <input
        *ngIf="fieldType() === 'QR_SCANNER'"
        type="text"
        [formControlName]="controlName"
        [placeholder]="field.placeholder || 'Scan QR value'"
        class="rounded-xl border px-3 py-2"
        [ngClass]="isInvalid() ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'"
      />

      <div *ngIf="renderKind() === 'signature'" class="grid gap-2">
        <textarea
          [formControlName]="controlName"
          [placeholder]="field.placeholder || 'Provide signature text or encoded signature data'"
          class="min-h-24 rounded-xl border px-3 py-2"
          [ngClass]="isInvalid() ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'"
        ></textarea>
      </div>

      <!-- ── TREE SELECT ────────────────────────────────────────────── -->
      <div *ngIf="renderKind() === 'tree-select'" class="flex flex-col gap-2">

        <!-- Selected badge -->
        <div *ngIf="treeSelected"
             class="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
          <span class="material-icons-outlined text-indigo-500" style="font-size:17px">location_on</span>
          <span class="text-sm font-semibold text-indigo-800">{{ treeSelected }}</span>
          <button type="button" (click)="clearTree()"
            class="ml-auto rounded-full p-0.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <span class="material-icons-outlined" style="font-size:15px">close</span>
          </button>
        </div>

        <!-- Tree list -->
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div *ngFor="let node of treeNodes; let ri = index">

            <!-- Parent / Route row -->
            <div class="tree-node-row" [class.expanded]="expandedNodes.has(ri)"
                 (click)="toggleTreeNode(ri)">
              <span class="material-icons-outlined text-indigo-500" style="font-size:18px">
                {{ expandedNodes.has(ri) ? 'folder_open' : 'folder' }}
              </span>
              <span class="flex-1 text-sm font-semibold text-slate-800">{{ node.label }}</span>
              <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                {{ node.children.length }} stop{{ node.children.length !== 1 ? 's' : '' }}
              </span>
              <span class="material-icons-outlined text-slate-400" style="font-size:16px">
                {{ expandedNodes.has(ri) ? 'expand_less' : 'expand_more' }}
              </span>
            </div>

            <!-- Children / Stops -->
            <div *ngIf="expandedNodes.has(ri)">
              <div *ngFor="let stop of node.children"
                   class="tree-leaf-row"
                   [class.selected]="treeSelected === node.label + ' > ' + stop"
                   (click)="selectTreeLeaf(node.label, stop)">
                <span class="material-icons-outlined" style="font-size:15px"
                  [class.text-indigo-500]="treeSelected === node.label + ' > ' + stop"
                  [class.text-slate-400]="treeSelected !== node.label + ' > ' + stop">
                  location_on
                </span>
                {{ stop }}
                <span *ngIf="treeSelected === node.label + ' > ' + stop"
                      class="material-icons-outlined ml-auto text-indigo-500" style="font-size:16px">check_circle</span>
              </div>
            </div>

          </div>
        </div>

        <p *ngIf="field.helpText" class="text-xs text-slate-500">{{ field.helpText }}</p>
      </div>
      <!-- ─────────────────────────────────────────────────────────── -->

      <p *ngIf="renderKind() === 'unsupported'" class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Unsupported field type {{ field.type }}. Add a new renderer mapping in DynamicFieldRendererComponent.
      </p>

      <p *ngIf="field.validationJson && renderKind() !== 'tree-select'" class="text-[10px] text-slate-400">Validation: {{ field.validationJson }}</p>

      <span *ngIf="isInvalid()" class="text-[11px] text-red-500 font-medium">{{ getErrorMessage() }}</span>
    </div>
  `
})
export class DynamicFieldRendererComponent implements OnInit {
  @Input({ required: true }) field!: SpecificationField;
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) controlName!: string;

  // ── Tree state ───────────────────────────────────────────────────
  treeNodes: { label: string; children: string[] }[] = [];
  expandedNodes = new Set<number>();
  treeSelected = '';

  ngOnInit(): void {
    if (this.fieldType() === 'TREE_SELECT') {
      this.initTreeNodes();
      this.treeSelected = this.form.get(this.controlName)?.value ?? '';
      if (this.treeNodes.length > 0) this.expandedNodes.add(0);
    }
  }

  private initTreeNodes(): void {
    try {
      const json = this.field.validationJson;
      if (json) { this.treeNodes = JSON.parse(json); return; }
    } catch { /* fall through */ }
    this.treeNodes = [
      { label: 'Route A', children: ['Stop 1', 'Stop 2', 'Stop 3'] },
      { label: 'Route B', children: ['Stop X', 'Stop Y'] },
    ];
  }

  toggleTreeNode(ri: number): void {
    this.expandedNodes.has(ri) ? this.expandedNodes.delete(ri) : this.expandedNodes.add(ri);
    this.expandedNodes = new Set(this.expandedNodes);
  }

  selectTreeLeaf(route: string, stop: string): void {
    this.treeSelected = `${route} > ${stop}`;
    this.form.get(this.controlName)?.setValue(this.treeSelected);
    this.form.get(this.controlName)?.markAsDirty();
  }

  clearTree(): void {
    this.treeSelected = '';
    this.form.get(this.controlName)?.setValue('');
  }
  // ────────────────────────────────────────────────────────────────

  private readonly inputTypeRegistry: Record<string, string> = {
    TEXTBOX: 'text',
    EMAIL: 'email',
    NUMBER: 'number',
    PHONE: 'tel',
    DATE_PICKER: 'date',
    TIME_PICKER: 'time',
    QR_SCANNER: 'text'
  };

  private readonly renderRegistry: Record<string, RenderKind> = {
    TEXTBOX: 'input',
    TEXTAREA: 'textarea',
    DROPDOWN: 'dropdown',
    RADIO_BUTTON: 'radio',
    CHECKBOX: 'checkbox',
    DATE_PICKER: 'input',
    TIME_PICKER: 'input',
    NUMBER: 'input',
    EMAIL: 'input',
    PHONE: 'input',
    FILE_UPLOAD: 'file',
    QR_SCANNER: 'input',
    SIGNATURE: 'signature',
    TREE_SELECT: 'tree-select',
  };

  fieldType(): string {
    return (this.field?.type ?? '').toUpperCase();
  }

  renderKind(): RenderKind {
    return this.renderRegistry[this.fieldType()] ?? 'unsupported';
  }

  inputType(): string {
    return this.inputTypeRegistry[this.fieldType()] ?? 'text';
  }

  isWideField(): boolean {
    const kind = this.renderKind();
    return kind === 'textarea' || kind === 'signature' || kind === 'tree-select';
  }

  isChecked(option: string): boolean {
    const current = (this.form.get(this.controlName)?.value as string[] | null) ?? [];
    return current.includes(option);
  }

  onCheckboxChange(option: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = ((this.form.get(this.controlName)?.value as string[]) ?? []).slice();
    const next = checked ? [...current, option] : current.filter((entry) => entry !== option);
    this.form.get(this.controlName)?.setValue(next);
    this.form.get(this.controlName)?.markAsDirty();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.form.get(this.controlName)?.setValue(file ? file.name : '');
    this.form.get(this.controlName)?.markAsDirty();
  }

  isInvalid(): boolean {
    const ctrl = this.form.get(this.controlName);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  getErrorMessage(): string {
    const ctrl = this.form.get(this.controlName);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'This field is required';
    if (ctrl.errors['email']) return 'Please enter a valid email address';
    if (ctrl.errors['minlength']) return `Minimum length is ${ctrl.errors['minlength'].requiredLength}`;
    if (ctrl.errors['maxlength']) return `Maximum length is ${ctrl.errors['maxlength'].requiredLength}`;
    if (ctrl.errors['min']) return `Minimum value is ${ctrl.errors['min'].min}`;
    if (ctrl.errors['max']) return `Maximum value is ${ctrl.errors['max'].max}`;
    if (ctrl.errors['pattern']) return 'Invalid format';
    return 'Invalid input';
  }
}
