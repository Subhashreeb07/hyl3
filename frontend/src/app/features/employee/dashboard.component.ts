import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AvailableFacility, BookingHistoryItem, DashboardFacility } from '../../core/models/employee-flow.models';
import { BookingApiService } from '../../core/services/booking-api.service';
import { EmployeeApiService } from '../../core/services/employee-api.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';


@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule],

  styles: [`
    /* ── Hyland Employee Dashboard Design System ── */

    .hy-page {
      min-height: 100%;
      background: #F4F6F9;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Page Header ── */
    .hy-page-header {
      background: #fff;
      border-bottom: 1px solid #E2E8F0;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .hy-page-logo-area {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .hy-page-title-sm {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0A1628;
      letter-spacing: -0.01em;
    }
    .hy-header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* ── Content Area ── */
    .hy-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.75rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    @media (max-width: 640px) { .hy-content { padding: 1rem; } }

    /* ── Welcome Banner ── */
    .hy-welcome-banner {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      color: #0A1628;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .hy-welcome-banner::before {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: rgba(0,0,0,0.02);
    }
    .hy-welcome-banner::after {
      content: '';
      position: absolute;
      bottom: -50px;
      right: 80px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(0,0,0,0.02);
    }
    .hy-welcome-kicker {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #0066CC;
      margin-bottom: 0.4rem;
    }
    .hy-welcome-name {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .hy-welcome-sub {
      font-size: 0.9rem;
      color: #64748B;
      margin-top: 0.4rem;
    }
    .hy-accent-strip {
      display: flex;
      gap: 4px;
      margin-top: 1.25rem;
      position: relative;
      z-index: 1;
      width: 56px;
    }
    .hy-accent-strip span {
      height: 3px;
      border-radius: 2px;
      background: linear-gradient(90deg, #0A1628 0%, #14B8A6 50%, #F59E0B 100%);
      flex: 1;
    }

    /* ── Card ── */
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
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #F1F5F9;
    }
    .hy-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0A1628;
    }
    .hy-card-desc {
      font-size: 0.8rem;
      color: #64748B;
      margin-top: 2px;
    }

    /* ── Date Strip ── */
    .hy-date-strip-wrap {
      padding: 1rem 1.5rem;
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .hy-date-strip-wrap::-webkit-scrollbar { display: none; }

    .hy-date-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
      padding: 1.25rem 0.5rem;
      border-radius: 12px;
      border: 1.5px solid transparent;
      cursor: pointer;
      background: #F8FAFC;
      flex: 0 0 calc((100% - 4rem) / 5);
      min-width: 90px;
      transition: all 0.18s ease;
      font-family: inherit;
    }
    .hy-date-btn:disabled {
      opacity: 0.38;
      cursor: not-allowed;
    }

    .hy-date-btn.today-btn:not(.active) {
      border-color: #CBD5E1;
      background: #F8FAFC;
    }
    .hy-date-btn.active {
      background: #0A1628;
      border-color: #0A1628;
      box-shadow: 0 4px 12px rgba(10,22,40,0.3);
    }
    .hy-date-btn .d-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #0A1628;
    }
    .hy-date-btn.active .d-label { color: #fff; }
    .hy-date-btn .d-num {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0A1628;
      line-height: 1.1;
      margin: 0.2rem 0;
    }
    .hy-date-btn.active .d-num { color: #fff; }
    .hy-date-btn:disabled .d-num { color: #CBD5E1; }
    .hy-date-btn .d-mon {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748B;
    }
    .hy-date-btn.active .d-mon { color: rgba(255,255,255,0.7); }
    .hy-date-badge {
      margin-top: 0.6rem;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.6rem;
      font-weight: 700;
      background: #E2E8F0;
      color: #475569;
    }
    .hy-date-btn.active .hy-date-badge {
      background: rgba(255,255,255,0.15);
      color: #fff;
    }

    /* ── Jump to date btn ── */
    .hy-jump-btn {
      display: inline-flex;
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
      font-family: inherit;
      position: relative;
    }
    .hy-jump-btn:hover { background: #EFF6FF; border-color: #93C5FD; color: #1E4D8C; }

    /* ── Section heading ── */
    .hy-section-heading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .hy-section-label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #64748B;
    }
    .hy-section-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #F1F5F9;
      color: #475569;
      border-radius: 20px;
      padding: 1px 9px;
      font-size: 0.68rem;
      font-weight: 700;
    }
    .hy-section-divider {
      flex: 1;
      height: 1px;
      background: #F1F5F9;
    }

    /* ── Date heading ── */
    .hy-date-heading {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0A1628;
      letter-spacing: -0.02em;
    }
    .hy-refresh-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: transparent;
      border: none;
      font-size: 0.72rem;
      font-weight: 600;
      color: #94A3B8;
      cursor: pointer;
      transition: color 0.15s;
      font-family: inherit;
      padding: 0;
    }
    .hy-refresh-btn:hover { color: #475569; }

    /* ── Booking mini card ── */
    .hy-booking-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      cursor: pointer;
      transition: all 0.18s;
    }
    .hy-booking-card:hover {
      border-color: #CBD5E1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .hy-booking-icon {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #EFF6FF;
      color: #1E4D8C;
      flex-shrink: 0;
    }

    /* ── Status badge ── */
    .hy-status {
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .hy-status.confirmed { background: #F0FDF4; color: #15803D; }
    .hy-status.cancelled { background: #FEF2F2; color: #DC2626; }
    .hy-status.pending   { background: #FFFBEB; color: #D97706; }
    .hy-status.default   { background: #F1F5F9; color: #475569; }

    /* ── Facility Grid ── */
    .hy-facility-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    /* ── Facility Card ── */
    .hy-facility-card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0;
      transition: all 0.2s ease;
      cursor: default;
      position: relative;
    }
    .hy-facility-card:hover {
      border-color: #CBD5E1;
      box-shadow: 0 6px 20px rgba(0,0,0,0.07);
      transform: translateY(-1px);
    }
    .hy-facility-card.booked {
      border-color: #A7F3D0;
      background: linear-gradient(180deg, #fff 0%, #F0FDF4 100%);
    }
    .hy-facility-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      border-radius: 10px 10px 0 0;
      background: linear-gradient(90deg, #0A1628, #1E4D8C);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .hy-facility-card:hover::before { opacity: 1; }
    .hy-facility-card.booked::before { background: linear-gradient(90deg, #0D9488, #14B8A6); opacity: 1; }

    .hy-facility-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .hy-facility-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      border: 1.5px solid #E2E8F0;
      background: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      transition: all 0.18s;
    }
    .hy-facility-card:hover .hy-facility-icon-wrap {
      border-color: #CBD5E1;
      background: #EFF6FF;
      color: #1E4D8C;
    }

    /* availability badges */
    .hy-avail-badge {
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }
    .hy-avail-badge.open    { background: #EFF6FF; color: #1D4ED8; }
    .hy-avail-badge.booked  { background: #F0FDF4; color: #15803D; }
    .hy-avail-badge.closed  { background: #FEF2F2; color: #DC2626; }
    .hy-avail-badge.ended   { background: #F1F5F9; color: #64748B; }

    .hy-facility-category {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #94A3B8;
      margin-bottom: 0.25rem;
    }
    .hy-facility-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0A1628;
      line-height: 1.3;
      margin-bottom: 0.35rem;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .hy-facility-desc {
      font-size: 0.8rem;
      color: #64748B;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .hy-facility-window {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.78rem;
      color: #64748B;
      margin-top: 0.6rem;
    }
    .hy-facility-unavail-reason {
      font-size: 0.78rem;
      color: #DC2626;
      margin-top: 0.5rem;
    }

    /* ── CTA Footer ── */
    .hy-facility-cta {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #F1F5F9;
      display: flex;
      gap: 0.5rem;
    }
    .hy-btn-book {
      flex: 1;
      background: #0A1628;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0.65rem 0;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      letter-spacing: 0.02em;
    }
    .hy-btn-book:hover { background: #1E4D8C; box-shadow: 0 3px 10px rgba(30,77,140,0.3); }
    .hy-btn-view {
      flex: 1;
      background: transparent;
      color: #15803D;
      border: 1.5px solid #A7F3D0;
      border-radius: 8px;
      padding: 0.65rem 0;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .hy-btn-view:hover { background: #F0FDF4; border-color: #6EE7B7; }
    .hy-btn-again {
      background: transparent;
      color: #475569;
      border: 1.5px solid #E2E8F0;
      border-radius: 8px;
      padding: 0.65rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .hy-btn-again:hover { background: #F8FAFC; border-color: #CBD5E1; }
    .hy-unavail-btn {
      flex: 1;
      background: #F8FAFC;
      color: #94A3B8;
      border: 1.5px solid #E2E8F0;
      border-radius: 8px;
      padding: 0.65rem 0;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      text-align: center;
      cursor: default;
    }

    /* ── Loading state ── */
    .hy-loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      gap: 0.75rem;
    }
    .hy-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #E2E8F0;
      border-top-color: #0A1628;
      border-radius: 50%;
      animation: hy-spin 0.7s linear infinite;
    }
    @keyframes hy-spin { to { transform: rotate(360deg); } }

    /* ── Empty state ── */
    .hy-empty-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      text-align: center;
    }
    .hy-empty-icon-lg {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      opacity: 0.35;
    }
    .hy-empty-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.25rem;
    }
    .hy-empty-sub {
      font-size: 0.78rem;
      color: #94A3B8;
      max-width: 280px;
    }

    /* ── Icon buttons ── */
    .hy-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      color: #64748B;
      transition: all 0.15s;
      position: relative;
    }
    .hy-icon-btn:hover { background: #F1F5F9; color: #0A1628; }
    .hy-notif-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #EF4444;
      border: 1.5px solid #fff;
    }

    /* ── Avatar ── */
    .hy-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0A1628, #1E4D8C);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }

    /* ── Animate ── */
    @keyframes hy-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hy-animate { animation: hy-fade-in 0.3s ease both; }

    .bookings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.75rem;
      padding: 1rem 1.5rem;
    }
  `],
  template: `
    <div class="hy-page">

      <!-- ── Sticky Top Bar ── -->
      <header class="hy-page-header">
        <div class="hy-page-logo-area">
          <div style="width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#0A1628,#1E4D8C);display:flex;align-items:center;justify-content:center;">
            <span class="material-icons-outlined" style="font-size:14px;color:#fff;">business_center</span>
          </div>
          <span class="hy-page-title-sm">Employee Workspace</span>
        </div>

        <div class="hy-header-actions">
          <button class="hy-icon-btn" (click)="goHistory()" title="Booking Records">
            <span class="material-icons-outlined" style="font-size:20px">receipt_long</span>
          </button>
          <button class="hy-icon-btn" (click)="goNotifications()" title="Notifications">
            <span class="material-icons-outlined" style="font-size:20px">notifications_none</span>
            <span *ngIf="unreadNotifications() > 0" class="hy-notif-dot"></span>
          </button>
          <div style="width:1px;height:20px;background:#E2E8F0;margin:0 2px;"></div>
          <div class="hy-avatar" (click)="goProfile()" title="Profile">
            {{ avatarInitials() }}
          </div>
        </div>
      </header>

      <!-- ── Main Content ── -->
      <div class="hy-content">

        <!-- ── Welcome Banner ── -->
        <div class="hy-welcome-banner hy-animate">
          <p class="hy-welcome-kicker">Employee Portal</p>
          <h1 class="hy-welcome-name">Good {{ timeOfDay() }}, {{ firstName() }}</h1>
          <p class="hy-welcome-sub">
            {{ selectedDate() ? 'Showing services & events for ' + (formatLocalDate(selectedDate()!) | date:'MMMM d, yyyy') : 'Select a date to explore available services.' }}
          </p>
          <div class="hy-accent-strip">
            <span></span>
          </div>
        </div>

        <!-- ── Date Navigator ── -->
        <div class="hy-card hy-animate" style="animation-delay:0.05s; padding: 1.25rem 1.5rem; border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border-radius: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <p style="font-size: 0.8rem; font-weight: 700; color: #64748B; letter-spacing: 0.08em; text-transform: uppercase;">SELECT DATE</p>
            <label class="hy-jump-btn" style="background: #ffffff; border: 1px solid #E2E8F0; padding: 0.45rem 0.85rem; border-radius: 8px;">
              <span class="material-icons-outlined" style="font-size:16px;">calendar_today</span>
              Pick Date
              <input #datePicker type="date" style="position:absolute;opacity:0;width:0;height:0;" [value]="selectedDate()" (change)="onDatePickerChange($event)" />
            </label>
          </div>

          <div style="display: flex; gap: 1rem; width: 100%; overflow-x: auto; scrollbar-width: none; padding-bottom: 0.5rem;">
            <button *ngFor="let day of calendarStrip()"
                    class="hy-date-btn"
                    [class.active]="day.isoDate === selectedDate()"
                    [class.today-btn]="day.isToday"
                    [disabled]="day.isPast"
                    (click)="!day.isPast && selectDate(day.isoDate)">
              <span class="d-label" style="text-transform: capitalize;">{{ day.dayOfWeek | slice:0:3 }}</span>
              <span class="d-num">{{ day.dayOfMonth }}</span>
              <span class="d-mon">{{ formatLocalDate(day.isoDate) | date:'MMM' }}</span>
              <span class="hy-date-badge">{{ day.eventCount }} Events</span>
            </button>
          </div>
        </div>

        <!-- ── Content for selected date ── -->
        <ng-container *ngIf="selectedDate()">

          <!-- ── Date Heading ── -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;" class="hy-animate" style="animation-delay:0.08s">
            <h2 class="hy-date-heading">{{ formatLocalDate(selectedDate()!) | date:'EEEE, MMMM d' }}</h2>
            <div style="flex:1;height:1px;background:#E2E8F0;"></div>
            <button class="hy-refresh-btn" (click)="loadAvailableForDate(selectedDate()!)">
              <span class="material-icons-outlined" style="font-size:14px;">refresh</span>
              Refresh
            </button>
          </div>

          <!-- ── Your Bookings ── -->
          <div *ngIf="bookingsForSelectedDate().length > 0" class="hy-card hy-animate" style="animation-delay:0.1s">
            <div class="hy-card-header">
              <div class="hy-section-heading">
                <p class="hy-section-label">Your Bookings</p>
                <span class="hy-section-count">{{ bookingsForSelectedDate().length }}</span>
              </div>
              <button style="font-size:0.75rem;font-weight:600;color:#0066CC;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0;" (click)="goHistory()">
                View all →
              </button>
            </div>
            <div class="bookings-grid">
              <div *ngFor="let event of bookingsForSelectedDate()"
                   class="hy-booking-card"
                   (click)="openBooking(event.bookingId)">
                <div class="hy-booking-icon">
                  <span class="material-icons-outlined" style="font-size:18px">event_available</span>
                </div>
                <div style="flex:1;min-width:0;">
                  <p style="font-size:0.82rem;font-weight:700;color:#0A1628;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;">{{ event.facility }}</p>
                  <p style="font-size:0.7rem;color:#94A3B8;margin:0;margin-top:1px;">{{ formatLocalDate(event.bookingDate) | date:'MMM d' }}</p>
                </div>
                <span class="hy-status"
                      [class.confirmed]="event.status === 'CONFIRMED' || event.status === 'ACTIVE' || event.status === 'COMPLETED'"
                      [class.cancelled]="event.status === 'CANCELLED'"
                      [class.pending]="event.status === 'PENDING'"
                      [class.default]="event.status !== 'CONFIRMED' && event.status !== 'ACTIVE' && event.status !== 'COMPLETED' && event.status !== 'CANCELLED' && event.status !== 'PENDING'">
                  {{ event.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- ── Loading ── -->
          <div *ngIf="loadingFacilities()" class="hy-card hy-animate">
            <div class="hy-loading-wrap">
              <div class="hy-spinner"></div>
              <p style="font-size:0.8rem;color:#94A3B8;margin:0;">Loading available options…</p>
            </div>
          </div>

          <!-- ── Empty ── -->
          <div *ngIf="!loadingFacilities() && availableFacilities().length === 0" class="hy-card hy-animate">
            <div class="hy-empty-wrap">
              <span class="material-icons-outlined hy-empty-icon-lg">inbox</span>
              <p class="hy-empty-title">Nothing available for this date</p>
              <p class="hy-empty-sub">No services or events have been published yet. Check back later or try another date.</p>
            </div>
          </div>

          <!-- ── Services ── -->
          <div *ngIf="!loadingFacilities() && servicesList().length > 0" class="hy-animate" style="animation-delay:0.12s">
            <div class="hy-section-heading" style="margin-bottom:1rem;">
              <p class="hy-section-label">Services</p>
              <span class="hy-section-count">{{ servicesList().length }}</span>
              <div class="hy-section-divider"></div>
            </div>
            <div class="hy-facility-grid">
              <div *ngFor="let facility of servicesList()"
                   class="hy-facility-card"
                   [class.booked]="facility.alreadyBooked">
                <div class="hy-facility-card-header">
                  <div class="hy-facility-icon-wrap">
                    <span class="material-icons-outlined" style="font-size:20px;">{{ getIcon(facility.icon || '') }}</span>
                  </div>
                  <span class="hy-avail-badge"
                        [class.booked]="facility.alreadyBooked"
                        [class.open]="!facility.alreadyBooked && facility.bookingAllowed"
                        [class.closed]="!facility.alreadyBooked && !facility.bookingAllowed">
                    {{ facility.alreadyBooked ? 'Booked' : (facility.bookingAllowed ? 'Open' : 'Closed') }}
                  </span>
                </div>

                <p class="hy-facility-category">{{ facility.displayCategory }}</p>
                <h4 class="hy-facility-name">{{ facility.facilityName }}</h4>
                <p *ngIf="facility.description" class="hy-facility-desc">{{ facility.description }}</p>

                <div *ngIf="facility.bookingStartTime || facility.bookingDeadline" class="hy-facility-window">
                  <span class="material-icons-outlined" style="font-size:13px;">schedule</span>
                  <span>{{ facility.bookingStartTime || '00:00' }} – {{ facility.bookingDeadline || '23:59' }}</span>
                </div>

                <p *ngIf="!facility.bookingAllowed && facility.unavailableReason" class="hy-facility-unavail-reason">
                  {{ facility.unavailableReason }}
                </p>

                <div class="hy-facility-cta">
                  <button *ngIf="!facility.alreadyBooked && facility.bookingAllowed"
                          class="hy-btn-book"
                          (click)="bookFacility(facility)">Book Now</button>
                  <button *ngIf="facility.alreadyBooked && facility.bookingId"
                          class="hy-btn-view"
                          (click)="viewBooking(facility.bookingId!)">View Booking</button>
                  <button *ngIf="facility.alreadyBooked"
                          class="hy-btn-again"
                          (click)="bookFacility(facility)">Again</button>
                  <div *ngIf="!facility.bookingAllowed && !facility.alreadyBooked" class="hy-unavail-btn">
                    Unavailable
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Divider ── -->
          <div *ngIf="!loadingFacilities() && servicesList().length > 0 && eventsList().length > 0"
               style="height:1px;background:#E2E8F0;"></div>

          <!-- ── Events ── -->
          <div *ngIf="!loadingFacilities() && eventsList().length > 0" class="hy-animate" style="animation-delay:0.15s">
            <div class="hy-section-heading" style="margin-bottom:1rem;">
              <p class="hy-section-label">Events</p>
              <span class="hy-section-count">{{ eventsList().length }}</span>
              <div class="hy-section-divider"></div>
            </div>
            <div class="hy-facility-grid">
              <div *ngFor="let facility of eventsList()"
                   class="hy-facility-card"
                   [class.booked]="facility.alreadyBooked">
                <div class="hy-facility-card-header">
                  <div class="hy-facility-icon-wrap">
                    <span class="material-icons-outlined" style="font-size:20px;">{{ getIcon(facility.icon || '') }}</span>
                  </div>
                  <span class="hy-avail-badge"
                        [class.booked]="facility.alreadyBooked"
                        [class.open]="!facility.alreadyBooked && facility.bookingAllowed"
                        [class.ended]="!facility.alreadyBooked && !facility.bookingAllowed">
                    {{ facility.alreadyBooked ? 'Registered' : (facility.bookingAllowed ? 'Open' : 'Ended') }}
                  </span>
                </div>

                <p class="hy-facility-category">{{ facility.displayCategory }}</p>
                <h4 class="hy-facility-name">{{ facility.facilityName }}</h4>
                <p *ngIf="facility.description" class="hy-facility-desc">{{ facility.description }}</p>

                <div *ngIf="facility.bookingStartTime || facility.bookingDeadline" class="hy-facility-window">
                  <span class="material-icons-outlined" style="font-size:13px;">schedule</span>
                  <span>{{ facility.bookingStartTime || '00:00' }} – {{ facility.bookingDeadline || '23:59' }}</span>
                </div>

                <p *ngIf="!facility.bookingAllowed && facility.unavailableReason" class="hy-facility-unavail-reason">
                  {{ facility.unavailableReason }}
                </p>

                <div class="hy-facility-cta">
                  <button *ngIf="!facility.alreadyBooked && facility.bookingAllowed"
                          class="hy-btn-book"
                          (click)="bookFacility(facility)">Register</button>
                  <button *ngIf="facility.alreadyBooked && facility.bookingId"
                          class="hy-btn-view"
                          (click)="viewBooking(facility.bookingId!)">View Registration</button>
                  <div *ngIf="!facility.bookingAllowed && !facility.alreadyBooked" class="hy-unavail-btn">
                    Registration Closed
                  </div>
                </div>
              </div>
            </div>
          </div>

        </ng-container>

        <!-- ── No Date Selected ── -->
        <div *ngIf="!selectedDate()" class="hy-card hy-animate">
          <div class="hy-empty-wrap" style="padding:5rem 1rem;">
            <span class="material-icons-outlined hy-empty-icon-lg">calendar_today</span>
            <p class="hy-empty-title">Select a date to begin</p>
            <p class="hy-empty-sub">Available services and events will appear once you choose a date from the navigator above.</p>
          </div>
        </div>

      </div>
    </div>
  `
})

export class DashboardComponent implements OnInit, OnDestroy {

  // Calendar state
  readonly selectedDate = signal<string | null>(null);
  readonly calendarStartDate = signal<Date>(new Date());

  // Available facilities for selected date
  readonly availableFacilities = signal<AvailableFacility[]>([]);
  readonly loadingFacilities = signal(false);

  readonly servicesList = computed(() => {
    return this.availableFacilities()
      .filter(f => !(f.category || '').includes('[EVENT]'))
      .map(f => ({
        ...f,
        displayCategory: f.category?.replace(' [EVENT]', '').replace('[EVENT]', '') || 'Service'
      }));
  });

  readonly eventsList = computed(() => {
    return this.availableFacilities()
      .filter(f => (f.category || '').includes('[EVENT]'))
      .map(f => ({
        ...f,
        displayCategory: f.category?.replace(' [EVENT]', '').replace('[EVENT]', '') || 'Event'
      }));
  });

  readonly facilities = signal<DashboardFacility[]>([]);
  readonly bookingEvents = signal<BookingHistoryItem[]>([]);
  readonly unreadNotifications = signal(0);
  readonly bookingCount = signal(0);

  private readonly destroy$ = new Subject<void>();

  readonly bookingsForSelectedDate = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return [];
    return this.bookingEvents().filter(event => event.bookingDate === selected);
  });

  readonly calendarStrip = computed(() => {
    const start = new Date(this.calendarStartDate());
    start.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = this.bookingEvents() || [];

    const cells: {
      dayOfWeek: string;
      dayOfMonth: number;
      month: string;
      isoDate: string;
      isToday: boolean;
      isPast: boolean;
      eventCount: number;
    }[] = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 14; i++) {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + i);

      const year = cellDate.getFullYear();
      const month = cellDate.getMonth();
      const date = cellDate.getDate();

      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

      const eventCount = bookings.filter(b => b.bookingDate === iso && (b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'PENDING' || b.status === 'COMPLETED')).length;

      cells.push({
        dayOfWeek: dayNames[cellDate.getDay()],
        dayOfMonth: date,
        month: monthNames[month],
        isoDate: iso,
        isToday: cellDate.getTime() === today.getTime(),
        isPast: cellDate.getTime() < today.getTime(),
        eventCount: eventCount
      });
    }
    return cells;
  });

  constructor(
    private readonly bookingApi: BookingApiService,
    private readonly employeeApi: EmployeeApiService,
    public readonly sessionService: SessionService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.sessionService.getEmployeeId()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadNotifications();
    this.loadEngagementSummary();

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 2);
    this.calendarStartDate.set(startDate);

    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.selectedDate.set(iso);
    this.loadAvailableForDate(iso);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Calendar navigation ───────────────────────────────────────────────────

  onDatePickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const newDate = this.formatLocalDate(input.value);
      if (newDate) {
        const startDate = new Date(newDate);
        startDate.setDate(newDate.getDate() - 2);
        this.calendarStartDate.set(startDate);
      }
      this.selectDate(input.value);
    }
  }

  selectDate(iso: string): void {
    this.selectedDate.set(iso);
    this.loadAvailableForDate(iso);
  }

  // ── Facilities for date ───────────────────────────────────────────────────

  loadAvailableForDate(date: string): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId || !date) return;

    this.loadingFacilities.set(true);
    this.availableFacilities.set([]);

    this.employeeApi.getAvailableFacilitiesForDate(employeeId, date).subscribe({
      next: (facilities) => {
        this.availableFacilities.set(facilities);
        this.loadingFacilities.set(false);
      },
      error: () => {
        this.availableFacilities.set([]);
        this.loadingFacilities.set(false);
        this.toastService.show('Could not load available services for this date.', 'error');
      }
    });
  }

  bookFacility(facility: AvailableFacility): void {
    this.router.navigate(['/employee/facility', facility.facilityId, 'book'], {
      queryParams: { date: this.selectedDate() }
    });
  }

  viewBooking(bookingId: string): void {
    this.router.navigate(['/employee/bookings', bookingId]);
  }

  openBooking(bookingId: number): void {
    this.router.navigate(['/employee/bookings', bookingId]);
  }

  // ── Navigation & Notifications ─────────────────────────────────────────

  goHistory(): void    { this.router.navigateByUrl('/employee/history'); }
  goNotifications(): void { this.router.navigateByUrl('/employee/notifications'); }
  goProfile(): void    { this.router.navigateByUrl('/employee/profile'); }

  loadNotifications(): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) return;

    this.employeeApi.getEmployeeNotifications(employeeId).subscribe({
      next: (response) => {
        const unread = (response.items ?? []).filter((item) => {
          const status = (item.statusCode ?? '').toUpperCase();
          return status !== 'READ' && status !== 'CANCELLED';
        }).length;
        this.unreadNotifications.set(unread);
      },
      error: () => {}
    });
  }

  private loadEngagementSummary(): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) return;

    this.bookingApi.getBookingHistory(employeeId).subscribe({
      next: (history) => {
        this.bookingCount.set(history.length ?? 0);
        this.bookingEvents.set(history ?? []);
      },
      error: () => {
        this.bookingCount.set(0);
        this.bookingEvents.set([]);
      }
    });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  formatLocalDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const parts = iso.split('-');
    if (parts.length !== 3) return null;
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  firstName(): string {
    const name = this.sessionService.state()?.user?.name?.trim() ?? 'there';
    return name.split(' ')[0] || 'there';
  }

  avatarInitials(): string {
    const name = this.sessionService.state()?.user?.name?.trim() ?? 'E';
    const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() ?? '').join('') || 'E';
  }

  timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  getIcon(iconValue?: string): string {
    if (iconValue && iconValue.trim().length > 0) return iconValue.trim();
    const val = (iconValue || '').toLowerCase();
    if (val.includes('transport') || val.includes('commute') || val.includes('bus')) return 'directions_bus';
    if (val.includes('food') || val.includes('meal') || val.includes('lunch') || val.includes('dining')) return 'restaurant';
    if (val.includes('gym') || val.includes('fitness') || val.includes('sport')) return 'fitness_center';
    if (val.includes('meeting') || val.includes('room') || val.includes('conference')) return 'meeting_room';
    if (val.includes('event') || val.includes('celebration') || val.includes('party')) return 'celebration';
    if (val.includes('calendar') || val.includes('schedule')) return 'calendar_month';
    if (val.includes('desk') || val.includes('seat') || val.includes('workspace')) return 'desk';
    if (val.includes('park')) return 'local_parking';
    if (val.includes('library') || val.includes('book')) return 'menu_book';
    return 'business';
  }
}
