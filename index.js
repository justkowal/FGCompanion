const { app, Menu, Tray, BrowserWindow, nativeImage, ipcMain } = require('electron')
const infogetter = require('./infogetter.js')
const path = require("path")
const fs = require('fs');

var settings = {
  properties:{},
  reloadSettings: function(){
    let rawdata = fs.readFileSync('settings.json')
    this.properties = JSON.parse(rawdata)
  },
  overwriteSettings: function(data){
    fs.writeFileSync('settings.json', JSON.stringify(data))
    this.reloadSettings()
  }
}

function parseFormattedText(text,info){
  var formattedText = text
  Object.keys(info).forEach(key => {
    formattedText = formattedText.replaceAll(`{${key}}`,info[key])
  })
  return formattedText
}

app.whenReady().then(() => {
  var startdate = Date.now()
  settings.reloadSettings()
  ipcMain.on('get-settings', (event, arg) => {
    settings.reloadSettings()
    event.reply('get-settings-reply', settings.properties)
  })
  ipcMain.on('save-settings', (event, arg) => {
    try{
      settings.overwriteSettings(arg)
      event.reply('save-settings-reply', "ok")
    }catch(err){
      event.reply('save-settings-reply', err.message)
    }
    
  })
  app.on('window-all-closed', e => e.preventDefault())
  var suffix = ".png"
  if(process.platform === "win32"){
    suffix=".ico"
  }
  const greendot = path.join(__dirname, 'trayicon_greendot'+suffix)
  const reddot = path.join(__dirname, 'trayicon_reddot'+suffix)
  appIcon = new Tray(path.join(__dirname, 'trayicon'+suffix))
  
  appIcon.setToolTip("FGCompanion")

  const contextMenu = Menu.buildFromTemplate(
    [
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
          const win = new BrowserWindow({
            icon: __dirname + 'trayicon.png',
            webPreferences: {
              preload: path.join(__dirname, 'preload.js')
            }
          })
          //win.removeMenu()
          win.loadFile("index.html")
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
    ]
  )

  function updateRPC(){
      infogetter("127.0.0.1","8080",(info) => {
        if(settings.properties.autoOffRPC && !contextMenu.items[0].checked){
          try{
            console.log('Connecting RPC')
            client = require('discord-rich-presence')('900398628529664030')
            contextMenu.items[0].checked = true
            appIcon.setContextMenu(contextMenu)
            startdate = Date.now()
          }catch(err){
            appIcon.setImage(reddot)
          }
        }
        var ete = 0
        if(info.ete == "Unknown"){
          ete = undefined
        }else{
          ete = Date.now() + info.ete*1000
        }
        console.log(info)
        if(info.desticao == '' || info.depicao == ''){
            client.updatePresence({
              state: parseFormattedText(settings.properties.statePattern, info),
              details: parseFormattedText(settings.properties.detailsPattern, info),
              startTimestamp: startdate,
              endTimestamp: ete,
              largeImageKey: info.icon,
              largeImageText: info.aircraft,
              smallImageKey: "paint",
              smallImageText: info.paintjobtext,
              buttons : [
                {label : "🐱‍💻Github Repo" , url : "https://github.com/justkowal/FGCompanion"},
              ],
              instance: true,
            })
          }else{
            client.updatePresence({
              state: parseFormattedText(settings.properties.statePatternRoute, info),
              details: parseFormattedText(settings.properties.detailsPatternRoute, info),
              startTimestamp: startdate,
              endTimestamp: ete,
              largeImageKey: info.icon,
              largeImageText: info.aircraft,
              smallImageKey: "paint",
              smallImageText: info.paintjobtext,
              buttons : [
                {label : "🐱‍💻Github Repo" , url : "https://github.com/justkowal/FGCompanion"},
              ],
              instance: true,
            })
          }
          appIcon.setImage(greendot)
        },(error) => {
          console.log(error)
          appIcon.setImage(reddot)
          if(settings.properties.autoOffRPC){
            console.log('Disconnecting RPC')
            contextMenu.items[0].checked = false
            appIcon.setContextMenu(contextMenu)
            client.disconnect()
            client = null
          }
        })
    setTimeout(updateRPC,15000)
  }
  console.log('Connecting RPC')
  try{
    client = require('discord-rich-presence')('900398628529664030')
  }catch(err){
    console.log(err)
    appIcon.setImage(reddot)
  }
  contextMenu.items[0].checked = true
  updateRPC()

  appIcon.setContextMenu(contextMenu)
})