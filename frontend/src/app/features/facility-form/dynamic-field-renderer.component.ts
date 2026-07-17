import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SpecificationField } from '../../core/models/employee-flow.models';

type RenderKind = 'input' | 'textarea' | 'dropdown' | 'radio' | 'checkbox' | 'file' | 'signature' | 'tree-select' | 'date-picker' | 'time-picker' | 'unsupported';

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

      <!-- ── DATE PICKER ─────────────────────────────────────────── -->
      <div *ngIf="renderKind() === 'date-picker'" class="relative">
        <button type="button" (click)="toggleCalPicker()"
                class="group flex w-full items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
                [ngClass]="isInvalid() ? 'border-red-500' : 'border-slate-200'">
          <span class="material-icons-outlined text-indigo-600 transition-colors group-hover:text-indigo-700" style="font-size:18px">calendar_month</span>
          <span class="flex-1 text-left" [class.font-normal]="true" [class.text-slate-400]="!form.get(controlName)?.value">
            {{ getDateLabel() }}
          </span>
          <span class="material-icons-outlined text-slate-400 transition-transform duration-200"
                [style.transform]="showCalPicker ? 'rotate(180deg)' : 'rotate(0deg)'" style="font-size:16px">keyboard_arrow_down</span>
        </button>

        <!-- Backdrop -->
        <div *ngIf="showCalPicker" (click)="showCalPicker = false" class="fixed inset-0 z-40"></div>

        <!-- Calendar Panel -->
        <div *ngIf="showCalPicker"
             class="absolute left-0 top-12 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white"
             style="width:min(320px,calc(100vw - 32px));box-shadow:0 25px 50px -12px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.04);">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4"
               style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e4d8c 100%)">
            <button type="button" (click)="prevCalMonth(); $event.stopPropagation()"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white">
              <span class="material-icons-outlined" style="font-size:20px">chevron_left</span>
            </button>
            <p class="text-base font-bold tracking-tight text-white">{{ calPickerMonthLabel() }}</p>
            <button type="button" (click)="nextCalMonth(); $event.stopPropagation()"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white">
              <span class="material-icons-outlined" style="font-size:20px">chevron_right</span>
            </button>
          </div>

          <!-- Weekday Labels -->
          <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            <span *ngFor="let wd of weekDayLabels"
                  class="py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ wd }}</span>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-0.5 p-3">
            <ng-container *ngFor="let cell of calPickerDays()">
              <div *ngIf="cell.date === null" class="h-9 w-full"></div>
              <button *ngIf="cell.date !== null"
                      type="button"
                      (click)="selectCalPickerDate(cell.date); $event.stopPropagation()"
                      class="relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-150"
                      [ngClass]="{
                        'bg-slate-900 text-white shadow font-bold': cell.date === form.get(controlName)?.value,
                        'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100': isCalToday(cell.date) && cell.date !== form.get(controlName)?.value,
                        'text-slate-700 hover:bg-slate-100': !isCalToday(cell.date) && cell.date !== form.get(controlName)?.value
                      }">
                {{ cell.num }}
                <span *ngIf="isCalToday(cell.date) && cell.date !== form.get(controlName)?.value"
                      class="absolute bottom-1 left-1/2 h-1 w-1 rounded-full bg-indigo-500"
                      style="transform:translateX(-50%)"></span>
              </button>
            </ng-container>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
            <button type="button" (click)="selectCalToday(); $event.stopPropagation()"
                    class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700">Today</button>
            <p class="text-xs font-medium text-slate-500">
              {{ form.get(controlName)?.value ? (form.get(controlName)?.value | date:'EEE, MMM d') : 'No date selected' }}
            </p>
          </div>
        </div>
      </div>

      <!-- ── TIME PICKER ─────────────────────────────────────────── -->
      <div *ngIf="renderKind() === 'time-picker'" class="relative">
        <button type="button" (click)="toggleTimePicker()"
                class="group flex w-full items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
                [ngClass]="isInvalid() ? 'border-red-500' : 'border-slate-200'">
          <span class="material-icons-outlined text-indigo-600 transition-colors group-hover:text-indigo-700" style="font-size:18px">schedule</span>
          <span class="flex-1 text-left" [class.text-slate-400]="!form.get(controlName)?.value">
            {{ getTimeLabel() }}
          </span>
          <span class="material-icons-outlined text-slate-400 transition-transform duration-200"
                [style.transform]="showTimePicker ? 'rotate(180deg)' : 'rotate(0deg)'" style="font-size:16px">keyboard_arrow_down</span>
        </button>

        <!-- Backdrop -->
        <div *ngIf="showTimePicker" (click)="showTimePicker = false" class="fixed inset-0 z-40"></div>

        <!-- Time Panel -->
        <div *ngIf="showTimePicker"
             class="absolute left-0 top-12 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white"
             style="width:260px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.04);">

          <!-- Header -->
          <div class="px-5 py-4 text-center"
               style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e4d8c 100%)">
            <p class="text-lg font-bold tracking-tight text-white">{{ getTimeLabel() }}</p>
            <p class="text-[11px] text-white/50 mt-0.5">Select time</p>
          </div>

          <!-- Columns -->
          <div class="flex gap-1 p-3">

            <!-- Hours -->
            <div class="flex-1">
              <p class="mb-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Hour</p>
              <div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                <button *ngFor="let h of tpHours" type="button"
                        (click)="selectTpHour(h); $event.stopPropagation()"
                        class="flex h-8 items-center justify-center rounded-lg text-sm font-medium transition-all"
                        [ngClass]="tpHour === h ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-700 hover:bg-slate-100'">
                  {{ h }}
                </button>
              </div>
            </div>

            <!-- Separator -->
            <div class="flex items-start justify-center pt-8">
              <span class="text-xl font-bold text-slate-300">:</span>
            </div>

            <!-- Minutes -->
            <div class="flex-1">
              <p class="mb-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Min</p>
              <div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                <button *ngFor="let m of tpMinutes" type="button"
                        (click)="selectTpMinute(m); $event.stopPropagation()"
                        class="flex h-8 items-center justify-center rounded-lg text-sm font-medium transition-all"
                        [ngClass]="tpMinute === m ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-700 hover:bg-slate-100'">
                  {{ formatMinute(m) }}
                </button>
              </div>
            </div>

            <!-- AM / PM -->
            <div class="flex flex-col items-center gap-1.5 pt-7">
              <button type="button" (click)="selectTpAmPm('AM'); $event.stopPropagation()"
                      class="flex h-8 w-11 items-center justify-center rounded-lg text-xs font-bold transition-all"
                      [ngClass]="tpAmPm === 'AM' ? 'bg-indigo-600 text-white shadow' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'">AM</button>
              <button type="button" (click)="selectTpAmPm('PM'); $event.stopPropagation()"
                      class="flex h-8 w-11 items-center justify-center rounded-lg text-xs font-bold transition-all"
                      [ngClass]="tpAmPm === 'PM' ? 'bg-indigo-600 text-white shadow' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'">PM</button>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
            <button type="button" (click)="selectTimeNow(); $event.stopPropagation()"
                    class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700">Now</button>
            <p class="text-xs font-medium text-slate-500">{{ getTimeLabel() }}</p>
          </div>
        </div>
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
    DATE_PICKER: 'date-picker',
    TIME_PICKER: 'time-picker',
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

  // ── Calendar picker state ─────────────────────────────────────────
  showCalPicker = false;
  calViewYear = new Date().getFullYear();
  calViewMonth = new Date().getMonth();
  readonly weekDayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  toggleCalPicker(): void {
    if (!this.showCalPicker) {
      const val = this.form.get(this.controlName)?.value as string | null;
      if (val) {
        const d = new Date(val + 'T00:00:00');
        if (!isNaN(d.getTime())) { this.calViewYear = d.getFullYear(); this.calViewMonth = d.getMonth(); }
      }
    }
    this.showCalPicker = !this.showCalPicker;
  }

  prevCalMonth(): void {
    if (this.calViewMonth === 0) { this.calViewMonth = 11; this.calViewYear--; }
    else { this.calViewMonth--; }
  }

  nextCalMonth(): void {
    if (this.calViewMonth === 11) { this.calViewMonth = 0; this.calViewYear++; }
    else { this.calViewMonth++; }
  }

  calPickerMonthLabel(): string {
    return new Date(this.calViewYear, this.calViewMonth, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  calPickerDays(): Array<{ date: string | null; num: number | null }> {
    const year = this.calViewYear;
    const month = this.calViewMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ date: string | null; num: number | null }> = [];
    for (let i = 0; i < firstDay; i++) { days.push({ date: null, num: null }); }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        num: d
      });
    }
    return days;
  }

  selectCalPickerDate(date: string): void {
    this.form.get(this.controlName)?.setValue(date);
    this.form.get(this.controlName)?.markAsDirty();
    this.showCalPicker = false;
  }

  selectCalToday(): void {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.calViewYear = d.getFullYear();
    this.calViewMonth = d.getMonth();
    this.selectCalPickerDate(today);
  }

  isCalToday(date: string): boolean {
    const d = new Date();
    return date === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getDateLabel(): string {
    const val = this.form.get(this.controlName)?.value as string | null;
    if (!val) return (this.field.placeholder as string | undefined) || 'Select date';
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Time picker state ─────────────────────────────────────────────
  showTimePicker = false;
  tpHour = 12;
  tpMinute = 0;
  tpAmPm: 'AM' | 'PM' = 'AM';
  readonly tpHours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly tpMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  toggleTimePicker(): void {
    if (!this.showTimePicker) {
      const val = this.form.get(this.controlName)?.value as string | null;
      if (val) { this.parseTimeToState(val); }
    }
    this.showTimePicker = !this.showTimePicker;
  }

  selectTpHour(h: number): void { this.tpHour = h; this.applyTime(); }
  selectTpMinute(m: number): void { this.tpMinute = m; this.applyTime(); }
  selectTpAmPm(v: 'AM' | 'PM'): void { this.tpAmPm = v; this.applyTime(); }

  selectTimeNow(): void {
    const now = new Date();
    this.tpHour = now.getHours() % 12 || 12;
    this.tpMinute = Math.round(now.getMinutes() / 5) * 5 % 60;
    this.tpAmPm = now.getHours() < 12 ? 'AM' : 'PM';
    this.applyTime();
    this.showTimePicker = false;
  }

  applyTime(): void {
    this.form.get(this.controlName)?.setValue(this.stateToTime24());
    this.form.get(this.controlName)?.markAsDirty();
  }

  getTimeLabel(): string {
    const val = this.form.get(this.controlName)?.value as string | null;
    if (!val) return (this.field.placeholder as string | undefined) || 'Select time';
    const parts = val.split(':');
    if (parts.length < 2) return val;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${period}`;
  }

  formatMinute(m: number): string {
    return m.toString().padStart(2, '0');
  }

  private parseTimeToState(val: string): void {
    const parts = val.split(':');
    if (parts.length < 2) return;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    this.tpAmPm = h >= 12 ? 'PM' : 'AM';
    this.tpHour = h % 12 || 12;
    this.tpMinute = Math.round(m / 5) * 5 % 60;
  }

  private stateToTime24(): string {
    let h = this.tpHour;
    if (this.tpAmPm === 'AM') { h = h === 12 ? 0 : h; }
    else { h = h === 12 ? 12 : h + 12; }
    return `${String(h).padStart(2, '0')}:${String(this.tpMinute).padStart(2, '0')}`;
  }
  // ─────────────────────────────────────────────────────────────────

  getErrorMessage(): string {
    const ctrl = this.form.get(this.controlName);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'This field is required';
    if (ctrl.errors['email']) return 'Please enter a valid email address';
    if (ctrl.errors['minlength']) return `Minimum length is ${ctrl.errors['minlength'].requiredLength}`;
    if (ctrl.errors['maxlength']) return `Maximum length is ${ctrl.errors['maxlength'].requiredLength}`;
    if (ctrl.errors['min']) return `Minimum value is ${ctrl.errors['min'].min}`;
    if (ctrl.errors['max']) return `Maximum value is ${ctrl.errors['max'].max}`;
    if (ctrl.errors['pattern']) {
      const validationRules = this.parseValidationJson();
      if (typeof validationRules['patternMessage'] === 'string' && validationRules['patternMessage'].trim()) {
        return validationRules['patternMessage'] as string;
      }
      if (this.fieldType() === 'EMAIL') {
        return 'Email must end with @hyland.com';
      }
      if (this.fieldType() === 'PHONE') {
        return 'Please enter a valid phone number';
      }
      return 'Invalid format';
    }
    return 'Invalid input';
  }

  private parseValidationJson(): Record<string, unknown> {
    if (!this.field.validationJson?.trim()) {
      return {};
    }
    try {
      const parsed = JSON.parse(this.field.validationJson);
      return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}
