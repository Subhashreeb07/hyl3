import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-builder-rules-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    .field-input {
      width: 100%; border: 1px solid #e2e8f0; border-radius: 0.6rem;
      padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #fff; outline: none;
    }
    .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
    .pill {
      display: inline-flex; align-items: center; gap: 4px;
      border-radius: 999px; border: 1.5px solid #e2e8f0;
      background: #fff; padding: 0.35rem 0.9rem;
      font-size: 0.8rem; font-weight: 600; color: #64748b;
      cursor: pointer; user-select: none; transition: all 0.15s;
    }
    .pill:hover { border-color: #a5b4fc; color: #4f46e5; }
    .pill.active { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
  `],
  template: `
    <form [formGroup]="form" class="space-y-5 py-4">

      <!-- Timing -->
      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 class="text-sm font-bold text-slate-800">Booking Timing</h4>
        <p class="text-xs text-slate-400 mt-0.5">Set daily booking hours for this facility.</p>
        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-500">Booking Start Time</label>
            <input type="time" formControlName="bookingStartTime" class="field-input" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-500">Booking Deadline</label>
            <input type="time" formControlName="bookingDeadline" class="field-input" />
          </div>
        </div>
      </section>

      <!-- Employee Type -->
      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 class="text-sm font-bold text-slate-800">Employee Type</h4>
        <p class="text-xs text-slate-400 mt-0.5">Which work modes can use this facility?</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <label class="pill" [class.active]="form.value.employeeTypeOnSite">
            <input type="checkbox" formControlName="employeeTypeOnSite" class="sr-only" />
            <span class="material-icons-outlined" style="font-size:14px">apartment</span> On-site
          </label>
          <label class="pill" [class.active]="form.value.employeeTypeRemote">
            <input type="checkbox" formControlName="employeeTypeRemote" class="sr-only" />
            <span class="material-icons-outlined" style="font-size:14px">home_work</span> Remote
          </label>
          <label class="pill" [class.active]="form.value.employeeTypeHybrid">
            <input type="checkbox" formControlName="employeeTypeHybrid" class="sr-only" />
            <span class="material-icons-outlined" style="font-size:14px">sync_alt</span> Hybrid
          </label>
        </div>
      </section>

      <!-- Applicable Roles -->
      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 class="text-sm font-bold text-slate-800">Applicable Roles</h4>
        <p class="text-xs text-slate-400 mt-0.5">Which job roles can access or book this facility?</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <label class="pill" [class.active]="form.value.roleHR">
            <input type="checkbox" formControlName="roleHR" class="sr-only" /> HR
          </label>
          <label class="pill" [class.active]="form.value.roleManager">
            <input type="checkbox" formControlName="roleManager" class="sr-only" /> Manager
          </label>
          <label class="pill" [class.active]="form.value.roleFinance">
            <input type="checkbox" formControlName="roleFinance" class="sr-only" /> Finance
          </label>
          <label class="pill" [class.active]="form.value.roleCloud">
            <input type="checkbox" formControlName="roleCloud" class="sr-only" /> Cloud
          </label>
          <label class="pill" [class.active]="form.value.roleRD">
            <input type="checkbox" formControlName="roleRD" class="sr-only" /> R&amp;D
          </label>
          <label class="pill" [class.active]="form.value.roleDirector">
            <input type="checkbox" formControlName="roleDirector" class="sr-only" /> Director
          </label>
          <label class="pill" [class.active]="form.value.roleIS">
            <input type="checkbox" formControlName="roleIS" class="sr-only" /> IS
          </label>
          <label class="pill" [class.active]="form.value.roleNOC">
            <input type="checkbox" formControlName="roleNOC" class="sr-only" /> NOC
          </label>
          <label class="pill" [class.active]="form.value.roleOps">
            <input type="checkbox" formControlName="roleOps" class="sr-only" /> Ops
          </label>
          <label class="pill" [class.active]="form.value.roleDevops">
            <input type="checkbox" formControlName="roleDevops" class="sr-only" /> DevOps
          </label>
        </div>
      </section>

    </form>
  `
})
export class BuilderRulesFormComponent {
  @Input({ required: true }) form!: FormGroup;
}

