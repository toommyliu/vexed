import { Notification, type NotificationConstructorOptions } from "electron";

export function createNotification(
  title: string,
  body: string,
  options?: NotificationConstructorOptions,
) {
  const notification = new Notification({
    title,
    body,
    silent: true,
    ...options,
  });
  notification.show();
  return notification;
}
