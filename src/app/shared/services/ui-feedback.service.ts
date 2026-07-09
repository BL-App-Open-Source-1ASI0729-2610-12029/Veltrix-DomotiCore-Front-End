import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface AppNotification {
  id: number;
  titleKey: string;
  messageKey: string;
  timeKey: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  private readonly snackBar = inject(MatSnackBar);
  private toastCounter = 0;

  readonly toasts = signal<Toast[]>([]);
  readonly notificationsOpen = signal(false);
  readonly helpOpen = signal(false);
  readonly helpTopic = signal('general');

  readonly notifications = signal<AppNotification[]>([
    { id: 1, titleKey: 'overlay.sampleNotifications.highConsumption.title', messageKey: 'overlay.sampleNotifications.highConsumption.message', timeKey: 'overlay.sampleNotifications.highConsumption.time', read: false },
    { id: 2, titleKey: 'overlay.sampleNotifications.automationDone.title', messageKey: 'overlay.sampleNotifications.automationDone.message', timeKey: 'overlay.sampleNotifications.automationDone.time', read: false },
    { id: 3, titleKey: 'overlay.sampleNotifications.deviceOnline.title', messageKey: 'overlay.sampleNotifications.deviceOnline.message', timeKey: 'overlay.sampleNotifications.deviceOnline.time', read: true },
  ]);

  showToast(message: string, type: ToastType = 'info', durationMs = 3500): void {
    const id = ++this.toastCounter;
    this.toasts.update(items => [...items, { id, message, type }]);
    this.snackBar.open(message, undefined, {
      duration: durationMs,
      panelClass: [`mat-snack-bar--${type}`],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
    setTimeout(() => this.dismissToast(id), durationMs);
  }

  dismissToast(id: number): void {
    this.toasts.update(items => items.filter(item => item.id !== id));
  }

  toggleNotifications(): void {
    this.notificationsOpen.update(open => !open);
    if (this.helpOpen()) this.helpOpen.set(false);
  }

  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  openHelp(topic = 'general'): void {
    this.helpTopic.set(topic);
    this.helpOpen.set(true);
    if (this.notificationsOpen()) this.notificationsOpen.set(false);
  }

  closeHelp(): void {
    this.helpOpen.set(false);
  }

  markNotificationRead(id: number): void {
    this.notifications.update(items =>
      items.map(item => (item.id === id ? { ...item, read: true } : item))
    );
  }

  markAllNotificationsRead(): void {
    this.notifications.update(items => items.map(item => ({ ...item, read: true })));
  }

  unreadCount(): number {
    return this.notifications().filter(item => !item.read).length;
  }

  confirmAction(message: string): boolean {
    if (typeof window === 'undefined') return true;
    return window.confirm(message);
  }
}
