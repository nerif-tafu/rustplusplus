let socket;

function startWebSocket() {
  socket = io();

  socket.on('server_UpdateDevice', function(data){ // Recieved when a device needs to be re/rendered on the client side.
    let clone;
    if (deviceHolder.querySelector(`#device${data.deviceID}`) === null) {
      if (data.deviceType === 'smartSwitch') {
        clone = smartSwitchTemplate.content.cloneNode(true);
        const deviceState = clone.querySelector('.state-btn__device-primitives');

        deviceState.addEventListener('click', () => {
          socket.emit('client_UpdateDevice', { updateType : 'deviceState', state: deviceState.stateValue, deviceID: data.deviceID });
        });
      }
      if (data.deviceType === 'smartAlarm') {
        clone = smartAlarmTemplate.content.cloneNode(true);
        const discordNotificationBtn = clone.querySelector('.discord-notification-btn__notification-options');
        const buzzerNotificationBtn = clone.querySelector('.buzzer-notification-btn__notification-options');

        discordNotificationBtn.addEventListener('click', () => {
          socket.emit('client_UpdateDevice', { updateType : 'discordNotificationState', state: discordNotificationBtn.stateValue, deviceID: data.deviceID });
        });

        buzzerNotificationBtn.addEventListener('click', () => {
          socket.emit('client_UpdateDevice', { updateType : 'buzzerNotificationState', state: buzzerNotificationBtn.stateValue, deviceID: data.deviceID });
        });

      }
      clone.querySelector('.device__device-holder').id = `device${data.deviceID}`;
      const deleteDeviceButton = clone.querySelector('.remove-btn__device-primitives');
      const deviceNameTextbox = clone.querySelector('.name-txt__device-primitives');


      deviceNameTextbox.addEventListener("focus", () => {
        deviceNameTextbox.onfocustext = deviceNameTextbox.value;
      });

      deviceNameTextbox.addEventListener("focusout", () => {
        if ( deviceNameTextbox.onfocustext === deviceNameTextbox.value) { return }
        socket.emit('client_UpdateDevice', { updateType : 'deviceNameChange', state: deviceNameTextbox.value, deviceID: data.deviceID });
      });

      deleteDeviceButton.addEventListener('click', () => {
        socket.emit('client_DeleteDevice', data);
      });

      deviceHolder.appendChild(clone.querySelector('.device__device-holder'));
    }

    clone = deviceHolder.querySelector(`#device${data.deviceID}`);

    if (data.deviceType === 'smartAlarm'){
      const discordNotificationButton = clone.querySelector('.discord-notification-btn__notification-options');
      const buzzerNotificationButton = clone.querySelector('.buzzer-notification-btn__notification-options');

      [discordNotificationButton, buzzerNotificationButton].forEach(button => {
        button.classList.remove('device--active');
        button.classList.remove('device--inactive');
      });

      discordNotificationButton.classList.add(data.notificationDiscord ? 'device--active' : 'device--inactive');
      discordNotificationButton.stateValue = data.notificationDiscord;
      discordNotificationButton.innerHTML = data.notificationDiscord ? 'Discord message notifications: ON' : 'Discord message notifications: OFF';
      buzzerNotificationButton.classList.add(data.notificationBuzzer ? 'device--active' : 'device--inactive');
      buzzerNotificationButton.stateValue = data.notificationBuzzer;
      buzzerNotificationButton.innerHTML = data.notificationBuzzer ? 'Buzzer notifications: ON' : 'Buzzer notifications: OFF';
    }

    clone.querySelector('.name-txt__device-primitives').value = data.deviceName;
    const deviceState = clone.querySelector('.state-btn__device-primitives');

    const possibleStates = ['Inactive', 'Active', 'No Response'];
    const possibleStateClasses = ['device--inactive', 'device--active','device--no-response'];

    possibleStates.forEach((state, i) => {
      if (data.deviceState === state){
        deviceState.innerHTML = state;
        possibleStateClasses.forEach(item => {
          deviceState.classList.remove(item);
        });
        deviceState.classList.add(possibleStateClasses[i]);
        deviceState.stateValue = Boolean(i);
      }
    });
  });

  socket.on('server_UpdateNotificationSettings', function(data){ // Recieved when a notification setting has been updated and needs to be rerendered.
    gpioSelect.value = data.GPIOPin;
    discordWebhookLinkTextbox.value = data.discordWebhookLink;
    discordMessageTextbox.value = data.discordMessage;
  });

  socket.on('server_UpdateServerSettings', function(data){ // Recieved when a notification setting has been updated and needs to be rerendered.
    if (data.hostname === '') { data.hostname = 'N/A' }
    serverInfoHeader.innerHTML = `Current server: ${data.hostname}`;
  });

  socket.on('server_ErrorDevice', function(data){ // Recieved when a device ID does not exist or already added.
    alert(data.error);
  });

  socket.on('server_DeleteDevice', function(data){ // Recieved when a user has deleted a device and needs it to be destroyed in all current socket sessions.
    deviceHolder.querySelector(`#device${data.deviceID}`).remove();
  });
}

let serverSettingsOverlayBtn, notificationOverlayBtn, serverSettingsOverlay, notificationOverlay, serverSettingsSaveButton,
    notificationSaveButton, hostnameTextbox, serverPortTextbox, steamIDTextbox, playerTokenTextbox, gpioSelect, discordWebhookLinkTextbox,
    discordMessageTextbox, serverInfoHeader, deviceHolder, addDeviceBtn, deviceIDtxt, deviceNametxt;

function initVariables() {
  serverSettingsOverlayBtn = document.querySelector('#server-settings-btn__configuration');
  notificationOverlayBtn = document.querySelector('#notification-btn__configuration');

  serverSettingsOverlay = document.querySelector('#server-settings-overlay__server-settings-btn');
  notificationOverlay = document.querySelector('#notification-overlay__notification-btn');

  serverSettingsSaveButton=  document.querySelector('#save__server-settings-container');
  notificationSaveButton = document.querySelector('#save__notification-container');

  hostnameTextbox = document.querySelector('#hostname__server-settings-container');
  serverPortTextbox = document.querySelector('#server-port__server-settings-container');
  steamIDTextbox = document.querySelector('#steamid__server-settings-container');
  playerTokenTextbox = document.querySelector('#player-token__server-settings-container');

  discordWebhookLinkTextbox = document.querySelector('#discord-webhook-link__notification-container');
  discordMessageTextbox = document.querySelector('#discord-message__notification-container');
  gpioSelect = document.querySelector('#select__gpio-pin-container');

  serverInfoHeader = document.querySelector('#server-info__header');

  deviceHolder = document.querySelector('#device-holder__container');
  smartSwitchTemplate = document.querySelector('#smart-switch-template');
  smartAlarmTemplate = document.querySelector('#smart-alarm-template');

  addDeviceBtn = document.querySelector('#add-device-btn__device-creation');
  deviceIDtxt = document.querySelector('#device-id__device-detail-holder');
  deviceNametxt = document.querySelector('#device-name__device-detail-holder');
}

function initEventHandlers() {
    serverSettingsOverlayBtn.addEventListener('click', () => {
    serverSettingsOverlay.style.display = "block";
  });

  notificationOverlayBtn.addEventListener('click', () => {
    notificationOverlay.style.display = "block";
  });

  document.body.addEventListener('click', e => { // Was having werid click through events when using eventListeners and xxx-container
    if(e.target === serverSettingsOverlay || e.target === notificationOverlay){
      notificationOverlay.style.display = "none";
      serverSettingsOverlay.style.display = "none";
    }
  });

  serverSettingsSaveButton.addEventListener('click', () => {
    listOfTextboxToCheck = [hostnameTextbox, serverPortTextbox, steamIDTextbox, playerTokenTextbox];
    let errorCheck = false;

    listOfTextboxToCheck.forEach(textbox => {
      textbox.classList.remove("--error-highlight");
      if(textbox.value === "") {
        textbox.classList.add("--error-highlight");
        errorCheck = true;
      }
    });

    if(errorCheck) {
      alert("Error! Please fill in all the textboxes")
    } else {
      let dataToSend = {
        "hostname": hostnameTextbox.value,
        "rustPlusPort": parseInt(serverPortTextbox.value),
        "steamID": steamIDTextbox.value,
        "playerToken": parseInt(playerTokenTextbox.value)
      };
      socket.emit('client_UpdateServerSettings', dataToSend);
    }
  });

  notificationSaveButton.addEventListener('click', () => {
    listOfTextboxToCheck = [discordWebhookLinkTextbox, discordMessageTextbox];
    let errorCheck = false;

    listOfTextboxToCheck.forEach(textbox => {
      textbox.classList.remove("--error-highlight");
      if(textbox.value === "") {
        textbox.classList.add("--error-highlight");
        errorCheck = true;
      }
    });

    if(errorCheck) {
      alert("Error! Please fill in all the textboxes")
    } else {
      let dataToSend = {
        "GPIOPin": gpioSelect.value,
        "discordWebhookLink": discordWebhookLinkTextbox.value,
        "discordMessage": discordMessageTextbox.value
      };
      socket.emit('client_UpdateNotificationSettings', dataToSend);
    }
  });

  addDeviceBtn.addEventListener('click', () => {

    let err = false;
    [deviceIDtxt, deviceNametxt].forEach(item => {
      item.classList.remove("--error-highlight");
      if (item.value === '') {
        item.classList.add("--error-highlight");
        err = true;
      }
    });

    if (err) {
      alert('Error! missing required fields.');
    } else {
      socket.emit('client_AddDevice', {deviceID : deviceIDtxt.value, deviceName : deviceNametxt.value});
    }
  });
}

window.addEventListener('load', (event) => {
  initVariables();
  initEventHandlers();
  startWebSocket();
});
