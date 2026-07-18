import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LocationApiService, LocationResponse } from '../../../core/services/location-api.service';
import { SessionService } from '../../../core/services/session.service';
import { firstValueFrom } from 'rxjs';

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

interface BulkPreviewRow {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  role_code: string;
  work_mode: string;
  office_location: string;
  password: string;
  _status?: 'pending' | 'ok' | 'error';
  _message?: string;
}

@Component({
  selector: 'app-admin-employees-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6 pb-16">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p class="text-sm text-slate-500 mt-0.5">Add individual employees or upload in bulk via Excel</p>
        </div>
        <span class="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {{ employees().length }} employees
        </span>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button *ngFor="let tab of tabs" (click)="activeTab.set(tab.id)"
          class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
          [class.bg-white]="activeTab() === tab.id"
          [class.text-slate-800]="activeTab() === tab.id"
          [class.shadow-sm]="activeTab() === tab.id"
          [class.text-slate-500]="activeTab() !== tab.id">
          <span class="material-icons-outlined align-middle mr-1" style="font-size:16px">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── Tab: Add Individual ── -->
      <div *ngIf="activeTab() === 'add'" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl">
        <h2 class="text-base font-semibold text-slate-700 mb-4">New Employee</h2>
        <form [formGroup]="addForm" (ngSubmit)="submitAdd()" class="grid gap-4 sm:grid-cols-2">
          <label class="field-label">
            Employee ID *
            <input formControlName="employeeId" placeholder="EMP100"
              class="field-input" [class.border-red-400]="touched('employeeId') && addForm.get('employeeId')?.invalid" />
            <span *ngIf="fieldError('employeeId')" class="text-red-500 text-xs">{{ fieldError('employeeId') }}</span>
          </label>
          <label class="field-label">
            Full Name *
            <input formControlName="fullName" placeholder="Jane Smith" class="field-input"
              [class.border-red-400]="touched('fullName') && addForm.get('fullName')?.invalid" />
            <span *ngIf="fieldError('fullName')" class="text-red-500 text-xs">{{ fieldError('fullName') }}</span>
          </label>
          <label class="field-label sm:col-span-2">
            Email *
            <input formControlName="email" type="email" placeholder="jane.smith@company.com" class="field-input"
              [class.border-red-400]="touched('email') && addForm.get('email')?.invalid" />
            <span *ngIf="fieldError('email')" class="text-red-500 text-xs">{{ fieldError('email') }}</span>
          </label>
          <label class="field-label">
            Department *
            <input formControlName="department" placeholder="Engineering" class="field-input"
              [class.border-red-400]="touched('department') && addForm.get('department')?.invalid" />
            <span *ngIf="fieldError('department')" class="text-red-500 text-xs">{{ fieldError('department') }}</span>
          </label>
          <label class="field-label">
            Office Location *
            <select formControlName="officeLocation" class="field-input"
              [class.border-red-400]="touched('officeLocation') && addForm.get('officeLocation')?.invalid">
              <option *ngFor="let loc of locationOptions()" [value]="loc.locationName.toUpperCase()">{{ loc.locationName | titlecase }}</option>
            </select>
            <span *ngIf="fieldError('officeLocation')" class="text-red-500 text-xs">{{ fieldError('officeLocation') }}</span>
          </label>
          <label class="field-label">
            Work Mode *
            <select formControlName="workMode" class="field-input"
              [class.border-red-400]="touched('workMode') && addForm.get('workMode')?.invalid">
              <option value="HYBRID">Hybrid</option>
              <option value="ON_SITE">On-site</option>
              <option value="REMOTE">Remote</option>
            </select>
            <span *ngIf="fieldError('workMode')" class="text-red-500 text-xs">{{ fieldError('workMode') }}</span>
          </label>
          <label class="field-label">
            Role *
            <select formControlName="roleCode" class="field-input"
              [class.border-red-400]="touched('roleCode') && addForm.get('roleCode')?.invalid">
              <option value="EMPLOYEE">Employee (generic)</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="FINANCE">Finance</option>
              <option value="CLOUD">Cloud</option>
              <option value="RD">R&amp;D</option>
              <option value="DIRECTOR">Director</option>
              <option value="IS">IS</option>
              <option value="NOC">NOC</option>
              <option value="OPS">Ops</option>
              <option value="DEVOPS">DevOps</option>
            </select>
            <span *ngIf="fieldError('roleCode')" class="text-red-500 text-xs">{{ fieldError('roleCode') }}</span>
          </label>
          <label class="field-label sm:col-span-2">
            Password
            <input formControlName="password" type="password" placeholder="Leave blank = password123" class="field-input"
              [class.border-red-400]="touched('password') && addForm.get('password')?.invalid" />
            <span *ngIf="fieldError('password')" class="text-red-500 text-xs">{{ fieldError('password') }}</span>
          </label>

          <div class="sm:col-span-2 flex items-center gap-3 pt-2">
            <button type="submit" [disabled]="submitting()"
              class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
              {{ submitting() ? 'Saving...' : 'Add Employee' }}
            </button>
            <span *ngIf="addSuccess()" class="text-green-600 text-sm flex items-center gap-1">
              <span class="material-icons-outlined" style="font-size:18px">check_circle</span> Employee added!
            </span>
            <span *ngIf="addError()" class="text-red-500 text-sm">{{ addError() }}</span>
          </div>
        </form>
      </div>

      <!-- ── Tab: Bulk Upload ── -->
      <div *ngIf="activeTab() === 'bulk'" class="space-y-5 max-w-4xl">
        <!-- Template download -->
        <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
          <span class="material-icons-outlined text-indigo-500 text-3xl mt-0.5">table_chart</span>
          <div class="flex-1">
            <p class="font-semibold text-slate-800">Download Excel Template</p>
            <p class="text-sm text-slate-500 mt-0.5">
              Fill in the template exactly. All columns are required for bulk upload and blank fields will be rejected with row-wise errors.
            </p>
          </div>
          <button (click)="downloadTemplate()"
            class="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">
            <span class="material-icons-outlined" style="font-size:18px">download</span> Template
          </button>
        </div>

        <!-- File drop zone -->
        <div class="bg-white border-2 border-dashed rounded-2xl p-8 text-center transition"
             [class.border-indigo-400]="dragOver()"
             [class.bg-indigo-50]="dragOver()"
             [class.border-slate-200]="!dragOver()"
             (dragover)="$event.preventDefault(); dragOver.set(true)"
             (dragleave)="dragOver.set(false)"
             (drop)="onDrop($event)">
          <span class="material-icons-outlined text-slate-300 text-5xl">upload_file</span>
          <p class="mt-2 text-sm font-medium text-slate-600">Drag & drop your Excel file here</p>
          <p class="text-xs text-slate-400 mt-1">or</p>
          <label class="mt-3 inline-flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl cursor-pointer transition">
            <span class="material-icons-outlined" style="font-size:17px">folder_open</span> Browse File
            <input type="file" accept=".xlsx,.xls" class="sr-only" (change)="onFileSelect($event)" />
          </label>
          <p *ngIf="selectedFileName()" class="mt-3 text-xs text-indigo-600 font-medium">
            📄 {{ selectedFileName() }}
          </p>
        </div>

        <!-- Preview table -->
        <div *ngIf="previewRows().length > 0" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h3 class="font-semibold text-slate-700">Preview — {{ previewRows().length }} rows</h3>
            <button (click)="submitBulk()" [disabled]="bulkSubmitting()"
              class="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
              <span class="material-icons-outlined" style="font-size:17px">cloud_upload</span>
              {{ bulkSubmitting() ? 'Uploading...' : 'Upload All' }}
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th class="px-4 py-2.5 text-left">ID</th>
                  <th class="px-4 py-2.5 text-left">Name</th>
                  <th class="px-4 py-2.5 text-left">Email</th>
                  <th class="px-4 py-2.5 text-left">Role</th>
                  <th class="px-4 py-2.5 text-left">Mode</th>
                  <th class="px-4 py-2.5 text-left">Office</th>
                  <th class="px-4 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let row of previewRows()" [class.bg-red-50]="row._status === 'error'" [class.bg-green-50]="row._status === 'ok'">
                  <td class="px-4 py-2.5 font-mono text-xs">{{ row.employee_id }}</td>
                  <td class="px-4 py-2.5">{{ row.full_name }}</td>
                  <td class="px-4 py-2.5 text-slate-500 text-xs">{{ row.email }}</td>
                  <td class="px-4 py-2.5"><span class="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{{ row.role_code || '—' }}</span></td>
                  <td class="px-4 py-2.5 text-xs text-slate-600">{{ row.work_mode || '—' }}</td>
                  <td class="px-4 py-2.5 text-xs text-slate-600">{{ row.office_location || '—' }}</td>
                  <td class="px-4 py-2.5">
                    <span *ngIf="!row._status" class="text-slate-400 text-xs">—</span>
                    <span *ngIf="row._status === 'ok'" class="text-green-600 text-xs font-medium flex items-center gap-1">
                      <span class="material-icons-outlined" style="font-size:14px">check_circle</span> Added
                    </span>
                    <span *ngIf="row._status === 'error'" class="text-red-500 text-xs" [title]="row._message">
                      <span class="material-icons-outlined" style="font-size:14px">error</span> {{ row._message }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Bulk result summary -->
          <div *ngIf="bulkResult()" class="px-5 py-3 border-t border-slate-100 flex items-center gap-4 text-sm">
            <span class="text-green-600 font-semibold">✓ {{ bulkResult()!.created }} created</span>
            <span *ngIf="bulkResult()!.skipped > 0" class="text-orange-500 font-semibold">⚠ {{ bulkResult()!.skipped }} skipped</span>
          </div>
          <div *ngIf="bulkResult()?.errors?.length" class="px-5 pb-4 text-xs text-red-600 space-y-1">
            <div *ngFor="let e of bulkResult()!.errors">{{ e }}</div>
          </div>
        </div>
      </div>

      <!-- ── Tab: All Employees ── -->
      <div *ngIf="activeTab() === 'list'" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 class="font-semibold text-slate-700">All Employees</h2>
          <input [(ngModel)]="searchQuery" [ngModelOptions]="{standalone: true}"
            placeholder="Search name / ID / email..."
            class="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div *ngIf="loadError()" class="px-5 py-3 text-sm text-red-500 border-b border-slate-100">
          {{ loadError() }}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th class="px-4 py-3 text-left">Employee ID</th>
                <th class="px-4 py-3 text-left">Name</th>
                <th class="px-4 py-3 text-left">Email</th>
                <th class="px-4 py-3 text-left">Department</th>
                <th class="px-4 py-3 text-left">Role</th>
                <th class="px-4 py-3 text-left">Mode</th>
                <th class="px-4 py-3 text-left">Office</th>
                <th class="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let emp of filteredEmployees()" class="hover:bg-slate-50 transition">
                <td class="px-4 py-3 font-mono text-xs text-slate-700">{{ emp.employeeId }}</td>
                <td class="px-4 py-3 font-medium text-slate-800">{{ emp.fullName }}</td>
                <td class="px-4 py-3 text-slate-500 text-xs">{{ emp.email }}</td>
                <td class="px-4 py-3 text-slate-500 text-xs">{{ emp.department || '—' }}</td>
                <td class="px-4 py-3">
                  <span class="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">{{ emp.roleCode }}</span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-600">{{ emp.workMode }}</td>
                <td class="px-4 py-3 text-xs text-slate-600">{{ emp.officeLocation }}</td>
                <td class="px-4 py-3">
                  <span [class]="emp.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                        class="text-xs font-medium px-2 py-0.5 rounded-full">
                    {{ emp.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredEmployees().length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-slate-400 text-sm">No employees found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .field-label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; font-weight: 600; color: #1e293b; }
    .field-input { border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.6rem 0.85rem; font-size: 0.875rem; background: #f8fafc; width: 100%; }
    .field-input:focus { outline: none; border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  `]
})
export class AdminEmployeesPageComponent implements OnInit {
  private readonly baseUrl = environment.apiUrl;
  private readonly employeeIdPattern = /^[A-Z0-9_-]+$/;

  readonly tabs = [
    { id: 'add',  label: 'Add Employee', icon: 'person_add' },
    { id: 'bulk', label: 'Bulk Upload',  icon: 'upload_file' },
    { id: 'list', label: 'All Employees', icon: 'group' },
  ];

  readonly activeTab = signal<string>('add');
  readonly employees = signal<EmployeeRow[]>([]);
  readonly submitting = signal(false);
  readonly addSuccess = signal(false);
  readonly addError = signal('');
  readonly loadError = signal('');
  readonly dragOver = signal(false);
  readonly selectedFileName = signal('');
  readonly previewRows = signal<BulkPreviewRow[]>([]);
  readonly bulkSubmitting = signal(false);
  readonly bulkResult = signal<{ created: number; skipped: number; errors: string[] } | null>(null);

  searchQuery = '';
  private pendingFile: File | null = null;

  addForm: FormGroup;
  readonly locationOptions = signal<LocationResponse[]>([]);

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly session: SessionService,
    private readonly locationApi: LocationApiService
  ) {
    this.addForm = this.fb.group({
      employeeId:     ['', [Validators.required, Validators.maxLength(64), Validators.pattern(this.employeeIdPattern)]],
      fullName:       ['', [Validators.required, Validators.maxLength(200)]],
      email:          ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      department:     ['', [Validators.required, Validators.maxLength(120)]],
      roleCode:       ['EMPLOYEE', Validators.required],
      workMode:       ['HYBRID', Validators.required],
      officeLocation: ['HYDERABAD', Validators.required],
      password:       ['', [Validators.minLength(8), Validators.maxLength(100)]],
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.locationApi.getLocations().subscribe({
      next: (locs) => {
        this.locationOptions.set(locs);
        if (locs.length > 0) {
          this.addForm.patchValue({ officeLocation: locs[0].locationName.toUpperCase() });
        }
      },
      error: () => {
        this.locationOptions.set([
          { id: 1, locationName: 'HYDERABAD', employeeCount: 0 },
          { id: 2, locationName: 'KOLKATA', employeeCount: 0 }
        ]);
      }
    });
  }

  filteredEmployees(): EmployeeRow[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.employees();
    return this.employees().filter(e =>
      e.employeeId.toLowerCase().includes(q) ||
      e.fullName.toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q)
    );
  }

  touched(field: string): boolean {
    return !!this.addForm.get(field)?.touched;
  }

  fieldError(field: string): string {
    const control = this.addForm.get(field);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Required';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address';
    }
    if (control.hasError('pattern') && field === 'employeeId') {
      return 'Use only letters, numbers, hyphen, or underscore';
    }
    if (control.hasError('maxlength')) {
      return `Maximum ${control.getError('maxlength').requiredLength} characters`;
    }
    if (control.hasError('minlength') && field === 'password') {
      return 'Password must be at least 8 characters';
    }

    return 'Invalid value';
  }

  async submitAdd(): Promise<void> {
    this.addForm.markAllAsTouched();
    if (this.addForm.invalid) return;
    this.submitting.set(true);
    this.addSuccess.set(false);
    this.addError.set('');
    try {
      const created = await firstValueFrom(this.http.post<EmployeeRow>(
        `${this.baseUrl}/admin/employees`, this.addForm.value, { headers: this.authHeaders() }
      ));
      this.addSuccess.set(true);
      this.employees.update(list => [created, ...list.filter(e => e.employeeId !== created.employeeId)]);
      this.activeTab.set('list');
      this.addForm.reset({ roleCode: 'EMPLOYEE', workMode: 'HYBRID', officeLocation: 'HYDERABAD' });
      this.addForm.markAsPristine();
      this.addForm.markAsUntouched();
      this.loadEmployees();
      setTimeout(() => this.addSuccess.set(false), 3000);
    } catch (err: any) {
      this.addError.set(err?.error?.message ?? 'Failed to add employee');
    } finally {
      this.submitting.set(false);
    }
  }

  downloadTemplate(): void {
    const url = `${this.baseUrl}/admin/employees/template`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employee_upload_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.readFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.readFile(file);
  }

  private readFile(file: File): void {
    this.pendingFile = file;
    this.selectedFileName.set(file.name);
    this.bulkResult.set(null);
    // Parse preview client-side using SheetJS-like approach via backend preview
    // We'll just show file name and row count after upload
    this.previewViaBackend(file);
  }

  private async previewViaBackend(file: File): Promise<void> {
    // Upload to a lightweight preview endpoint — reuse bulk endpoint but parse only
    // For now show a simple "file selected" state with a manual preview request
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await firstValueFrom(
        this.http.post<{ rows: BulkPreviewRow[] }>(
          `${this.baseUrl}/admin/employees/preview`, formData, { headers: this.authHeadersNoContentType() }
        )
      );
      this.previewRows.set(result.rows);
    } catch {
      // If no preview endpoint, show basic placeholder
      this.previewRows.set([]);
      this.activeTab.set('bulk');
    }
  }

  async submitBulk(): Promise<void> {
    if (!this.pendingFile) return;
    this.bulkSubmitting.set(true);
    this.bulkResult.set(null);
    const formData = new FormData();
    formData.append('file', this.pendingFile);
    try {
      const result = await firstValueFrom(
        this.http.post<{ created: number; skipped: number; errors: string[]; rows?: BulkPreviewRow[] }>(
          `${this.baseUrl}/admin/employees/bulk`, formData, { headers: this.authHeadersNoContentType() }
        )
      );
      this.bulkResult.set(result);
      // Mark rows with status
      if (result.rows) {
        this.previewRows.set(result.rows);
      } else {
        // Mark all as ok/error based on errors list
        const errorRowNums = new Set(
          result.errors.map(e => parseInt(e.match(/Row (\d+)/)?.[1] ?? '0', 10))
        );
        this.previewRows.update(rows =>
          rows.map((r, i) => ({
            ...r,
            _status: errorRowNums.has(i + 3) ? 'error' : 'ok',
            _message: result.errors.find(e => e.startsWith(`Row ${i + 3}:`))?.split(': ').slice(1).join(': ')
          }))
        );
      }
      this.loadEmployees();
    } catch (err: any) {
      console.error('Bulk upload failed', err);
      const message = err?.error?.message ?? 'Bulk upload failed. Check template and required fields.';
      this.bulkResult.set({ created: 0, skipped: 0, errors: [message] });
    } finally {
      this.bulkSubmitting.set(false);
    }
  }

  private loadEmployees(): void {
    this.loadError.set('');
    this.http.get<EmployeeRow[]>(`${this.baseUrl}/admin/employees`, { headers: this.authHeaders() })
      .subscribe({
        next: list => this.employees.set(list),
        error: () => this.loadError.set('Failed to load employees from server')
      });
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.session.state()?.token ?? ''}` });
  }

  private authHeadersNoContentType(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.session.state()?.token ?? ''}` });
  }
}
