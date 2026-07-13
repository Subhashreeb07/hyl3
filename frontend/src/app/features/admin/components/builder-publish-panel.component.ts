import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-builder-publish-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatExpansionModule],
  styles: [`
    .publish-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .publish-card h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .publish-card p.subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1.25rem;
    }
    .btn-outline {
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;
      padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; color: #334155;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-outline:hover { border-color: #94a3b8; background: #f8fafc; }
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 6px; border: none; background: #4f46e5;
      padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; color: #fff;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover { background: #4338ca; }
  `],
  template: `
    <section class="space-y-6 py-4">
      <div class="publish-card">
        <h4>Publish Checklist</h4>
        <p class="subtitle mb-0">
          {{ isPublished ? 'This facility is published. Edit JSON or re-publish to update.' : 'Save draft after changes, verify preview, then publish to selected office locations.' }}
        </p>
      </div>

      <section class="flex flex-wrap gap-3">
        <button *ngIf="!isPublished" class="btn-outline" (click)="saveDraft.emit()">
          <span class="material-icons-outlined text-[1.2em] mr-1">save</span> Save Draft
        </button>
        <button class="btn-primary" (click)="publish.emit()">
          <span class="material-icons-outlined text-[1.2em] mr-1">rocket_launch</span> {{ isPublished ? 'Republish Facility' : 'Publish Facility' }}
        </button>
        <button class="btn-outline" (click)="openEditJson()">
          <span class="material-icons-outlined text-[1.2em] mr-1">code</span> Edit JSON
        </button>
        <button class="btn-outline" (click)="downloadJson.emit()">
          <span class="material-icons-outlined text-[1.2em] mr-1">download</span> Download JSON
        </button>
        <button class="btn-outline" (click)="importJson.emit()">
          <span class="material-icons-outlined text-[1.2em] mr-1">upload</span> Import JSON
        </button>
      </section>
    </section>

    <!-- Inline JSON editor -->
    <div *ngIf="editMode" class="mt-6 rounded-xl border border-indigo-200 bg-[#f8fafc] p-5 space-y-4 shadow-sm">
      <div class="flex items-center justify-between">
        <p class="text-base font-semibold text-slate-800">Edit Specification JSON</p>
        <button (click)="cancelEdit()"
          class="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition-colors flex items-center justify-center">
          <span class="material-icons-outlined" style="font-size:20px">close</span>
        </button>
      </div>
      <textarea
        [(ngModel)]="editBuffer"
        rows="18"
        class="w-full rounded-lg border border-slate-300 bg-white p-4 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y shadow-inner"
        spellcheck="false"
      ></textarea>
      <div class="flex gap-3 justify-end pt-2">
        <button class="btn-outline" (click)="cancelEdit()">Cancel</button>
        <button class="btn-primary" (click)="applyEdit()">Apply Changes</button>
      </div>
    </div>

    <!-- Read-only JSON view when not editing -->
    <div *ngIf="!editMode" class="mt-6">
      <mat-expansion-panel class="!rounded-xl !border !border-slate-200 !shadow-sm">
        <mat-expansion-panel-header class="!h-14">
          <mat-panel-title class="!text-slate-800 !font-semibold">Generated Specification JSON</mat-panel-title>
        </mat-expansion-panel-header>
        <pre class="max-h-80 overflow-auto rounded-lg bg-slate-900 p-4 text-[13px] text-slate-100 shadow-inner mt-2">{{ generatedJson }}</pre>
      </mat-expansion-panel>
    </div>
  `
})
export class BuilderPublishPanelComponent implements OnChanges {
  @Input() generatedJson = '';
  @Input() isPublished = false;

  @Output() saveDraft = new EventEmitter<void>();
  @Output() publish = new EventEmitter<void>();
  @Output() editJson = new EventEmitter<string>();
  @Output() downloadJson = new EventEmitter<void>();
  @Output() importJson = new EventEmitter<void>();

  editMode = false;
  editBuffer = '';

  ngOnChanges(): void {
    // Keep buffer fresh when JSON regenerates externally (unless currently editing)
    if (!this.editMode) {
      this.editBuffer = this.generatedJson;
    }
  }

  openEditJson(): void {
    this.editBuffer = this.generatedJson;
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editBuffer = this.generatedJson;
  }

  applyEdit(): void {
    this.editJson.emit(this.editBuffer);
    this.editMode = false;
  }
}
