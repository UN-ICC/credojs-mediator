import { ConsoleLogger, InitConfig } from "@credo-ts/core";

import { ariesAskar } from "@hyperledger/aries-askar-nodejs";
import express from "express";
import { Server } from "ws";

import { AskarModule } from "@credo-ts/askar";
import {
  ConnectionsModule,
  MediatorModule,
  HttpOutboundTransport,
  Agent,
  ConnectionInvitationMessage,
  LogLevel,
  WsOutboundTransport,
} from "@credo-ts/core";
import {
  HttpInboundTransport,
  agentDependencies,
  WsInboundTransport,
} from "@credo-ts/node";
import { askarPostgresConfig } from "../database/DatabaseConfig";
import { PushNotificationsFcmModule } from "@credo-ts/push-notifications";
import type { Socket } from "net";

const url = process.env.AGENT_ADDRESS || "localhost";
const port = process.env.AGENT_PORT ? Number(process.env.AGENT_PORT) : 3001;
const endpoints = [`https://${url}`, `wss://${url}`];
const httpEndpoint = endpoints.find((e) => e.startsWith("http"));
const POSTGRES_HOST = process.env.POSTGRES_HOST;

// We create our own instance of express here. This is not required
// but allows use to use the same server (and port) for both WebSockets and HTTP
const app = express();
const socketServer = new Server({ noServer: true });

// Create all transports
const httpOutboundTransport = new HttpOutboundTransport();
const wsInboundTransport = new WsInboundTransport({ server: socketServer });
const wsOutboundTransport = new WsOutboundTransport();
const httpInboundTransport = new HttpInboundTransport({ app, port });

export default class AgentService {
  private agent?: Agent;

  async createAgent(): Promise<Agent> {
    const logger = new ConsoleLogger(LogLevel.test);
    logger.debug("Starting at http endpoint" + httpEndpoint);

    const storageConfig = POSTGRES_HOST ? askarPostgresConfig : undefined;
    if (POSTGRES_HOST) {
      logger.debug("Starting with postgress" + POSTGRES_HOST);
    }
    const agentConfig: InitConfig = {
      endpoints,
      label: process.env.AGENT_LABEL || "Credo Mediator",
      walletConfig: {
        id: process.env.WALLET_NAME || "Credo",
        key: process.env.WALLET_KEY || "Credo",
        storage: storageConfig,
      },
      logger,
    };

    // Set up agent
    const agent = new Agent({
      config: agentConfig,
      dependencies: agentDependencies,
      modules: {
        askar: new AskarModule({ ariesAskar }),
        mediator: new MediatorModule({
          autoAcceptMediationRequests: true,
        }),
        connections: new ConnectionsModule({
          autoAcceptConnections: true,
        }),

        pushNotificationsFcm: new PushNotificationsFcmModule(),
      },
    });

    // Register all Transports
    agent.registerInboundTransport(httpInboundTransport);
    agent.registerOutboundTransport(httpOutboundTransport);
    agent.registerInboundTransport(wsInboundTransport);
    agent.registerOutboundTransport(wsOutboundTransport);

    // Allow to create invitation, no other way to ask for invitation yet
    httpInboundTransport.app.get("/invitation", async (req, res) => {
      if (typeof req.query.c_i === "string") {
        const invitation = ConnectionInvitationMessage.fromUrl(req.url);
        res.send(invitation.toJSON());
      } else {
        const { outOfBandInvitation } = await agent.oob.createInvitation();
        res.send(
          outOfBandInvitation.toUrl({ domain: httpEndpoint + "/invitation" }),
        );
      }
    });

    this.agent = agent;
    return this.agent;
  }

  async setupMediatorInvitation() {
    const logger = this.agent?.context.config.logger;
    const mediatorOutOfBandRecord = await this.agent?.oob.createInvitation({
      multiUseInvitation: true,
    });
    const mediatorInvitationUrl =
      mediatorOutOfBandRecord?.outOfBandInvitation.toUrl({
        domain: httpEndpoint || "",
      });
    logger?.debug("invitation: " + mediatorInvitationUrl);
  }

  async setupWebsocketUpgrade() {
    const logger = this.agent?.context.config.logger;

    logger?.debug("setting up websocket upgrade ");
    httpInboundTransport.server?.on("upgrade", (request, socket, head) => {
      socketServer.handleUpgrade(request, socket as Socket, head, (socket) => {
        socketServer.emit("connection", socket, request);
      });
    });
  }
}
