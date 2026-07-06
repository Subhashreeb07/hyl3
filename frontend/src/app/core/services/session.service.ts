import { Injectable, signal } from '@angular/core';
import { CurrentUserResponse, LoginResponse } from '../models/employee-flow.models';

interface SessionState {
  token: string;
  user: CurrentUserResponse;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storageKey = 'hyhub_employee_session';
  readonly state = signal<SessionState | null>(this.readFromStorage());

  setFromLogin(response: LoginResponse): void {
    const next: SessionState = {
      token: response.token,
      user: {
        employeeId: response.employeeId,
        name: response.name,
        email: response.email,
        role: response.role
      }
    };
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    this.state.set(next);
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
    this.state.set(null);
  }

  getToken(): string | null {
    return this.state()?.token ?? null;
  }

  getEmployeeId(): string | null {
    return this.state()?.user.employeeId ?? null;
  }

  getRole(): string | null {
    return this.state()?.user.role ?? null;
  }

  private readFromStorage(): SessionState | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionState;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
