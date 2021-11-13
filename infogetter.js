const fetch = require('cross-fetch');
const customprops = require('./customplaceholders.js')


function country2emoji(country_code) {
  var OFFSET = 127397;
  var cc = country_code.toUpperCase();
  function _toConsumableArray(arr) {
      if (Array.isArray(arr)) {
          for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
              arr2[i] = arr[i];
          }
          return arr2;
      } else {
          return Array.from(arr);
      }
  }
  return /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint.apply(String, _toConsumableArray([].concat(_toConsumableArray(cc)).map(function (c) {
      return c.charCodeAt() + OFFSET;
  }))) : "🌊";
}

module.exports = function(address,port,cb,errcb){
  const promises = [
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//sim/description`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//position`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(posres => {
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${posres.children[1].value}&longitude=${posres.children[0].value}&localityLanguage=en`)
        .then(res => {
          if (res.status >= 400) {
            throw new Error("Bad response from server");
          }
          return res.json();
        })
        .then(geolocres => {
          resolve({
            latitude: posres.children[1].value,
            longitude: posres.children[0].value,
            altitude: posres.children[2].value,
            geolocres: geolocres
          })
        }).catch(reject)
      }).catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//sim`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
         return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//sim/model/livery/name`)
      .then(res => {
         if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//instrumentation/airspeed-indicator/true-speed-kt`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//environment/metar/data`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//autopilot/route-manager/ete`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//autopilot/route-manager/departure/airport`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//autopilot/route-manager/destination/airport`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
    new Promise(function(resolve,reject){
      fetch(`http://${address}:${port}/json//orientation/heading-deg`)
      .then(res => {
        if (res.status >= 400) {
          throw new Error("Bad response from server");
        }
        return res.json();
      })
      .then(resolve)
      .catch(reject)
    }),
  ];
  Promise.all(promises).then(vals => {
    icao = vals[5].value.split(" ")[2]
    icon = vals[2].children[13].value
    paintjob = "unknown"
    if(vals[3].value == "" || vals[3].value == undefined) {
      paintjobtext = "No data available"
    }else{
      paintjobtext = vals[3].value
    }
    if(vals[1].geolocres.city == "") {
      if(vals[1].geolocres.locality == "") {
        airspace = vals[1].geolocres.principalSubdivision
      }else{
        airspace = vals[1].geolocres.locality
      }
    }else{
      airspace = vals[1].geolocres.city
    }
    if(vals[1].geolocres.countryCode == ""){
      airspace = vals[1].geolocres.locality
      emoji = "🌊"
    }else{
      airspace = airspace
      emoji = country2emoji(vals[1].geolocres.countryCode)
    }
    if(vals[6].value > "360000" || vals[6].value == 0){
      ete = "Unknown"
    }else{
      ete = vals[6].value
    }
    customprops(cb,{
        desticao:vals[8].value,
        depicao:vals[7].value,
        ete:ete,
        icao:icao,
        alt:vals[1].altitude.toFixed(0),
        airspeed:vals[4].value.toFixed(0),
        aircraft:vals[0].value,
        icon:icon.split("-")[0].toLowerCase(),
        paintjobicon:paintjob,
        paintjobtext:paintjobtext,
        airspace:airspace,
        emoji:emoji,
        latitude:vals[1].latitude,
        longitude:vals[1].longitude,
        heading:vals[9].value,
      }
    )
  }).catch(errcb)                          
}