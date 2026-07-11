import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FacilityField } from '../../../core/models/specification.models';

@Component({
  selector: 'app-builder-live-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="flex flex-col items-center gap-3 select-none">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Live Preview</p>

      <!-- Phone shell -->
      <div class="relative mx-auto"
           style="width:260px; background:#111827; border-radius:2.8rem; padding:12px; box-shadow:0 0 0 2px #374151, 0 30px 80px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08);">

        <!-- Side buttons -->
        <div style="position:absolute;left:-3px;top:76px;width:3px;height:26px;background:#374151;border-radius:2px 0 0 2px;"></div>
        <div style="position:absolute;left:-3px;top:112px;width:3px;height:46px;background:#374151;border-radius:2px 0 0 2px;"></div>
        <div style="position:absolute;left:-3px;top:168px;width:3px;height:46px;background:#374151;border-radius:2px 0 0 2px;"></div>
        <div style="position:absolute;right:-3px;top:110px;width:3px;height:60px;background:#374151;border-radius:0 2px 2px 0;"></div>

        <!-- Screen -->
        <div style="border-radius:2.2rem;overflow:hidden;background:#f8fafc;height:520px;display:flex;flex-direction:column;">

          <!-- Status bar -->
          <div style="background:#0f172a;display:flex;align-items:center;justify-content:space-between;padding:6px 18px 4px;flex-shrink:0;">
            <span style="color:#e2e8f0;font-size:9px;font-weight:700;letter-spacing:0.04em;">9:41</span>
            <div style="width:54px;height:10px;background:#000;border-radius:20px;"></div>
            <div style="display:flex;gap:4px;align-items:center;">
              <span class="material-icons-outlined" style="font-size:9px;color:#94a3b8;">signal_cellular_alt</span>
              <span class="material-icons-outlined" style="font-size:9px;color:#94a3b8;">wifi</span>
              <span class="material-icons-outlined" style="font-size:9px;color:#94a3b8;">battery_std</span>
            </div>
          </div>

          <!-- App header -->
          <div style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:10px 14px 12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="material-icons-outlined" style="font-size:15px;color:rgba(255,255,255,0.85);">arrow_back_ios</span>
              <div style="flex:1;">
                <p style="font-size:11px;color:rgba(255,255,255,0.65);margin:0;">Booking</p>
                <p style="font-size:13px;font-weight:700;color:#fff;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px;">{{ facilityName || 'New Facility' }}</p>
              </div>
              <span class="material-icons-outlined" style="font-size:17px;color:rgba(255,255,255,0.7);">more_vert</span>
            </div>
          </div>

          <!-- Scrollable form area -->
          <div style="flex:1;overflow-y:auto;padding:12px 10px 10px;display:flex;flex-direction:column;gap:10px;position:relative;"
               class="preview-scroll">

            <!-- Empty state -->
            <ng-container *ngIf="fields.length === 0">
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:20px 0;">
                <div style="width:48px;height:48px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;">
                  <span class="material-icons-outlined" style="font-size:24px;color:#6366f1;">dynamic_form</span>
                </div>
                <p style="font-size:11px;color:#94a3b8;text-align:center;margin:0;">Add fields to see<br>the live preview</p>
              </div>
            </ng-container>

            <!-- Fields -->
            <ng-container *ngFor="let field of fields; let i = index">
              <div style="background:#fff;border-radius:10px;padding:8px 10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                <label style="font-size:9.5px;font-weight:700;color:#374151;display:block;margin-bottom:4px;letter-spacing:0.02em;">
                  {{ field.label }}<span *ngIf="field.required" style="color:#f43f5e;margin-left:2px;">*</span>
                </label>

                <ng-container [ngSwitch]="field.fieldType">

                  <!-- DROPDOWN — interactive -->
                  <div *ngSwitchCase="'DROPDOWN'" style="position:relative;">
                    <div (click)="toggleDropdown(i)"
                         style="border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                      <span style="font-size:9px;color:#374151;">{{ dropdownSelections.get(i) || (field.options?.[0] || 'Select...') }}</span>
                      <span class="material-icons-outlined" style="font-size:11px;color:#6366f1;">{{ openDropdownIndex === i ? 'expand_less' : 'expand_more' }}</span>
                    </div>
                    <div *ngIf="openDropdownIndex === i"
                         style="position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);z-index:10;overflow:hidden;">
                      <div *ngFor="let opt of (field.options?.length ? field.options : ['Option 1','Option 2'])"
                           (click)="selectDropdown(i, opt)"
                           style="padding:5px 9px;font-size:9px;cursor:pointer;"
                           [style.background]="dropdownSelections.get(i) === opt ? '#eef2ff' : '#fff'"
                           [style.color]="dropdownSelections.get(i) === opt ? '#4f46e5' : '#374151'"
                           [style.fontWeight]="dropdownSelections.get(i) === opt ? '700' : '400'">
                        {{ opt }}
                      </div>
                    </div>
                  </div>

                  <!-- CHECKBOX — interactive -->
                  <div *ngSwitchCase="'CHECKBOX'" style="display:flex;flex-direction:column;gap:4px;">
                    <label *ngFor="let opt of (field.options?.length ? field.options : ['Option 1'])"
                           (click)="toggleCheck(i, opt)"
                           style="display:flex;align-items:center;gap:5px;font-size:9px;color:#475569;cursor:pointer;">
                      <span [style.background]="isChecked(i,opt) ? '#4f46e5' : '#f8fafc'"
                            [style.border]="isChecked(i,opt) ? '1.5px solid #4f46e5' : '1.5px solid #e2e8f0'"
                            style="width:12px;height:12px;border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
                        <span *ngIf="isChecked(i,opt)" class="material-icons-outlined" style="font-size:8px;color:#fff;">check</span>
                      </span>
                      {{ opt }}
                    </label>
                  </div>

                  <!-- RADIO — interactive -->
                  <div *ngSwitchCase="'RADIO_BUTTON'" style="display:flex;flex-direction:column;gap:4px;">
                    <label *ngFor="let opt of (field.options?.length ? field.options : ['Option 1'])"
                           (click)="selectRadio(i, opt)"
                           style="display:flex;align-items:center;gap:5px;font-size:9px;color:#475569;cursor:pointer;">
                      <span style="width:12px;height:12px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;"
                            [style.border]="radioSelections.get(i) === opt ? '2px solid #4f46e5' : '1.5px solid #e2e8f0'"
                            [style.background]="radioSelections.get(i) === opt ? '#eef2ff' : '#f8fafc'">
                        <span *ngIf="radioSelections.get(i) === opt" style="width:5px;height:5px;border-radius:50%;background:#4f46e5;display:block;"></span>
                      </span>
                      {{ opt }}
                    </label>
                  </div>

                  <!-- TEXTAREA -->
                  <div *ngSwitchCase="'TEXTAREA'" style="border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;background:#f8fafc;height:38px;">
                    <span style="font-size:9px;color:#cbd5e1;">{{ field.placeholder || 'Enter text...' }}</span>
                  </div>

                  <!-- DATE -->
                  <div *ngSwitchCase="'DATE_PICKER'" style="border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:9px;color:#94a3b8;">MM / DD / YYYY</span>
                    <span class="material-icons-outlined" style="font-size:11px;color:#6366f1;">calendar_today</span>
                  </div>

                  <!-- TIME -->
                  <div *ngSwitchCase="'TIME_PICKER'" style="border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:9px;color:#94a3b8;">HH : MM</span>
                    <span class="material-icons-outlined" style="font-size:11px;color:#6366f1;">schedule</span>
                  </div>

                  <!-- EMAIL -->
                  <div *ngSwitchCase="'EMAIL'" style="border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:9px;color:#94a3b8;">{{ field.placeholder || 'you@company.com' }}</span>
                    <span class="material-icons-outlined" style="font-size:11px;color:#94a3b8;">alternate_email</span>
                  </div>

                  <!-- PHONE -->
                  <div *ngSwitchCase="'PHONE'" style="border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:9px;color:#94a3b8;">{{ field.placeholder || '+1 (555) 000-0000' }}</span>
                    <span class="material-icons-outlined" style="font-size:11px;color:#94a3b8;">phone</span>
                  </div>

                  <!-- NUMBER -->
                  <div *ngSwitchCase="'NUMBER'" style="border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;background:#f8fafc;">
                    <span style="font-size:9px;color:#94a3b8;">{{ field.placeholder || '0' }}</span>
                  </div>

                  <!-- FILE UPLOAD -->
                  <div *ngSwitchCase="'FILE_UPLOAD'" style="border:1.5px dashed #c7d2fe;border-radius:7px;padding:8px;background:#eef2ff;display:flex;flex-direction:column;align-items:center;gap:3px;">
                    <span class="material-icons-outlined" style="font-size:16px;color:#6366f1;">cloud_upload</span>
                    <span style="font-size:8.5px;color:#6366f1;font-weight:600;">Tap to upload</span>
                  </div>

                  <!-- QR SCANNER -->
                  <div *ngSwitchCase="'QR_SCANNER'" style="border:1.5px dashed #c7d2fe;border-radius:7px;padding:8px;background:#eef2ff;display:flex;flex-direction:column;align-items:center;gap:3px;">
                    <span class="material-icons-outlined" style="font-size:16px;color:#6366f1;">qr_code_scanner</span>
                    <span style="font-size:8.5px;color:#6366f1;font-weight:600;">Scan QR Code</span>
                  </div>

                  <!-- SIGNATURE -->
                  <div *ngSwitchCase="'SIGNATURE'" style="border:1.5px dashed #e2e8f0;border-radius:7px;padding:8px;background:#f8fafc;display:flex;align-items:center;justify-content:center;height:36px;">
                    <span style="font-size:8.5px;color:#94a3b8;">Sign here</span>
                  </div>

                  <!-- DEFAULT -->
                  <div *ngSwitchDefault style="border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;background:#f8fafc;">
                    <span style="font-size:9px;color:#94a3b8;">{{ field.placeholder || 'Enter value...' }}</span>
                  </div>

                </ng-container>

                <p *ngIf="field.helpText" style="font-size:8px;color:#94a3b8;margin-top:3px;">{{ field.helpText }}</p>
              </div>
            </ng-container>

            <!-- Submit -->
            <div *ngIf="fields.length > 0"
                 (click)="submitTapped = true"
                 style="background:linear-gradient(135deg,#4f46e5,#6366f1);border-radius:10px;padding:8px;text-align:center;margin-top:2px;box-shadow:0 4px 12px rgba(99,102,241,0.35);cursor:pointer;transition:opacity 0.2s;"
                 [style.opacity]="submitTapped ? '0.7' : '1'">
              <span style="font-size:10px;font-weight:700;color:#fff;letter-spacing:0.04em;">
                {{ submitTapped ? '✓ SUBMITTED' : 'SUBMIT BOOKING' }}
              </span>
            </div>

          </div>

          <!-- Home indicator -->
          <div style="background:#f8fafc;padding:8px 0 6px;display:flex;justify-content:center;flex-shrink:0;">
            <div style="width:80px;height:4px;background:#1e293b;border-radius:4px;opacity:0.25;"></div>
          </div>
        </div>
      </div>

      <p class="text-[10px] text-slate-400">{{ fields.length }} field{{ fields.length !== 1 ? 's' : '' }}</p>
    </aside>
  `,
  styles: [`
    .preview-scroll::-webkit-scrollbar { width: 3px; }
    .preview-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
    .preview-scroll::-webkit-scrollbar-track { background: transparent; }
  `]
})
export class BuilderLivePreviewComponent implements OnChanges {
  @Input() facilityName = '';
  @Input({ required: true }) fields: FacilityField[] = [];

  openDropdownIndex: number | null = null;
  dropdownSelections = new Map<number, string>();
  checkedItems = new Map<number, Set<string>>();
  radioSelections = new Map<number, string>();
  submitTapped = false;

  ngOnChanges(): void {
    // Reset interactive state when fields change
    this.openDropdownIndex = null;
    this.dropdownSelections.clear();
    this.checkedItems.clear();
    this.radioSelections.clear();
    this.submitTapped = false;
  }

  toggleDropdown(index: number): void {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  selectDropdown(index: number, value: string): void {
    this.dropdownSelections.set(index, value);
    this.openDropdownIndex = null;
  }

  toggleCheck(index: number, option: string): void {
    if (!this.checkedItems.has(index)) {
      this.checkedItems.set(index, new Set());
    }
    const set = this.checkedItems.get(index)!;
    set.has(option) ? set.delete(option) : set.add(option);
    // Trigger change detection by replacing the map
    this.checkedItems = new Map(this.checkedItems);
  }

  isChecked(index: number, option: string): boolean {
    return this.checkedItems.get(index)?.has(option) ?? false;
  }

  selectRadio(index: number, option: string): void {
    this.radioSelections = new Map(this.radioSelections.set(index, option));
  }
}
