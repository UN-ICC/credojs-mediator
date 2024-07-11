import ngrok from "@ngrok/ngrok";
require("dotenv").config();

const port = 3000;

/**
 * Connect to ngrok and then set the port and url on the environment before importing
 * the index file.
 */
void ngrok
  .forward({ proto: "http", addr: port, authtoken_from_env: true })
  .then((res) => {
    // eslint-disable-next-line no-console
    console.log("Got ngrok url:", res.url());

    process.env.NODE_ENV = "development";
    process.env.AGENT_PORT = `${port}`;
    process.env.AGENT_ADDRESS = `${res.url()?.replace("https://", "")}`;

    require("./index");
  })
  .catch((e) => {
    console.error("An error occurred while connecting to the server", e);
  });
