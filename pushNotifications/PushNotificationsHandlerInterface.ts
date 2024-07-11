export interface PushNotificationMessage {
  data?: Record<string, string>;
  message: string;
  title: string;
}

export default interface PushNotificationsHandlerInterface {
  sendPushNotification(
    token: string,
    notification: PushNotificationMessage,
  ): Promise<void>;
}
