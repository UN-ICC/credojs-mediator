# credojs-mediator

This is an implementation of a mediator using [CredoJS](https://credo.js.org) and it is based on the [Animo Mediator](https://github.com/animo/animo-mediator) which implements push notifications which are sent to mobile wallets when they have a message pending.



## Setup

The project uses `dotenv`. You can create a `.env` file and add environmental variables there. The app will take the values from there.

### Database

The mediator can use a PostgreSQL database with Askar. If you need to do it just set the environmental variables:

```
POSTGRES_HOST="" # OPTIONAL: 
POSTGRES_USER="" # OPTIONAL: 
POSTGRES_PASSWORD="" # OPTIONAL: 
```

### Push Notifications

Although CredoJS works with FCM and APNs systems, this mediator only implements Firebase, which can work both on iOS and Android.

#### Firebase Setup
- Follow the setup for your project in [Cloud messaging documenation](https://firebase.google.com/docs/cloud-messaging).
- Once you are ready, get the Service Account Key. It should be a JSON file.
- Transform the file to base64.
- Add the resulting base64 to the environment variables at

```
FIREBASE_SERVICE_ACCOUNT="ewogICJ...." # this is your service account in base64
```

## Development

If you want to test before deploying:
- set your ngrok api key as `NGROK_AUTHTOKEN`.
- Start the mediator with `yarn run dev`.
- Copy the invitation url that will output at the last line in your App.

```
...
DEBUG: Mediator routing record not loaded yet, retrieving from storage
DEBUG: Starting Push Notifications Observer
DEBUG: setting up websocket upgrade 
DEBUG: invitation: https://ab98-194-25-64-11.ngrok-free.app?oob=eyJ...."
```
