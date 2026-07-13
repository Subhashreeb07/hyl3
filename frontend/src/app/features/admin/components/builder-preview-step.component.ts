import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FacilityField } from '../../../core/models/specification.models';
import { BuilderLivePreviewComponent } from './builder-live-preview.component';

@Component({
  selector: 'app-builder-preview-step',
  standalone: true,
  imports: [CommonModule, BuilderLivePreviewComponent],
  template: `
    <section class="grid gap-5 py-4 xl:grid-cols-[1fr_auto_1fr]">

      <!-- Phone preview -->
      <div class="flex justify-center">
        <app-builder-live-preview [facilityName]="facilityName" [fields]="fields" />
      </div>

      <!-- Divider -->
      <div class="hidden xl:flex flex-col items-center gap-2 pt-8">
        <div class="w-px flex-1 bg-slate-200"></div>
        <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 rotate-0">VS</span>
        <div class="w-px flex-1 bg-slate-200"></div>
      </div>

      <!-- JSON panel -->
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 class="text-base font-semibold text-slate-800">Specification JSON</h3>
        <p class="text-[13px] text-slate-500 mt-1">Exact payload sent to backend.</p>
        <pre class="mt-4 max-h-[500px] overflow-auto rounded-lg bg-slate-900 p-4 text-[13px] text-slate-100 shadow-inner">{{ generatedJson }}</pre>
      </article>

    </section>
  `
})
export class BuilderPreviewStepComponent {
  @Input({ required: true }) fields: FacilityField[] = [];
  @Input() facilityName = '';
  @Input() generatedJson = '';
}
