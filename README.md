# Rust Plus+
[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

Rust Plus+ is a web-based equivalent to the Facepunch released companion app Rust+. In addition to the standard features of Rust+ this web app is also able to provide notifications through discord webhooks and RPI buzzer integrations

![Device ID photo](https://i.imgur.com/wNbbGKh.png)

# New Features!

  - Ability to turn smart switches on and off through the web GUI.
  - Ability to configure server settings and configure notification settings.
  - Ability to turn on a physical buzzer on a Raspberry Pi (No more 5am offlines! rip your sleep).
  - Ability to use discord webhooks to send notifications with custom messages.

Features to come:
  - An easier pairing method for devices
  - A web-based way of retrieving your Rust player token.
  - Maybe IFTTT integration?

Huge shoutout to [liamcottle] for the hard work on creating a nice nodeJS library to interact with Rust+. 

### Installation

Rust plus+ requires [Node.js](https://nodejs.org/) v14+ to run.

Install the dependencies start the server.

```sh
$ npm install -d
$ npm start
```

Go to your favorite web browser and navigate to http://<serveripaddress>:80 to see your Rust plus+



### Getting your server details

To find out your server and player details such as server hostname, app port, Steam ID and player Token please use [liamcottle's lovely guide] on getting your pairing information.

Another way to get device ID's from within the game is to use the command debug.lookingat_debug when you are looking at a smart device. You can stop the information from displaying in game by running the command again while pointing at the device.

![Device ID photo](https://i.imgur.com/uYiuq2I.png)

[liamcottle]: <https://github.com/liamcottle/rustplus-api>
[liamcottle's lovely guide]: <https://github.com/liamcottle/rustplus-api#pairing>
