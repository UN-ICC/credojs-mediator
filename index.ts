import PushNotificationsService from "./pushNotifications/PushNotificationsService";
import AgentService from "./agent/AgentService";
import FCMPushNotificationsHandler from "./pushNotifications/handlers/FCMPushNotificationsHandler";

const pushService = new PushNotificationsService(
  new FCMPushNotificationsHandler(),
);
const agentService = new AgentService();

const run = async () => {
  const agent = await agentService.createAgent();
  await agent.initialize();
  await pushService.setupPushNotificationsObserver(agent);
  await agentService.setupWebsocketUpgrade();
  await agentService.setupMediatorInvitation();
};

void run();
