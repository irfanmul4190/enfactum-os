/**
 * Background notification helpers: browser Notification API + audio alert.
 */

const ALERT_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACA" +
  "f39/f39/f4CAgICAgIB/f39/f4B/gICAgICAgH9/f39/f4CAgICAgIB/f39/f39/gICAgICAgH9/f39/gH+AgICAgICAf39/f39/" +
  "gICAgICAgH9/f39/f3+AgICAgICAf39/f39/gICAgICAgH9/f39/f3+AgICAgICAf39/f39/f4CAgICAgIB/f39/f39/gICAgICA";

let notificationPermission: NotificationPermission = "default";

/** Request notification permission (call on user interaction) */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") {
    notificationPermission = "granted";
    return "granted";
  }
  if (Notification.permission === "denied") {
    notificationPermission = "denied";
    return "denied";
  }
  const result = await Notification.requestPermission();
  notificationPermission = result;
  return result;
}

/** Show a browser push notification */
export function showBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const options: NotificationOptions & Record<string, unknown> = {
    body,
    icon: "/placeholder.svg",
    badge: "/placeholder.svg",
    tag: "anomaly-alert",
  };
  (options as any).renotify = true;

  const notification = new Notification(title, options);

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }

  // Auto-close after 8 seconds
  setTimeout(() => notification.close(), 8000);
}

/** Play a short alert chime */
export function playAlertSound() {
  try {
    const audio = new Audio(ALERT_SOUND_URL);
    audio.volume = 0.4;
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
    });
  } catch {
    // Audio not supported
  }
}

/** Combined: notify with both sound and browser notification */
export function notifyCriticalAnomaly(title: string, body: string, onClick?: () => void) {
  playAlertSound();
  if (document.hidden) {
    showBrowserNotification(title, body, onClick);
  }
}

/** Check if notifications are supported and get current permission */
export function getNotificationStatus(): { supported: boolean; permission: NotificationPermission } {
  const supported = "Notification" in window;
  return {
    supported,
    permission: supported ? Notification.permission : "denied",
  };
}
