let socket, steamAuthToken, expoPushToken;

function initVariables() {
  serverStatus = document.querySelector('#server-status__header');

  serverIPTextbox = document.querySelector('#textbox__server-ip-holder');
  serverPortTextbox = document.querySelector('#textbox__server-port-holder');
  steamIDTextbox = document.querySelector('#textbox__steam-id-holder');
  playerTokenTextbox = document.querySelector('#textbox__player-token-holder');

  deviceContainer = document.querySelector('#device-holder__container');
  deviceTemplate = document.querySelector('#smart-device-template');
}

function startWebSocket() {
  socket = io();
  socket.emit('pair_client_connect', {'connectedFrom': window.location.href});

  socket.on('pair_server_popup', function(data){
    let newTab = window.open();
    newTab.location.href = data.url;
  });

  socket.on('pair_server_synced', function(data){
    serverStatus.innerHTML = "Steam successfully authenticated, next pair a Rust server or smart device in-game"
    serverStatus.classList.add('device--active');
  });

  socket.on('pair_server_deleteOnLeave', function(data){
    steamAuthToken = data.steamAuthToken;
    expoPushToken = data.expoPushToken;
  });

  socket.on('pair_server_rustplusinfo', function(data){
    if (data.type === 'server') {
      serverIPTextbox.value = data.ip;
      serverPortTextbox.value = data.port;
      steamIDTextbox.value = data.steamID;
      playerTokenTextbox.value = data.playerToken;

      [...document.querySelectorAll('.server-info-title')].forEach(item => {
        item.classList.remove('device--no-response');
        item.classList.add('device--active');
      });
    } else {
      if (deviceContainer.querySelector(`#device${data.deviceID}`) === null) {
        let device = deviceTemplate.content.cloneNode(true);
        device.querySelector('.device__device-holder').id = `device${data.deviceID}`;

        let image;
        if (data.deviceType === 'Switch') { image = 'media/smartswitch.png'; } else { image = 'media/smartalarm.png'; }
        device.querySelector('.device-image__device').src = image;

        deviceContainer.prepend(device.querySelector('.device__device-holder'));
      }
      deviceContainer.prepend(deviceContainer.querySelector(`#device${data.deviceID}`));

      const today = new Date();
      const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      deviceContainer.querySelector(`#device${data.deviceID}`).querySelector('.device-id__device').value = `Time Recieved: ${time}      |      Device ID: ${data.deviceID}`;
    }
  });
}

function shutdown(){
  if (steamAuthToken !== null && expoPushToken !== null) {
    socket.emit('pair_server_disconnect', {'steamAuthToken': steamAuthToken, 'expoPushToken': expoPushToken});
  }
}

window.addEventListener('load', (event) => {
  startWebSocket();
  initVariables();
  window.addEventListener('beforeunload', function(e){
    shutdown();
  });
});
