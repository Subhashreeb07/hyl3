import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-builder-publish-panel',
  standalone: true,
  imports: [CommonModule, MatExpansionModule],
  template: `
    <section class="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-5">
      <button class="satori-secondary" (click)="saveDraft.emit()">Save Draft</button>
      <button class="satori-primary" (click)="publish.emit()">Publish</button>
      <button class="satori-secondary" (click)="generateJson.emit()">Generate JSON</button>
      <button class="satori-secondary" (click)="downloadJson.emit()">Download JSON</button>
      <button class="satori-secondary" (click)="importJson.emit()">Import JSON</button>
    </section>

    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>Debug Panel - Generated Specification JSON</mat-panel-title>
      </mat-expansion-panel-header>
      <pre class="max-h-80 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{{ generatedJson }}</pre>
    </mat-expansion-panel>
  `
})
export class BuilderPublishPanelComponent {
  @Input() generatedJson = '';

  @Output() saveDraft = new EventEmitter<void>();
  @Output() publish = new EventEmitter<void>();
  @Output() generateJson = new EventEmitter<void>();
  @Output() downloadJson = new EventEmitter<void>();
  @Output() importJson = new EventEmitter<void>();
}
