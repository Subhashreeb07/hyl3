import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toast = signal<ToastState | null>(null);
  private timerId: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: ToastType = 'info', durationMs = 3000): void {
    this.toast.set({ message, type });

    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    this.timerId = setTimeout(() => {
      this.toast.set(null);
      this.timerId = null;
    }, durationMs);
  }

  clear(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.toast.set(null);
  }
}
