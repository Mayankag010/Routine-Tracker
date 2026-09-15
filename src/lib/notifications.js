/**
 * Thin wrapper around the Notification API. Kept deliberately small: the
 * scheduling logic (when to notify) lives in notification-scheduler.js —
 * this file only knows how to ask for permission and how to actually show
 * one, using the service worker (already registered by next-pwa) so
 * notifications keep working while the tab is in the background.
 */

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function getPermissionStatus() {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Requests permission. Must be called from a click handler (a real user
 * gesture) — browsers ignore or block permission requests made on page
 * load, which is also why this is never called automatically.
 */
export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function showNotification(title, options = {}) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification(title, {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          ...options,
        });
        return true;
      }
    }
    // Fallback for browsers/contexts without an active service worker.
    new Notification(title, { icon: "/icons/icon-192.png", ...options });
    return true;
  } catch {
    return false;
  }
}
