import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationStreamService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private readonly notificationSubject = new Subject<any>();

  get notifications$(): Observable<any> {
    return this.notificationSubject.asObservable();
  }

  connect(employeeId: string): void {
    this.disconnect();

    const url = `${environment.apiUrl}/notifications/subscribe/${employeeId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('notification', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        this.notificationSubject.next(data);
      } catch (e) {
        console.error('Failed to parse real-time notification payload:', e);
      }
    });

    this.eventSource.addEventListener('connect', (event: any) => {
      console.log('Real-time notification channel connected via SSE:', event.data);
    });

    this.eventSource.onerror = (error) => {
      console.error('SSE Connection encountered an error. Reconnecting...', error);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
