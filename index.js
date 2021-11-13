const { app, Menu, Tray, BrowserWindow, ipcMain, screen, dialog } = require('electron')
const infogetter = require('./infogetter.js')
const path = require("path")
const fs = require('fs')
const express = require("express")
const { io } = require("socket.io-client")
const { Server } = require("socket.io")
const fetch = require('cross-fetch')
const { exec } = require("child_process");

const serverio = new Server({  
  cors: {    
    origin: "*",     
  }}
)

const webapp = express()
const port = 2137

const url = process.argv[2]
const handleurl = url != undefined 

var userinfo = {}

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

settings.reloadSettings()

var clientsocket = io('http://localhost:8081/', {auth:{token:settings.properties.token}})
clientsocket.on('requestjoinresponse',(info)=>{
  showToast("Join Request",`${info.name} wants to join you in-game`,{btn1:"Accept",btn2:"Deny"},60000,(toastinfo)=>{
    data = {
      userid:info.userid,
      packet:{}
    }
    if(toastinfo == 'btn1'){
      infogetter(settings.properties.address,settings.properties.port,(info) => {
        data.packet = {
          accepted:true,
          position:{
            lat:info.latitude,
            lon:info.longitude,
            alt:info.altitude,
            hdg:info.heading,
          }
        }
      },()=>{
        data.packet.accepted = false
      })
    }else{
      data.packet = {
        accepted:false
      }
    }
    clientsocket.emit('sendjoinresponse',data)
  })
})
clientsocket.on('joinresponse', (info)=>{
  if(info.accepted){
    showToast("Join Request",`Your request to join ${info.name} was accepted`,undefined,5000)
    dialog.showMessageBox({
      message:"Join in Multiplayer is supported ONLY for Cessna 172p\nYou can force game to start with other aircraft but it's unsupported\nDo you want to continue?",
      type:"question",
      title:"Join Request",
      buttons:[
        "Contiune with C172p",
        "Continue with other aircraft (Launcher)",
        "Cancel Join"
      ],
      cancelId:2
    }).then((info)=>{
      if(info.response == 0){
        console.log("Starting game with Cessna 172p")
        exec(settings.properties.fgpath + ` --lat=${info.position.lat} --lon=${info.position.lon} --altitude=${info.position.alt} --heading=${info.position.hdg} --roll=0 --pitch=0 --roc=0 --enable-freeze --aircraft=c172p`)
      }else if(info.response == 1){
        console.log("Starting game with other aircraft")
      }
    })
  }else{
    showToast("Join Request",`Your request to join ${info.name} was denied`,undefined,5000)
  }
})
clientsocket.on('userinfo' , (info)=>{
  userinfo = info
})

function parseFormattedText(text,info){
  var formattedText = text
  Object.keys(info).forEach(key => {
    formattedText = formattedText.replaceAll(`{${key}}`,info[key])
  })
  return formattedText
}

function showToast(title,message,buttons,timeout,btncallback){
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  console.log(width,height)
  const toastwin = new BrowserWindow({
    frame: false,
    width: 300,
    height: 125,
    x:width-300,
    y:0,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  toastwin.loadFile("toast.html")
  toastwin.webContents.executeJavaScript(`loadContent(\`${JSON.stringify({title:title,content:message,...buttons})}\`)`)
  ipcMain.once('btn-pressed',(event, args) => {
    try{
      toastwin.close()
      btncallback(args)
    }catch(err){
      console.log(err)
    }
  })
  if(timeout != undefined){
    setTimeout(function(){try{toastwin.close()}catch(err){console.error(err)}},timeout)
  }
}

app.whenReady().then(() => {
  if(!handleurl){
    if(settings.properties.fgpath == "" || settings.properties.fgpath == undefined){
      dialog.showMessageBoxSync({
        message:"The FlightGear executable path is not specified in config\nIt's required for Join in Multiplayer\nDue to Electron Bug you need to add property 'fgpath' to your settings.json file manually.",
        type:"question",
        title:"FGCompanion Setup",
        buttons:[
          "OK"
        ]
      })
      /*
      Section disabled because of electron bug
      See https://github.com/electron/electron/issues/31152
      settings.properties.fgpath  = dialog.showOpenDialogSync({
        title:"FGCompanion Setup",
        properties: ['openFile']
      })
      */
      settings.properties.fgpath = ""
      settings.overwriteSettings(settings.properties)
    }
    serverio.on("connection", (socket) => {
      socket.on("handleurl",(url)=>{
        console.log(url)
      })
    });
    serverio.listen(3000);
    webapp.get('/auth', (req, res) => {
      console.log(req.query)
      fetch("http://localhost:8081/auth/gettoken",{
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({code: req.query.code})
      }).then(resp => {
        if (resp.status >= 400) {
            const err = new Error("Bad response from server")
            err.code = res.status
            throw err
        }
            return resp.json();
        }
      )
      .then(resp => {
        console.log(resp)
        settings.properties.token = resp.token
        settings.overwriteSettings(settings.properties)
        clientsocket.auth.token = resp.token
        clientsocket.connect()
      })
      res.send(`<script>window.close()</script>`)
    })
    webapp.get('/join', (req,res) => {
      clientsocket.emit("joinrequest", {userid:req.query.user})
      res.send("You can close this window now")
    })
    webapp.listen(port, () => {
      console.log(`Temporary app server listening at http://localhost:${port}`)
    })
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
    ipcMain.on('get-account-info', (event, arg) => {
      if(clientsocket.connected){
        event.reply('account-info',{status:true, info:userinfo})
      }else{
        event.reply('account-info',{status:false, err:"User not logged in"})
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
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false
              },
              width: 1000,
              height: 650,
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
        infogetter(settings.properties.address,settings.properties.port,(info) => {
          if(settings.properties.autoOffRPC && contextMenu.items[0].checked){
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

          btn = []

          if(settings.properties.showRepoButton){
            btn=[{label : "Github Repo" , url : "https://github.com/justkowal/FGCompanion"}]
          }

          if(settings.properties.showJoinInMP && clientsocket.connected){
            btn=[{label : "Join in Multiplayer", url : `http://localhost:2137/join?user=${userinfo.discordid}`}]
          }

          if(btn.length == 0){
            btn = undefined
          }

          if(info.desticao == '' || info.depicao == ''){
              client.updatePresence({
                state: parseFormattedText(settings.properties.statePattern, info),
                details: parseFormattedText(settings.properties.detailsPattern, info),
                startTimestamp: startdate,
                endTimestamp: undefined,
                largeImageKey: info.icon,
                largeImageText: info.aircraft,
                smallImageKey: "paint",
                smallImageText: info.paintjobtext,
                buttons : btn,
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
                buttons : btn,
                instance: true,
              })
            }
            appIcon.setImage(greendot)
          },(error) => {
            console.log(error)
            appIcon.setImage(reddot)
            if(settings.properties.autoOffRPC && contextMenu.items[0].checked){
              console.log('Disconnecting RPC')
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
  }else{
    socket = io('http://localhost:3000/')
    socket.on('connect', function () {
      socket.emit("handleurl",url)
      setTimeout(process.exit,5000)
    })
    socket.connect()
  }
})
