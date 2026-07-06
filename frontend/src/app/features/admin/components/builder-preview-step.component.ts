import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FacilityField } from '../../../core/models/specification.models';

@Component({
  selector: 'app-builder-preview-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid gap-5 py-4 xl:grid-cols-2">
      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 class="text-lg font-semibold text-slate-900">Employee Form Preview</h3>
        <p class="text-sm text-slate-500">Rendered dynamically from specification JSON.</p>
        <div class="mt-4 space-y-3">
          <div *ngFor="let field of fields" class="rounded-lg bg-slate-50 p-3">
            <p class="text-sm font-semibold text-slate-800">{{ field.label }}</p>
            <p class="text-xs text-slate-500">Type: {{ field.fieldType }}</p>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 class="text-lg font-semibold text-slate-900">Specification JSON</h3>
        <p class="text-sm text-slate-500">Exact payload sent to backend.</p>
        <pre class="mt-4 max-h-[460px] overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{{ generatedJson }}</pre>
      </article>
    </section>
  `
})
export class BuilderPreviewStepComponent {
  @Input({ required: true }) fields: FacilityField[] = [];
  @Input() generatedJson = '';
}
