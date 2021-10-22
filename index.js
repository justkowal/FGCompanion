const fetch = require('cross-fetch');
const { app, Menu, Tray, BrowserWindow } = require('electron')
const client = require('discord-rich-presence')('900398628529664030');
const infogetter = require('./infogetter.js')
const path = require("path")

let appIcon = null
app.whenReady().then(() => {
  appIcon = new Tray(path.resolve("./trayicon.png"))
  const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Settings',
        type: 'normal',
        click: () => {
          popupwin = new BrowserWindow({
            height:800,
            width:600,
          })
          contextMenu.popup({
            window: popupwin,
          })
          popupwin.loadFile('index.html');
          console.log('Opened settings')
        }
      },
      {
        label:"About",
        type: 'normal',
      },
      {
        label: 'Exit',
        type: 'normal',
        click: () => {
          process.exit(0)
        }
      }
  ])
  function updateRPC(){
    infogetter("127.0.0.1","8080",(info) => {
      console.log(info)
      client.updatePresence({
        state: `SPD: ${info.airspeed.toFixed(0)} kt | ALT: ${info.altidude.toFixed(0)} ft`,
        details: `Flying over ${info.airspace}`,
        startTimestamp: Date.now(),
        endTimestamp: Date.now() + 15000,
        largeImageKey: info.icon.toLowerCase(),
        largeImageText: info.aircraft,
        smallImageKey: "paint",
        smallImageText: info.paintjobtext,
        instance: true,
      })
    })
    setTimeout(updateRPC,15000)
  }
  console.log(appIcon)
  
  updateRPC()
  
  appIcon.setContextMenu(contextMenu)
})