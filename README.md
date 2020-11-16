
# Rust Plus+
Rust Plus+ is a web-based equivalent to the Facepunch released companion app Rust+. In addition to the standard features of Rust+ this web app is also able to provide notifications through discord web hooks and also RPI buzzer integrations.

![Device ID photo](https://i.imgur.com/wNbbGKh.png)

# New Features!

  - Ability to turn smart switches on and off through the web GUI.
  - Ability to configure server settings and configure notification settings.
  - Ability to turn on a physical buzzer on a Raspberry Pi (No more 5am offlines! rip your sleep).
  - Ability to use discord web hooks to send notifications with custom messages.
  - An easier pairing method for devices
  - A web-based way of retrieving your Rust player token.

Features to come:
  - Maybe IFTTT integration if requested?

Huge shout out to [liamcottle] for the hard work on creating a nice nodeJS library to interact with Rust+. 

## Installation
There are two releases for Rust Plus+, one being a general purpose build that will run on most operating systems, and two being one build specifically for Raspbian. The non OS specific build does not include any mention of buzzer integrations whereas the Raspberry Pi build does. I will be going over the installation for both Windows and Raspbian.

### Windows Guide
This installation guide will be taking the assumption that you are using a Windows machine as the host.
#### Step 1: 
Download and install the prerequisites for Rust Plus+ which is only [nodeJS].
#### Step 2:
Download the latest general release of Rust Plus+ and extract the file to your chosen location.
#### Step 3:
Open up command prompt and navigate to the directory of Rust Plus+ and type:

```shell
npm install
npm start
```
#### Step 4:
Navigate to the IP address of the machine you are hosting in a web browser.

### Raspberry Pi Guide
This installation guide will be taking the assumption that you are using a Raspberry Pi as the host.

#### Step 1:
Install NOOBS onto your raspberry Pi from the [Raspberry Pi website](https://www.raspberrypi.org/downloads/). You will need to have your RPI's networking configured before you continue.
#### Step 2:
Open up a terminal on the Raspberry Pi and run the following commands: 
```sh
$ sudo apt-get update -y
$ sudo apt-get dist-upgrade -y
$ sudo apt-get install -y git

$ wget https://nodejs.org/dist/latest-v11.x/node-v11.15.0-linux-armv6l.tar.gz
$ tar -xzf node-v11.15.0-linux-armv6l.tar.gz
$ cd node-v11.15.0-linux-armv6l/
$ sudo cp -R * /usr/local/

$ git clone https://github.com/nerif-tafu/rustplusplus /home/pi/rustplusplus
$ cd /home/pi/rustplusplus

$ npm install  
$ sudo npm start
```

Go to your favourite web browser and navigate to http://serveripaddress to see your Rust Plus+ website

### Getting your server details
To use Rust Plus+ you must supply your server information and device details to receive notifications. You can get this information by heading to http://serveripaddress/pair and following the on-screen steps.
![Pairing device photo](https://i.imgur.com/hDgfzLg.png)


/pair is GUI version of liamcottles pairing CLI tool. Again props to him for doing all the hard work for this. To find out more about the CLI version please visit [liamcottle's lovely guide] on getting your pairing information.

Another way to get device ID's from within the game is to use the command debug.lookingat_debug when you are looking at a smart device. You can stop the information from displaying in game by running the command again while pointing at the device.

![Device ID photo](https://i.imgur.com/uYiuq2I.png)

### Discord notifications

To get Discord notifications setup you must first create a web hook from within your Discord server. Navigating to Server settings > Integrations > Web hooks > New Web hook > Copy Web hook URL will get your new web hook URL. Once you have the URL you can add the web hook URL to the "Notification settings" from your Rust Plus+ website. If you would like to mention a discord role you will need to get the role ID, you can get this by enabling developer settings from within Discord and then right clicking on the role from within Server Settings > Roles. To get the web hook to tag the role you must wrap the role ID with "<@ROLEID>". More info on this can be found [Here] (https://discordjs.guide/miscellaneous/parsing-mention-arguments.html)



[liamcottle]: <https://github.com/liamcottle/rustplus-api>
[liamcottle's lovely guide]: <https://github.com/liamcottle/rustplus-api#pairing>
[nodeJS]: <https://nodejs.org/en/>