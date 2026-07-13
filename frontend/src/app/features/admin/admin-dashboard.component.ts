import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionService } from '../../core/services/session.service';
import {
  DateEventCount,
  DashboardStatsResponse,
  LocationResponse,
  LocationStatsResponse,
  LocationApiService
} from '../../core/services/location-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    /* ── Hyland Corporate Design System ── */

    .hy-page {
      min-height: 100vh;
      background: #F4F6F9;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Page Header ── */
    .hy-page-header {
      padding: 2rem 2rem 0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }
    .hy-page-kicker {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #0066CC;
      margin-bottom: 0.25rem;
    }
    .hy-page-title {
      font-size: 1.65rem;
      font-weight: 700;
      color: #0A1628;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .hy-page-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.25rem;
    }
    .hy-header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-shrink: 0;
    }

    /* ── Content Area ── */
    .hy-content {
      padding: 1.5rem 2rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1400px;
    }

    /* ── Divider accent line ── */
    .hy-accent-bar {
      height: 3px;
      background: linear-gradient(90deg, #0A1628 0% 34%, #14B8A6 34% 68%, #F59E0B 68% 100%);
      border-radius: 2px;
      width: 56px;
      margin-bottom: 1rem;
    }

    /* ── Stat Cards ── */
    .hy-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .hy-stat-card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: box-shadow 0.2s, transform 0.2s;
      position: relative;
      overflow: hidden;
    }
    .hy-stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 10px 10px 0 0;
    }
    .hy-stat-card.navy::before { background: linear-gradient(90deg, #0A1628, #1E4D8C); }
    .hy-stat-card.teal::before { background: linear-gradient(90deg, #0D9488, #14B8A6); }
    .hy-stat-card.sky::before  { background: linear-gradient(90deg, #0066CC, #38BDF8); }
    .hy-stat-card.gold::before { background: linear-gradient(90deg, #D97706, #F59E0B); }

    .hy-stat-card:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.09);
      transform: translateY(-1px);
    }
    .hy-stat-icon {
      width: 38px;
      height: 38px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .hy-stat-icon.navy { background: #EFF6FF; color: #1E4D8C; }
    .hy-stat-icon.teal { background: #F0FDFA; color: #0D9488; }
    .hy-stat-icon.sky  { background: #E0F2FE; color: #0066CC; }
    .hy-stat-icon.gold { background: #FFFBEB; color: #D97706; }

    .hy-stat-value {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .hy-stat-value.navy { color: #1E4D8C; }
    .hy-stat-value.teal { color: #0D9488; }
    .hy-stat-value.sky  { color: #0066CC; }
    .hy-stat-value.gold { color: #D97706; }
    .hy-stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748B;
      letter-spacing: 0.02em;
    }

    /* ── Card Panel ── */
    .hy-card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    .hy-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.1rem 1.5rem;
      border-bottom: 1px solid #F1F5F9;
      gap: 1rem;
    }
    .hy-card-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #0A1628;
      letter-spacing: -0.01em;
    }
    .hy-card-desc {
      font-size: 0.72rem;
      color: #94A3B8;
      margin-top: 1px;
    }

    /* ── Date Strip ── */
    .hy-date-strip {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 1rem 1.5rem;
      padding-bottom: 1.25rem;
      scrollbar-width: none;
    }
    .hy-date-strip::-webkit-scrollbar { display: none; }
    .hy-date-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      border: 1.5px solid transparent;
      cursor: pointer;
      transition: all 0.18s ease;
      background: #F8FAFC;
      min-width: 72px;
      gap: 0.1rem;
      flex-shrink: 0;
    }
    .hy-date-btn:hover {
      background: #EFF6FF;
      border-color: #BFDBFE;
    }
    .hy-date-btn.active {
      background: #0A1628;
      border-color: #0A1628;
      color: #fff;
      box-shadow: 0 4px 12px rgba(10,22,40,0.3);
    }
    .hy-date-btn.active .hy-date-event-badge {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }
    .hy-date-day { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94A3B8; }
    .hy-date-btn.active .hy-date-day { color: rgba(255,255,255,0.65); }
    .hy-date-num { font-size: 1.5rem; font-weight: 800; color: #0A1628; line-height: 1.1; }
    .hy-date-btn.active .hy-date-num { color: #fff; }
    .hy-date-mon { font-size: 0.65rem; font-weight: 500; color: #64748B; }
    .hy-date-btn.active .hy-date-mon { color: rgba(255,255,255,0.7); }
    .hy-date-event-badge {
      margin-top: 0.3rem;
      background: #EFF6FF;
      color: #1E4D8C;
      border-radius: 20px;
      padding: 1px 8px;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .hy-date-picker-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 8px;
      padding: 0.45rem 0.85rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .hy-date-picker-btn:hover {
      background: #EFF6FF;
      border-color: #93C5FD;
      color: #1E4D8C;
    }

    /* ── Buttons ── */
    .hy-btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #0A1628;
      color: #fff;
      border: 1.5px solid #0A1628;
      border-radius: 7px;
      padding: 0.45rem 0.9rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      letter-spacing: 0.01em;
      font-family: inherit;
    }
    .hy-btn-primary:hover { background: #1E4D8C; border-color: #1E4D8C; box-shadow: 0 3px 10px rgba(30,77,140,0.3); }

    .hy-btn-success {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #0D9488;
      color: #fff;
      border: 1.5px solid #0D9488;
      border-radius: 7px;
      padding: 0.4rem 0.8rem;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .hy-btn-success:hover { background: #0F766E; }

    .hy-btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: transparent;
      color: #64748B;
      border: 1.5px solid #E2E8F0;
      border-radius: 7px;
      padding: 0.4rem 0.8rem;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .hy-btn-ghost:hover { background: #F8FAFC; border-color: #CBD5E1; color: #334155; }

    .hy-btn-danger {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #FEF2F2;
      color: #DC2626;
      border: 1.5px solid #FECACA;
      border-radius: 7px;
      padding: 0.3rem 0.7rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .hy-btn-danger:hover { background: #FEE2E2; border-color: #FCA5A5; }

    .hy-btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: transparent;
      color: #1E4D8C;
      border: 1.5px solid #BFDBFE;
      border-radius: 7px;
      padding: 0.3rem 0.65rem;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .hy-btn-outline:hover { background: #EFF6FF; border-color: #93C5FD; }

    /* ── Input ── */
    .hy-input {
      border: 1.5px solid #E2E8F0;
      border-radius: 7px;
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
      font-family: inherit;
      color: #0A1628;
      background: #fff;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .hy-input:focus {
      border-color: #0066CC;
      box-shadow: 0 0 0 3px rgba(0,102,204,0.12);
    }

    /* ── Table ── */
    .hy-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .hy-table thead th {
      text-align: left;
      padding: 0.7rem 1.25rem;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748B;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
    }
    .hy-table tbody tr {
      border-bottom: 1px solid #F1F5F9;
      transition: background 0.15s;
      cursor: pointer;
    }
    .hy-table tbody tr:hover { background: #F8FAFC; }
    .hy-table tbody tr.selected { background: #EFF6FF; }
    .hy-table td { padding: 0.9rem 1.25rem; color: #1E293B; vertical-align: middle; }
    .hy-table .no-data td { text-align: center; color: #94A3B8; font-size: 0.8rem; padding: 3rem 1.5rem; cursor: default; }
    .hy-table .no-data td:hover { background: none; }

    /* ── Location avatar ── */
    .loc-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: linear-gradient(135deg, #0A1628, #1E4D8C);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 800;
      flex-shrink: 0;
      letter-spacing: -0.02em;
    }

    /* ── Badge ── */
    .hy-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 20px;
      padding: 2px 9px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .hy-badge.neutral { background: #F1F5F9; color: #475569; }
    .hy-badge.blue    { background: #DBEAFE; color: #1D4ED8; }

    /* ── Progress Bar ── */
    .hy-progress-wrap {
      background: #F1F5F9;
      border-radius: 100px;
      height: 6px;
      overflow: hidden;
      min-width: 80px;
      flex: 1;
    }
    .hy-progress-fill {
      height: 100%;
      border-radius: 100px;
      background: linear-gradient(90deg, #0D9488, #14B8A6);
      transition: width 0.4s ease;
    }
    .hy-progress-pct {
      font-size: 0.68rem;
      font-weight: 700;
      color: #64748B;
      min-width: 30px;
      text-align: right;
    }

    /* ── Section heading ── */
    .hy-section-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #94A3B8;
      padding: 0.9rem 1.5rem 0.5rem;
    }

    /* ── Close btn ── */
    .hy-close-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: #94A3B8;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .hy-close-btn:hover { background: #F1F5F9; color: #475569; }

    /* ── Metric highlights ── */
    .metric-blue  { font-size: 1.15rem; font-weight: 800; color: #1D4ED8; }
    .metric-teal  { font-size: 1.15rem; font-weight: 800; color: #0D9488; }
    .metric-amber { font-size: 1.15rem; font-weight: 800; color: #D97706; }

    /* ── Empty state ── */
    .hy-empty-icon {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }

    /* ── Animate fade-in ── */
    @keyframes hy-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hy-animate { animation: hy-fade-in 0.3s ease both; }
  `],
  template: `
    <div class="hy-page">

      <!-- ── Page Header ── -->
      <div class="hy-page-header">
        <div>
          <p class="hy-page-kicker">Admin Console</p>
          <h1 class="hy-page-title">Operations Dashboard</h1>
          <p class="hy-page-subtitle">Manage facilities, track bookings, and monitor office activity</p>
        </div>
        <div class="hy-header-actions">
          <button class="hy-btn-ghost" (click)="goFacilities()">
            <span class="material-icons-outlined" style="font-size:16px">apartment</span>
            Facilities
          </button>
          <button class="hy-btn-danger" (click)="logout()">
            <span class="material-icons-outlined" style="font-size:15px">logout</span>
            Sign Out
          </button>
        </div>
      </div>

      <!-- ── Content Body ── -->
      <div class="hy-content">

        <!-- ── KPI Stats Row ── -->
        <div class="hy-stats-grid hy-animate">
          <div class="hy-stat-card gold">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div class="hy-stat-icon gold">
                <span class="material-icons-outlined" style="font-size:19px">schedule</span>
              </div>
              <span style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94A3B8;">CUTOFF</span>
            </div>
            <div>
              <p class="hy-stat-value gold">{{ dashStats()?.todaysDeadline ?? '—' }}</p>
              <p class="hy-stat-label">Today's Deadline</p>
            </div>
          </div>
        </div>

        <!-- ── Date Selector ── -->
        <div class="hy-card hy-animate" style="animation-delay:0.05s">
          <div class="hy-card-header">
            <div>
              <p class="hy-card-title">Date Navigator</p>
              <p class="hy-card-desc">Select a date to filter bookings and activity</p>
            </div>
            <label class="hy-date-picker-btn">
              <span class="material-icons-outlined" style="font-size:15px">calendar_month</span>
              Pick Date
              <input type="date" style="position:absolute;opacity:0;width:0;height:0;" [value]="selectedDate()" (change)="onDatePick($event)" />
            </label>
          </div>

          <div class="hy-date-strip">
            <ng-container *ngIf="dateStrip().length > 0">
              <button *ngFor="let d of dateStrip()"
                      (click)="selectDate(d.date)"
                      class="hy-date-btn"
                      [class.active]="d.date === selectedDate()">
                <span class="hy-date-day">{{ d.label }}</span>
                <span class="hy-date-num">{{ d.date | date:'d' }}</span>
                <span class="hy-date-mon">{{ d.date | date:'MMM' }}</span>
                <span class="hy-date-event-badge">{{ d.eventCount }}</span>
              </button>
            </ng-container>

            <ng-container *ngIf="dateStrip().length === 0">
              <button *ngFor="let d of fallbackStrip"
                      (click)="selectDate(d.date)"
                      class="hy-date-btn"
                      [class.active]="d.date === selectedDate()">
                <span class="hy-date-day">{{ d.label }}</span>
                <span class="hy-date-num">{{ d.date | date:'d' }}</span>
                <span class="hy-date-mon">{{ d.date | date:'MMM' }}</span>
                <span class="hy-date-event-badge">0</span>
              </button>
            </ng-container>
          </div>
        </div>

        <!-- ── Office Locations Table ── -->
        <div class="hy-card hy-animate" style="animation-delay:0.1s">
          <div class="hy-card-header">
            <div>
              <p class="hy-card-title">Office Locations</p>
              <p class="hy-card-desc">Manage corporate offices — click a row to view facility activity</p>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <ng-container *ngIf="!showAddForm()">
                <button (click)="showAddForm.set(true)" class="hy-btn-primary">
                  <span style="font-size:1rem;line-height:1;">+</span>
                  Add Location
                </button>
              </ng-container>
              <ng-container *ngIf="showAddForm()">
                <input type="text" [(ngModel)]="newLocationName"
                       placeholder="e.g. Mumbai HQ"
                       class="hy-input" style="width:160px;"
                       (keydown.enter)="addLocation()"
                       (keydown.escape)="cancelAdd()" />
                <button (click)="addLocation()" class="hy-btn-success">Save</button>
                <button (click)="cancelAdd()" class="hy-btn-ghost">Cancel</button>
              </ng-container>
            </div>
          </div>

          <table class="hy-table">
            <thead>
              <tr>
                <th>Office Location</th>
                <th>Employee Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let loc of locations()"
                  (click)="selectLocation(loc)"
                  [class.selected]="selectedLocation()?.id === loc.id">
                <td>
                  <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div class="loc-avatar">{{ loc.locationName.charAt(0) }}</div>
                    <div>
                      <p style="font-weight:700;color:#0A1628;font-size:0.84rem;margin:0;">{{ loc.locationName }}</p>
                      <p style="font-size:0.68rem;color:#94A3B8;margin:0;margin-top:1px;">
                        Click to view facility stats →
                      </p>
                    </div>
                  </div>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <ng-container *ngIf="editingLocationId() !== loc.id">
                      <span style="font-size:1.1rem;font-weight:800;color:#0A1628;">{{ loc.employeeCount }}</span>
                      <button (click)="startEditCount(loc)" class="hy-btn-outline">Edit</button>
                    </ng-container>
                    <ng-container *ngIf="editingLocationId() === loc.id">
                      <input type="number" [(ngModel)]="editCountValue" min="0"
                             class="hy-input" style="width:90px;"
                             (keydown.enter)="saveCount(loc)"
                             (keydown.escape)="editingLocationId.set(null)" />
                      <button (click)="saveCount(loc)" class="hy-btn-success">✓</button>
                      <button (click)="editingLocationId.set(null)" class="hy-btn-ghost">✕</button>
                    </ng-container>
                  </div>
                </td>
                <td (click)="$event.stopPropagation()">
                  <button (click)="deleteLocation(loc)" class="hy-btn-danger">Remove</button>
                </td>
              </tr>
              <tr *ngIf="locations().length === 0" class="no-data">
                <td colspan="3">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;">
                    <div class="hy-empty-icon">🏢</div>
                    <p style="font-weight:600;color:#64748B;margin:0;">No office locations yet</p>
                    <p style="color:#94A3B8;font-size:0.73rem;margin:0;">Click "+ Add Location" to create your first office</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Facility Activity Panel ── -->
        <div *ngIf="selectedLocation() && locationStats()" class="hy-card hy-animate" style="animation-delay:0.05s">
          <div class="hy-card-header">
            <div>
              <p class="hy-card-title">
                Facility Activity — {{ selectedLocation()!.locationName }}
              </p>
              <p class="hy-card-desc">
                {{ selectedDate() | date:'MMMM d, yyyy' }}
              </p>
            </div>
            <button class="hy-close-btn"
                    (click)="selectedLocation.set(null); locationStats.set(null)"
                    title="Close">✕</button>
          </div>

          <table class="hy-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Category</th>
                <th style="text-align:center;">Requested</th>
                <th style="text-align:center;">Acknowledged</th>
                <th style="text-align:center;">Pending</th>
                <th style="min-width:160px;">Progress</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of locationStats()!.facilityStats" style="cursor:default;">
                <td style="font-weight:700;color:#0A1628;">{{ row.facilityName }}</td>
                <td>
                  <span class="hy-badge neutral">{{ row.category || '—' }}</span>
                </td>
                <td style="text-align:center;">
                  <span class="metric-blue">{{ row.totalRequested }}</span>
                </td>
                <td style="text-align:center;">
                  <span class="metric-teal">{{ row.acknowledged }}</span>
                </td>
                <td style="text-align:center;">
                  <span class="metric-amber">{{ row.totalRequested - row.acknowledged }}</span>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div class="hy-progress-wrap">
                      <div class="hy-progress-fill" [style.width]="getProgressWidth(row)"></div>
                    </div>
                    <span class="hy-progress-pct">{{ getProgressPct(row) }}%</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="locationStats()!.facilityStats.length === 0" class="no-data">
                <td colspan="6">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;">
                    <div class="hy-empty-icon">📊</div>
                    <p style="font-weight:600;color:#64748B;margin:0;">No published facilities</p>
                    <p style="color:#94A3B8;font-size:0.73rem;margin:0;">Publish a facility to see it tracked here</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {

  // ── date state ────────────────────────────────────────────────────────────
  selectedDate  = signal<string>(this.today());
  dateStrip     = signal<DateEventCount[]>([]);
  dashStats     = signal<DashboardStatsResponse | null>(null);

  /** Fallback 5-day strip shown while backend loads */
  readonly fallbackStrip = this.buildFallbackStrip();

  // ── locations state ───────────────────────────────────────────────────────
  locations        = signal<LocationResponse[]>([]);
  selectedLocation = signal<LocationResponse | null>(null);
  locationStats    = signal<LocationStatsResponse | null>(null);

  // ── add location form ─────────────────────────────────────────────────────
  showAddForm     = signal(false);
  newLocationName = '';

  // ── edit count ────────────────────────────────────────────────────────────
  editingLocationId = signal<number | null>(null);
  editCountValue    = 0;

  constructor(
    private readonly locationApi: LocationApiService,
    private readonly sessionService: SessionService,
    private readonly authApi: AuthApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadLocations();
  }

  // ── dashboard ─────────────────────────────────────────────────────────────

  private async loadDashboard(): Promise<void> {
    try {
      const stats = await firstValueFrom(this.locationApi.getDashboardStats(this.selectedDate()));
      this.dashStats.set(stats);
      this.dateStrip.set(stats.dateStrip);
    } catch { /* backend may not be ready */ }
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.loadDashboard();
    if (this.selectedLocation()) this.loadLocationStats(this.selectedLocation()!);
  }

  onDatePick(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    if (v) this.selectDate(v);
  }

  // ── locations ─────────────────────────────────────────────────────────────

  private async loadLocations(): Promise<void> {
    try {
      this.locations.set(await firstValueFrom(this.locationApi.getLocations()));
    } catch { /* ignore */ }
  }

  async addLocation(): Promise<void> {
    const name = this.newLocationName.trim();
    if (!name) return;
    try {
      const created = await firstValueFrom(this.locationApi.createLocation(name));
      this.locations.update(ls => [...ls, created]);
      this.newLocationName = '';
      this.showAddForm.set(false);
    } catch (e: any) { alert(e?.error?.message ?? 'Failed to create location'); }
  }

  cancelAdd(): void { this.newLocationName = ''; this.showAddForm.set(false); }

  startEditCount(loc: LocationResponse): void {
    this.editCountValue = loc.employeeCount;
    this.editingLocationId.set(loc.id);
  }

  async saveCount(loc: LocationResponse): Promise<void> {
    try {
      const updated = await firstValueFrom(this.locationApi.updateEmployeeCount(loc.id, this.editCountValue));
      this.locations.update(ls => ls.map(l => l.id === loc.id ? updated : l));
      if (this.selectedLocation()?.id === loc.id) this.selectedLocation.set(updated);
      this.editingLocationId.set(null);
    } catch (e: any) { alert(e?.error?.message ?? 'Failed to update count'); }
  }

  async deleteLocation(loc: LocationResponse): Promise<void> {
    if (!confirm(`Remove "${loc.locationName}"?`)) return;
    try {
      await firstValueFrom(this.locationApi.deleteLocation(loc.id));
      this.locations.update(ls => ls.filter(l => l.id !== loc.id));
      if (this.selectedLocation()?.id === loc.id) { this.selectedLocation.set(null); this.locationStats.set(null); }
    } catch (e: any) { alert(e?.error?.message ?? 'Failed to delete location'); }
  }

  async selectLocation(loc: LocationResponse): Promise<void> {
    if (this.selectedLocation()?.id === loc.id) { this.selectedLocation.set(null); this.locationStats.set(null); return; }
    this.selectedLocation.set(loc);
    await this.loadLocationStats(loc);
  }

  private async loadLocationStats(loc: LocationResponse): Promise<void> {
    try {
      this.locationStats.set(await firstValueFrom(this.locationApi.getLocationStats(loc.id, this.selectedDate())));
    } catch { /* ignore */ }
  }

  // ── progress helpers ──────────────────────────────────────────────────────

  getProgressWidth(row: { totalRequested: number; acknowledged: number }): string {
    if (!row.totalRequested) return '0%';
    return Math.round((row.acknowledged / row.totalRequested) * 100) + '%';
  }

  getProgressPct(row: { totalRequested: number; acknowledged: number }): number {
    if (!row.totalRequested) return 0;
    return Math.round((row.acknowledged / row.totalRequested) * 100);
  }

  // ── utils ─────────────────────────────────────────────────────────────────

  private today(): string { return new Date().toISOString().split('T')[0]; }

  private buildFallbackStrip(): { date: string; label: string }[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    return [-2, -1, 0, 1, 2].map(offset => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      return { date: d.toISOString().split('T')[0], label: days[d.getDay()] };
    });
  }

  goFacilities(): void { this.router.navigateByUrl('/admin/facilities'); }

  async logout(): Promise<void> {
    const token = this.sessionService.getToken();
    if (token) { try { await firstValueFrom(this.authApi.logout(token)); } catch { /* ignore */ } }
    this.sessionService.clear();
    this.router.navigateByUrl('/login');
  }
}
