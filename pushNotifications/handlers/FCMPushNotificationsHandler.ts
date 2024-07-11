import PushNotificationsHandlerInterface, {
  PushNotificationMessage,
} from "../PushNotificationsHandlerInterface";
import * as process from "node:process";
import { base64Decode } from "@firebase/util";
import admin, { app } from "firebase-admin";
import App = app.App;

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? base64Decode(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

export default class FCMPushNotificationsHandler
  implements PushNotificationsHandlerInterface
{
  private app: App;
  constructor() {
    if (!serviceAccount) {
      throw new Error(
        "No service account for Firebase: " +
          process.env.FIREBASE_SERVICE_ACCOUNT,
      );
    }
    const svcAccountJSON = JSON.parse(serviceAccount);
    this.app = admin.initializeApp({
      credential: admin.credential.cert(svcAccountJSON),
    });
  }

  async sendPushNotification(
    token: string,
    notification: PushNotificationMessage,
  ): Promise<void> {
    const message = {
      data: notification.data || undefined,
      notification: {
        title: notification.title,
        body: notification.message,
      },
      token,
    };
    try {
      const res = await admin.messaging().send(message);
      console.log("Push sent:", res);
    } catch (e) {
      console.log("Error sending push:", e);
    }
  }
}
