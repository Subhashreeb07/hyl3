import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-builder-publish-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatExpansionModule],
  template: `
    <section class="space-y-4 py-2">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 class="text-sm font-semibold text-slate-900">Publish Checklist</h4>
        <p class="mt-1 text-xs text-slate-600">
          {{ isPublished ? 'This facility is published. Edit JSON or re-publish to update.' : 'Save draft after changes, verify preview, then publish to selected office locations.' }}
        </p>
      </div>

      <section class="flex flex-wrap gap-3">
        <button *ngIf="!isPublished" class="satori-secondary" (click)="saveDraft.emit()">Save Draft</button>
        <button class="satori-primary" (click)="publish.emit()">{{ isPublished ? 'Re-Publish' : 'Publish Facility' }}</button>
        <button class="satori-secondary" (click)="openEditJson()">Edit JSON</button>
        <button class="satori-secondary" (click)="downloadJson.emit()">Download JSON</button>
        <button class="satori-secondary" (click)="importJson.emit()">Import JSON</button>
      </section>
    </section>

    <!-- Inline JSON editor -->
    <div *ngIf="editMode" class="mt-4 rounded-xl border border-indigo-200 bg-slate-50 p-4 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-slate-700">Edit Specification JSON</p>
        <button (click)="cancelEdit()"
          class="rounded-full p-1 text-slate-400 hover:bg-slate-200 transition-colors">
          <span class="material-icons-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <textarea
        [(ngModel)]="editBuffer"
        rows="18"
        class="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
        spellcheck="false"
      ></textarea>
      <div class="flex gap-2 justify-end">
        <button class="satori-secondary" (click)="cancelEdit()">Cancel</button>
        <button class="satori-primary" (click)="applyEdit()">Apply Changes</button>
      </div>
    </div>

    <!-- Read-only JSON view when not editing -->
    <mat-expansion-panel *ngIf="!editMode">
      <mat-expansion-panel-header>
        <mat-panel-title>Generated Specification JSON</mat-panel-title>
      </mat-expansion-panel-header>
      <pre class="max-h-80 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{{ generatedJson }}</pre>
    </mat-expansion-panel>
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
