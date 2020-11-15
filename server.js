require('dotenv').config();
const RustPlus = require('rustplus-api');
const { Webhook } = require('discord-webhook-node');
const express = require('express');
const socket = require('socket.io');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { register, listen } = require('push-receiver');

let currentlyConnected = false;
let rustplus;
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({
  severSettingsHostname: "",
  severSettingsRustPlusPort: 0,
  severSettingsSteamID: "",
  serverSettingsPlayerToken: 0,
  notificationSettingsDiscordURL: "",
  notificationSettingsDiscordMessage: "",
  devices: []
}).write(); // See examples/jsonLayout.txt for more info on database storage.

connectToRustPlus(); // Used to setup rustPlus object.


const app = express();
const server = app.listen(80, function(){
    console.log('listening for requests on port 80,');
});
app.use(express.static('public'));

app.use(express.static('public', {
    extensions: 'html'
}));


const io = socket(server);
io.on('connection', (socket) => {
    if (currentlyConnected) {
      db.get('devices').value().forEach(smartDevice => {
        socket.emit('server_UpdateDevice', smartDevice);
        rustplus.getEntityInfo(smartDevice.deviceID, (message) => {
          return true;
        });
      });
    }

    socket.emit('server_UpdateServerSettings', {"hostname": db.get('severSettingsHostname').value(), "connectionState": currentlyConnected});
    socket.emit('server_UpdateNotificationSettings', {
      "discordWebhookLink": db.get('notificationSettingsDiscordURL').value(),
      "discordMessage": db.get('notificationSettingsDiscordMessage').value()}
    );

    socket.on('client_AddDevice', function(data){ // Used when the client pressed the new device button.
        rustplus.getEntityInfo(parseInt(data.deviceID), message => {
          if(message.response.entityInfo === null) {
            socket.emit('server_ErrorDevice', {error: "Failed to create device, either the server is not responding or the device ID does not exist."});
          } else {
            if (db.get('devices').find({ deviceID: parseInt(data.deviceID) }).value() != undefined){
              socket.emit('server_ErrorDevice', { error: "Failed to create device, device already exists." });
            } else {
              if (message.response.entityInfo['type'] - 1) {
                db.get('devices')
                  .push({
                    deviceID: parseInt(data.deviceID),
                    deviceName : data.deviceName,
                    deviceState: message.response.entityInfo.payload.value ? 'Active': 'Inactive',
                    deviceType: 'smartAlarm',
                    notificationDiscord: false,
                    notificationBuzzer: false
                  })
                  .write();
              } else {
                db.get('devices')
                  .push({
                    deviceID: parseInt(data.deviceID),
                    deviceName : data.deviceName,
                    deviceState: message.response.entityInfo.payload.value ? 'Active': 'Inactive',
                    deviceType: 'smartSwitch'
                  })
                  .write();
              }
              io.emit('server_UpdateDevice', db.get('devices').find({ deviceID: parseInt(data.deviceID) }).value());
            }
          }
          return true;
        });
    });

    socket.on('client_UpdateDevice', function(data){ // Used as a generic way of updating any info of a component.

      if (data.updateType === 'deviceState') {
        rustplus.getEntityInfo(parseInt(data.deviceID), message => {
          if(message.response.entityInfo === null) {
            db.get('devices')
              .find({ deviceID: data.deviceID })
              .assign({ deviceState: 'No Response'})
              .write();
          } else {
            if (data.state) {
              rustplus.turnSmartSwitchOff(data.deviceID, () => { return true; });
            } else {
              rustplus.turnSmartSwitchOn(data.deviceID, () => { return true; });
            }
            rustplus.getEntityInfo(data.deviceID, (messageAfterToggle) => {
              db.get('devices')
                .find({ deviceID: data.deviceID })
                .assign({ deviceState: messageAfterToggle.response.entityInfo.payload.value ? 'Active': 'Inactive' })
                .write();
              return true;
            });
          }
          return true;
        });
      }

      if (data.updateType === 'discordNotificationState') {
        db.get('devices')
          .find({ deviceID: data.deviceID })
          .assign({ notificationDiscord: !data.state})
          .write();
      }

      if (data.updateType === 'buzzerNotificationState') {
        db.get('devices')
          .find({ deviceID: data.deviceID })
          .assign({ notificationBuzzer: !data.state})
          .write();
      }

      if (data.updateType === 'deviceNameChange'){
        db.get('devices')
          .find({ deviceID: data.deviceID })
          .assign({ deviceName: data.state})
          .write();
      }

    io.emit('server_UpdateDevice', db.get('devices').find({ deviceID: data.deviceID }).value());
    });


    socket.on('client_DeleteDevice', function(data){
      db.get('devices')
        .remove({ deviceID: data.deviceID })
        .write();
      io.emit('server_DeleteDevice', data);
    });

    socket.on('client_UpdateNotificationSettings', function(data){
      db.set('notificationSettingsDiscordURL', data.discordWebhookLink).write();
      db.set('notificationSettingsDiscordMessage', data.discordMessage).write();

      io.sockets.emit('server_UpdateNotificationSettings', {
        "discordWebhookLink": db.get('notificationSettingsDiscordURL').value(),
        "discordMessage": db.get('notificationSettingsDiscordMessage').value()}
      );
    });

    socket.on('client_UpdateServerSettings', function(data){ // NEED TO FINISH.
      db.set('severSettingsHostname', data.hostname).write();
      db.set('severSettingsRustPlusPort', data.rustPlusPort).write();
      db.set('severSettingsSteamID', data.steamID).write();
      db.set('serverSettingsPlayerToken', data.playerToken).write();

      connectToRustPlus();

      io.sockets.emit('server_UpdateServerSettings', {"hostname": db.get('severSettingsHostname').value(), "connectionState": currentlyConnected});
  });

  // Stuff for pair.js

  socket.on('pair_client_connect', function(data){ // NEED TO FINISH.
    pairClientConnect({'socketID': socket.id, 'connectedFrom': data.connectedFrom});
  });

  socket.on('pair_server_disconnect', function(data) {
    shutdown(data.steamAuthToken, data.expoPushToken);
  });
});

async function pairClientConnect(data) {
  const credentials = await register('976529667804');
  axios.post('https://exp.host/--/api/v2/push/getExpoPushToken', {
      deviceId: uuidv4(),
      experienceId: '@facepunch/RustCompanion',
      appId: 'com.facepunch.rust.companion',
      deviceToken: credentials.fcm.token,
      type: 'fcm',
      development: false,
  }).then(async (response) => {

      expoPushToken = response.data.data.expoPushToken;

      app.get(`/pair/${data.socketID}`, (req, res) => {

        steamAuthToken = req.query.token;

        io.to(data.socketID).emit('pair_server_deleteOnLeave',{'steamAuthToken': steamAuthToken, 'expoPushToken': expoPushToken});

        axios.post('https://companion-rust.facepunch.com:443/api/push/register', {
            AuthToken: steamAuthToken,
            DeviceId: 'rustplus-api',
            PushKind: 0,
            PushToken: expoPushToken,
        }).then((response) => {
            io.to(data.socketID).emit('pair_server_synced',{});
            waitForRustPlusInfo(credentials, data.socketID);
        }).catch((error) => {
            console.log("Failed to register with Rust Companion API");
            console.log(error);
        });

        res.sendFile('public/success.html', {root: __dirname })
      });
      const url = "https://companion-rust.facepunch.com/login?returnUrl=" + encodeURIComponent(`${data.connectedFrom}/${data.socketID}?expoPushToken=expoPushToken`);
      io.to(data.socketID).emit('pair_server_popup', { 'url': url });

  }).catch((error) => {
      console.log("Failed to fetch Expo Push Token");
      console.log(error);
  });
}

async function waitForRustPlusInfo(credentials, socketID){
  await listen(credentials, ({ notification, persistentId }) => {
      const body = JSON.parse(notification.data.body);

      if (body.type === 'server') {
        io.to(socketID).emit('pair_server_rustplusinfo', { 'type': body.type,'ip': body.ip, 'port': body.port, 'playerToken': body.playerToken, 'steamID': body.playerId});
      } else {
        io.to(socketID).emit('pair_server_rustplusinfo', { 'type': body.type, 'deviceID': body.entityId, 'deviceType': body.entityName});
      }
  });
}

async function shutdown(steamAuthToken, expoPushToken) {
    // unregister with Rust Companion API
    if(steamAuthToken){
        await axios.delete('https://companion-rust.facepunch.com:443/api/push/unregister', {
            data: {
                AuthToken: steamAuthToken,
                PushToken: expoPushToken,
                DeviceId: 'rustplus-api',
            },
        }).then((response) => {

        }).catch((error) => {
            console.log(error);
        });
    }
}

function connectToRustPlus(){
  const hostname = db.get('severSettingsHostname').value();
  const rustPlusPort = db.get('severSettingsRustPlusPort').value();
  const steamID = db.get('severSettingsSteamID').value();
  const playerToken = db.get('serverSettingsPlayerToken').value();

  rustplus = new RustPlus(hostname, rustPlusPort, steamID, playerToken);


rustplus.on('error', e => {
  currentlyConnected = false;
  io.sockets.emit('server_UpdateServerSettings', {"hostname": db.get('severSettingsHostname').value(), "connectionState": currentlyConnected});

  db.get('devices').value().forEach(smartDevice => {
    smartDevice.deviceState = 'No Response';
    io.sockets.emit('server_UpdateDevice', smartDevice);
  });
});

rustplus.on('connected', () => {
    currentlyConnected = true;
    io.sockets.emit('server_UpdateServerSettings', {"hostname": db.get('severSettingsHostname').value(), "connectionState": currentlyConnected});
    rustplus.sendTeamMessage(`Hello! Server initialised at ${new Date()}`);

    db.get('devices').value().forEach(smartDevice => {
      rustplus.getEntityInfo(smartDevice.deviceID, message => {
        if(message.response.entityInfo === null) {
          db.get('devices')
            .find({ deviceID: smartDevice.deviceID })
            .assign({ deviceState: 'No Response'})
            .write();
        } else {
          db.get('devices')
            .find({ deviceID: smartDevice.deviceID })
            .assign({ deviceState: message.response.entityInfo.payload.value ? 'Active': 'Inactive'})
            .write()
        }
        io.sockets.emit('server_UpdateDevice', smartDevice);
        return true;
      });
    });
});

rustplus.on('message', (message) => {
    if(message.broadcast && message.broadcast.entityChanged){
      const entityChanged = message.broadcast.entityChanged;
      db.get('devices')
        .find({ deviceID: entityChanged.entityId })
        .assign({ deviceState: entityChanged.payload.value ? 'Active' : 'Inactive'})
        .write();
      io.emit('server_UpdateDevice',db.get('devices').find({ deviceID: entityChanged.entityId }).value());

      if (db.get('devices').find({ deviceID: entityChanged.entityId }).value().deviceState === 'Inactive') { return; }

      if (db.get('devices').find({ deviceID: entityChanged.entityId }).value().notificationDiscord ) {
        const hook = new Webhook(db.get('notificationSettingsDiscordURL').value());
        const IMAGE_URL = 'https://static.wikia.nocookie.net/play-rust/images/0/06/Rocket_Launcher_icon.png';
        hook.setAvatar(IMAGE_URL);
        hook.setUsername('RUST+ ALERT');
        hook.send(`${db.get('devices').find({ deviceID: entityChanged.entityId }).value().deviceName.toUpperCase()} : ${db.get('notificationSettingsDiscordMessage').value()}`);
      }
    }
});
}
