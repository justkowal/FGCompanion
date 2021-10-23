const fetch = require('cross-fetch');
const { app, Menu, Tray, BrowserWindow, nativeImage } = require('electron')
const infogetter = require('./infogetter.js')
const path = require("path")

app.whenReady().then(() => {
  const greendot = nativeImage.createFromPath(path.resolve("./trayicon_greendot.png"))
  const reddot = nativeImage.createFromPath(path.resolve("./trayicon_reddot.png"))
  appIcon = new Tray(nativeImage.createFromPath(path.resolve("./trayicon.png")))
  appIcon.setToolTip("FGCompanion | Initializing...")
  const contextMenu = Menu.buildFromTemplate([
      {
        label: 'RPC',
        type: 'checkbox',
        click: () => {
          if(contextMenu.items[0].checked){
            console.log('Connecting RPC')
            try{
              client = require('discord-rich-presence')('900398628529664030')
            }catch(err){
              appIcon.setImage(reddot)
            }
          }else{
            console.log('Disconnecting RPC')
            client.disconnect()
            client = null
            appIcon.setImage(reddot)
          }
        }
      },
      { 
        label: 'Settings',
        type: 'normal',
        click: () => {
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
          largeImageKey: info.pngn.toLowerCase(),
          largeImageText: info.aircraft,
          smallImageKey: "paint",
          smallImageText: info.paintjobtext,
          instance: true,
        })
        appIcon.setImage(greendot)
      },(error) => {
        appIcon.setImage(reddot)
      })
    setTimeout(updateRPC,15000)
  }
  console.log('Connecting RPC')
  try{
    client = require('discord-rich-presence')('900398628529664030')
  }catch(err){
    appIcon.setImage(reddot)
  }
  contextMenu.items[0].checked = true
  updateRPC()

  appIcon.setContextMenu(contextMenu)
})