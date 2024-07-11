import {
  Agent,
  AgentEventTypes,
  AgentMessageProcessedEvent,
  ConnectionRepository,
  ForwardMessage,
} from "@credo-ts/core";
import { MediationRepository } from "@credo-ts/core/build/modules/routing/repository/MediationRepository";
import { PushNotificationsFcmSetDeviceInfoMessage } from "@credo-ts/push-notifications";
import PushNotificationsHandlerInterface from "./PushNotificationsHandlerInterface";

const PushNotificationKey = "pushNotificationMetadata";

type PushNotificationMetadata = {
  deviceToken: string;
  devicePlatform: "ios" | "android";
};

export default class PushNotificationsService {
  constructor(
    private pushNotificationHandler: PushNotificationsHandlerInterface,
  ) {}

  private async processForwardMessage(
    agent: Agent,
    forwardMessage: ForwardMessage,
  ): Promise<void> {
    const logger = agent.context.config.logger;
    const mediationRepository =
      agent.dependencyManager.resolve<MediationRepository>(MediationRepository);
    const mediationRecord = await mediationRepository.getSingleByRecipientKey(
      agent.context,
      forwardMessage.to,
    );
    const conn = await agent.connections.findById(mediationRecord.connectionId);
    if (!conn?.isReady || !mediationRecord.isReady) {
      logger.debug("Not delivering message, not ready" + forwardMessage.id);
      return;
    }
    logger.debug("Delivering message to connection id " + conn.id);
    const pushNotificationMetadata = conn.metadata.get(
      PushNotificationKey,
    ) as PushNotificationMetadata | null;
    if (pushNotificationMetadata) {
      logger.debug("Delivering message to connection id " + conn.id);
      try {
        await this.pushNotificationHandler.sendPushNotification(
          pushNotificationMetadata.deviceToken,
          {
            message: "New message received",
            title: "New message received",
          },
        );
        logger.debug("Push sent to connection id " + conn.id);
      } catch (e) {
        logger.error(
          "Could not send push to connection id " +
            conn.id +
            " error: " +
            JSON.stringify(e),
        );
      }
    }
  }

  private async processSetTokenMessage(
    agent: Agent,
    setPushTokenMessage: PushNotificationsFcmSetDeviceInfoMessage,
    connectionId?: string,
  ): Promise<void> {
    const logger = agent.context.config.logger;
    const connectionRepository =
      agent.dependencyManager.resolve<ConnectionRepository>(
        ConnectionRepository,
      );
    if (!connectionId) {
      return;
    }
    logger.debug(
      "Processing set token message " +
        setPushTokenMessage.id +
        " for " +
        connectionId,
    );
    const conn = await agent.connections.findById(connectionId);
    if (!conn) {
      logger.debug("Not storing token, no connection");
      return;
    }
    if (setPushTokenMessage.deviceToken && setPushTokenMessage.devicePlatform) {
      conn.metadata.set(PushNotificationKey, {
        deviceToken: setPushTokenMessage.deviceToken,
        devicePlatform: setPushTokenMessage.devicePlatform,
      });
      logger.debug(
        "Storing metadata for connection: " +
          JSON.stringify(conn.metadata.get(PushNotificationKey), null, 2) +
          " : " +
          conn.id,
      );
      await connectionRepository.update(agent.context, conn);
    } else if (
      !setPushTokenMessage.deviceToken &&
      !setPushTokenMessage.devicePlatform
    ) {
      conn.metadata.delete(PushNotificationKey);
      logger.debug("Removing metadata for connection: " + conn.id);
      await connectionRepository.update(agent.context, conn);
    }
  }
  async setupPushNotificationsObserver(agent: Agent): Promise<void> {
    const logger = agent.context.config.logger;
    logger.debug("Starting Push Notifications Observer");
    agent.events.on(
      AgentEventTypes.AgentMessageProcessed,
      async (data: AgentMessageProcessedEvent) => {
        const message = data.payload.message;
        if (message.type === ForwardMessage.type.messageTypeUri) {
          const forwardMessage = message as ForwardMessage;
          logger.debug(
            "Processing forward message " +
              forwardMessage.id +
              " for " +
              forwardMessage.to,
          );
          await this.processForwardMessage(agent, forwardMessage);
        }
        if (
          message.type ===
          PushNotificationsFcmSetDeviceInfoMessage.type.messageTypeUri
        ) {
          const setPushTokenMessage =
            message as PushNotificationsFcmSetDeviceInfoMessage;
          logger.debug(
            "Processing set push token message " +
              setPushTokenMessage.id +
              " for " +
              data.payload.connection?.id,
          );
          await this.processSetTokenMessage(
            agent,
            setPushTokenMessage,
            data.payload.connection?.id,
          );
        }
      },
    );
  }
}
