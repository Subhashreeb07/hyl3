import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { LocationApiService, LocationResponse } from '../../../core/services/location-api.service';
import { SessionService } from '../../../core/services/session.service';

export interface PublishLocationsDialogResult {
  targetLocations: string[];
  targetEmployeeIds: string[];
}

export interface PublishDialogData {
  workModes?: { onSite: boolean; remote: boolean; hybrid: boolean };
  roles?: Record<string, boolean>;
}

interface EmployeeRow {
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  roleCode: string;
  workMode: string;
  officeLocation: string;
  active: boolean;
}

@Component({
  selector: 'app-publish-locations-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  styles: [`
    .pill { display:inline-flex; align-items:center; border-radius:6px; border:1px solid #cbd5e1;
      background:#fff; padding:0.35rem 0.85rem; font-size:0.8rem; font-weight:600; color:#475569;
      cursor:pointer; user-select:none; transition:all .15s; }
    .pill:hover { border-color:#94a3b8; background:#f8fafc; }
    .pill.active { border-color:#4f46e5; background:#eef2ff; color:#4338ca; }
    .step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center;
      font-size:.75rem; font-weight:700; flex-shrink:0; }
    .emp-row { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:10px; cursor:pointer;
      border:1px solid transparent; transition:all .15s; }
    .emp-row:hover { background:#f8fafc; border-color:#e2e8f0; }
    .emp-row.selected { background:#eef2ff; border-color:#a5b4fc; }
  `],
  template: `
    <!-- Step indicator -->
    <div class="flex items-center gap-0 px-5 pt-4 pb-2">
      <ng-container *ngFor="let s of steps; let i = index">
        <div class="flex flex-col items-center gap-1">
          <div class="step-dot"
               [style.background]="step() > i ? '#4f46e5' : step() === i ? '#6366f1' : '#e2e8f0'"
               [style.color]="step() >= i ? '#fff' : '#94a3b8'">
            <span *ngIf="step() > i" class="material-icons-outlined" style="font-size:14px">check</span>
            <span *ngIf="step() <= i">{{ i + 1 }}</span>
          </div>
          <span class="text-[10px] font-semibold whitespace-nowrap"
                [style.color]="step() === i ? '#4f46e5' : '#94a3b8'">{{ s }}</span>
        </div>
        <div *ngIf="i < steps.length - 1" class="flex-1 h-px mx-1 mt-[-14px]"
             [style.background]="step() > i ? '#4f46e5' : '#e2e8f0'"></div>
      </ng-container>
    </div>

    <!-- ── STEP 0: Locations ── -->
    <div *ngIf="step() === 0" class="px-5 pb-2">
      <p class="text-sm font-bold text-slate-800 mt-2">Select Office Locations</p>
      <p class="text-xs text-slate-500 mb-3">Employees from these locations will see this facility.</p>

      <div *ngIf="locLoading()" class="py-6 text-center text-sm text-slate-400">Loading…</div>
      <div *ngIf="!locLoading()" class="space-y-2 max-h-52 overflow-y-auto pr-1">
        <label *ngFor="let loc of locations()"
               class="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium cursor-pointer transition"
               [class.border-indigo-400]="isLocSelected(loc.locationName)"
               [class.bg-indigo-50]="isLocSelected(loc.locationName)"
               [class.border-slate-200]="!isLocSelected(loc.locationName)"
               [class.text-indigo-800]="isLocSelected(loc.locationName)"
               [class.text-slate-700]="!isLocSelected(loc.locationName)">
          <input type="checkbox" [checked]="isLocSelected(loc.locationName)"
                 (change)="toggleLoc(loc.locationName)" class="accent-indigo-600 h-4 w-4" />
          {{ loc.locationName | titlecase }}
        </label>
        <p *ngIf="locations().length === 0" class="text-sm text-slate-400 italic py-4 text-center">
          No locations configured.
        </p>
      </div>
      <p *ngIf="locError" class="text-xs text-rose-600 mt-1">Select at least one location.</p>
    </div>

    <!-- ── STEP 1: Role & Work Mode Filter ── -->
    <div *ngIf="step() === 1" class="px-5 pb-2">
      <p class="text-sm font-bold text-slate-800 mt-2">Filter Employees</p>
      <p class="text-xs text-slate-500 mb-4">Choose which roles and work modes to include. Pre-filled from business rules.</p>

      <div class="mb-4">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Work Mode</p>
        <div class="flex flex-wrap gap-2">
          <span class="pill" [class.active]="wfOnSite()" (click)="toggleWf('onSite')">On-site</span>
          <span class="pill" [class.active]="wfRemote()" (click)="toggleWf('remote')">Remote</span>
          <span class="pill" [class.active]="wfHybrid()" (click)="toggleWf('hybrid')">Hybrid</span>
        </div>
      </div>

      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Employee Role</p>
        <div *ngIf="rolesLoading()" class="text-xs text-slate-400 italic">Loading roles…</div>
        <div *ngIf="!rolesLoading()" class="flex flex-wrap gap-2">
          <span *ngFor="let role of roleKeys()"
                class="pill" [class.active]="roles()[role]"
                (click)="toggleRole(role)">{{ role }}</span>
          <span *ngIf="roleKeys().length === 0" class="text-xs text-slate-400 italic">No roles found.</span>
        </div>
      </div>
    </div>

    <!-- ── STEP 2: Employee Selection ── -->
    <div *ngIf="step() === 2" class="px-5 pb-2">
      <div class="flex items-center justify-between mt-2 mb-3">
        <div>
          <p class="text-sm font-bold text-slate-800">Select Employees</p>
          <p class="text-xs text-slate-500">{{ selectedEmpIds().size }} selected · {{ filteredByRule().length }} match filter · {{ allEmployees().length }} total</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="text-xs font-semibold text-indigo-600 hover:underline" (click)="selectAll()">All</button>
          <span class="text-slate-300">|</span>
          <button type="button" class="text-xs font-semibold text-slate-500 hover:underline" (click)="selectNone()">None</button>
        </div>
      </div>

      <!-- Search -->
      <div class="relative mb-3">
        <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:16px">search</span>
        <input [value]="empSearch()" (input)="setSearch($any($event.target).value)"
               placeholder="Search by name, email, role…"
               class="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>

      <div *ngIf="empLoading()" class="py-8 text-center text-sm text-slate-400">Loading employees…</div>

      <div *ngIf="!empLoading()" class="space-y-1 max-h-60 overflow-y-auto pr-1">
        <div *ngFor="let emp of visibleEmployees()"
             class="emp-row" [class.selected]="selectedEmpIds().has(emp.employeeId)"
             (click)="toggleEmp(emp.employeeId)">
          <input type="checkbox" [checked]="selectedEmpIds().has(emp.employeeId)"
                 (click)="$event.stopPropagation()" (change)="toggleEmp(emp.employeeId)"
                 class="accent-indigo-600 h-4 w-4 shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">{{ emp.fullName }}</p>
            <p class="text-[11px] text-slate-500 truncate">{{ emp.email }}</p>
          </div>
          <div class="text-right shrink-0">
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  [class.text-indigo-600]="matchesRule(emp)" [class.bg-indigo-50]="matchesRule(emp)"
                  [class.text-slate-500]="!matchesRule(emp)" [class.bg-slate-100]="!matchesRule(emp)">
              {{ emp.roleCode }}
            </span>
            <p class="text-[10px] text-slate-400 mt-0.5">{{ emp.officeLocation | titlecase }} · {{ emp.workMode }}</p>
          </div>
        </div>
        <div *ngIf="visibleEmployees().length === 0" class="py-6 text-center text-sm text-slate-400">
          No employees match the current filter.
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between border-t border-slate-100 px-5 py-3 mt-1">
      <button mat-button type="button"
              (click)="goBack()">
        {{ step() === 0 ? 'Cancel' : '← Back' }}
      </button>
      <div class="flex items-center gap-2">
        <span *ngIf="step() === 2 && !empLoading()" class="text-xs"
              [class.text-slate-500]="selectedEmpIds().size > 0"
              [class.text-rose-500]="selectedEmpIds().size === 0">
          {{ selectedEmpIds().size > 0 ? selectedEmpIds().size + ' selected' : 'Select at least one employee' }}
        </span>
        <button mat-flat-button color="primary" type="button"
                [disabled]="stepNextDisabled()"
                (click)="nextStep()">
          {{ step() === 2 ? 'Publish' : 'Next →' }}
        </button>
      </div>
    </div>
  `
})
export class PublishLocationsDialogComponent implements OnInit {
  readonly steps = ['Locations', 'Filter', 'Employees'];
  readonly step = signal(0);

  // Step 0 - Locations
  readonly locations = signal<LocationResponse[]>([]);
  readonly locLoading = signal(true);
  readonly selectedLocs = signal<Set<string>>(new Set());
  locError = false;

  // Step 1 - Filters: converted to signals so filteredByRule computed is reactive
  readonly wfOnSite  = signal(true);
  readonly wfRemote  = signal(true);
  readonly wfHybrid  = signal(true);
  /** Keys are DB role codes (uppercase); values are whether the pill is active. Loaded from /api/admin/employees/roles */
  readonly roles     = signal<Record<string, boolean>>({});
  readonly rolesLoading = signal(true);

  // Step 2 - Employees
  readonly empLoading    = signal(false);
  readonly allEmployees  = signal<EmployeeRow[]>([]);
  readonly selectedEmpIds = signal<Set<string>>(new Set());
  readonly empSearch     = signal('');

  readonly filteredByRule = computed(() => {
    const locs      = this.selectedLocs();
    const employees = this.allEmployees();
    const r         = this.roles();
    const onSite    = this.wfOnSite();
    const remote    = this.wfRemote();
    const hybrid    = this.wfHybrid();

    const activeModes   = [onSite && 'on-site', remote && 'remote', hybrid && 'hybrid'].filter(Boolean) as string[];
    const activeRoles   = Object.entries(r).filter(([, v]) => v).map(([k]) => k.toLowerCase());
    const allModes      = activeModes.length === 3;
    const totalRoles    = Object.keys(r).length;
    const allRoles      = totalRoles === 0 || activeRoles.length === totalRoles;

    return employees.filter(e => {
      if (!e.active) return false;
      const locMatch  = locs.size === 0 || locs.has(e.officeLocation?.toUpperCase() ?? '');
      // work_mode in DB: ON_SITE / REMOTE / HYBRID — normalise to match pill values
      const dbMode    = (e.workMode ?? '').replace('_', '-').toLowerCase(); // on-site, remote, hybrid
      const modeMatch = allModes || activeModes.includes(dbMode);
      // EMPLOYEE role code has no pill — treat it as always matching (generic employee)
      const dbRole    = e.roleCode?.toLowerCase() ?? '';
      const roleMatch = allRoles || dbRole === 'employee' || activeRoles.includes(dbRole);
      return locMatch && modeMatch && roleMatch;
    });
  });

  readonly visibleEmployees = computed(() => {
    const q   = this.empSearch().trim().toLowerCase();
    const all = this.allEmployees().filter(e => e.active);
    if (!q) return all;
    return all.filter(e =>
      e.fullName?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.roleCode?.toLowerCase().includes(q) ||
      e.officeLocation?.toLowerCase().includes(q)
    );
  });

  private readonly locationApi = inject(LocationApiService);
  private readonly http         = inject(HttpClient);
  private readonly session      = inject(SessionService);
  readonly dialogRef            = inject(MatDialogRef<PublishLocationsDialogComponent, PublishLocationsDialogResult>);
  private readonly data         = inject<PublishDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  ngOnInit(): void {
    // Load distinct role codes from employees table
    const token = this.session.state()?.token ?? '';
    this.http.get<string[]>(`${environment.apiUrl}/admin/employees/roles`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    }).subscribe({
      next: (roleCodes) => {
        // Build initial roles map: all true by default
        const map: Record<string, boolean> = {};
        roleCodes.forEach(r => { map[r] = true; });
        // Apply overrides from dialog data only if at least one is true
        const dr = this.data?.roles;
        if (dr && Object.values(dr).some(v => v)) {
          // Match by uppercase key — dialog data keys may differ in casing
          Object.entries(dr).forEach(([k, v]) => {
            const match = Object.keys(map).find(r => r.toUpperCase() === k.toUpperCase());
            if (match) map[match] = v;
          });
        }
        this.roles.set(map);
        this.rolesLoading.set(false);
      },
      error: () => this.rolesLoading.set(false)
    });

    // Only apply workMode overrides if at least one is explicitly enabled
    const wm = this.data?.workModes;
    if (wm && (wm.onSite || wm.remote || wm.hybrid)) {
      this.wfOnSite.set(!!wm.onSite);
      this.wfRemote.set(!!wm.remote);
      this.wfHybrid.set(!!wm.hybrid);
    }

    this.locationApi.getLocations().subscribe({
      next: (locs) => {
        this.locations.set(locs);
        this.selectedLocs.set(new Set(locs.map(l => l.locationName.toUpperCase())));
        this.locLoading.set(false);
      },
      error: () => this.locLoading.set(false)
    });
  }

  /** Sorted list of role keys for *ngFor in the template. */
  roleKeys(): string[] {
    return Object.keys(this.roles()).sort();
  }

  goBack(): void {
    if (this.step() === 0) {
      this.dialogRef.close();
    } else {
      this.step.update(s => s - 1);
    }
  }

  // ── Location helpers ──
  isLocSelected(name: string): boolean { return this.selectedLocs().has(name.toUpperCase()); }
  toggleLoc(name: string): void {
    const key = name.toUpperCase();
    const next = new Set(this.selectedLocs());
    next.has(key) ? next.delete(key) : next.add(key);
    this.selectedLocs.set(next);
    this.locError = false;
  }

  // ── Filter helpers ──
  toggleWf(mode: 'onSite' | 'remote' | 'hybrid'): void {
    if (mode === 'onSite') this.wfOnSite.update(v => !v);
    else if (mode === 'remote') this.wfRemote.update(v => !v);
    else this.wfHybrid.update(v => !v);
  }
  toggleRole(role: string): void {
    this.roles.update(r => ({ ...r, [role]: !r[role] }));
  }

  // ── Employee helpers ──
  matchesRule(emp: EmployeeRow): boolean {
    return this.filteredByRule().some(e => e.employeeId === emp.employeeId);
  }

  selectAll(): void  { this.selectedEmpIds.set(new Set(this.filteredByRule().map(e => e.employeeId))); }
  selectNone(): void { this.selectedEmpIds.set(new Set()); }
  toggleEmp(id: string): void {
    const next = new Set(this.selectedEmpIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedEmpIds.set(next);
  }
  setSearch(val: string): void { this.empSearch.set(val); }

  private loadEmployees(): void {
    this.empLoading.set(true);
    const token = this.session.state()?.token ?? '';
    this.http.get<EmployeeRow[]>(`${environment.apiUrl}/admin/employees`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    }).subscribe({
      next: (list) => {
        this.allEmployees.set(list);
        // Pre-select employees matching the current filter
        this.selectedEmpIds.set(new Set(this.filteredByRule().map(e => e.employeeId)));
        this.empLoading.set(false);
      },
      error: () => this.empLoading.set(false)
    });
  }

  stepNextDisabled(): boolean {
    if (this.step() === 0) return this.locLoading() || this.selectedLocs().size === 0;
    if (this.step() === 2) return this.empLoading() || this.selectedEmpIds().size === 0;
    return false;
  }

  nextStep(): void {
    if (this.step() === 0) {
      if (this.selectedLocs().size === 0) { this.locError = true; return; }
      this.step.set(1);
    } else if (this.step() === 1) {
      this.step.set(2);
      this.loadEmployees();
    } else {
      this.dialogRef.close({
        targetLocations: [...this.selectedLocs()],
        targetEmployeeIds: [...this.selectedEmpIds()]
      });
    }
  }
}

