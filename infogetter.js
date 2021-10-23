const fetch = require('cross-fetch');


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
    fetch("http://localhost:8080/json//sim/description")
    .then(res => {
      if (res.status >= 400) {
        throw new Error("Bad response from server");
      }
      return res.json();
    })
    .then(aircraftres => {
      aircraft = aircraftres.value
      fetch("http://localhost:8080/json//position")
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
          fetch(`http://localhost:8080/json//sim`)
          .then(res => {
            if (res.status >= 400) {
              throw new Error("Bad response from server");
            }
            return res.json();
          })
          .then(iconres => {
            fetch(`http://localhost:8080/json//sim/model/livery/name`)
            .then(res => {
              if (res.status >= 400) {
                throw new Error("Bad response from server");
              }
              return res.json();
            })
            .then(liveryres => {
              fetch(`http://localhost:8080/json//instrumentation/airspeed-indicator/true-speed-kt`)
              .then(res => {
                if (res.status >= 400) {
                  throw new Error("Bad response from server");
                }
                return res.json();
              })
              .then(airspeedres => {
                fetch(`http://localhost:8080/json//environment/metar/data`)
                .then(res => {
                  if (res.status >= 400) {
                    throw new Error("Bad response from server");
                  }
                  return res.json();
                })
                .then(metarres => {
                  icao = metarres.value.split(" ")[0]
                  icon = iconres.children[13].value
                  paintjob = "unknown"
                  console.log(liveryres.value)
                  if(liveryres.value == "" || liveryres.value == undefined) {
                    paintjobtext = "No data available"
                  }else{
                    paintjobtext = liveryres.value
                  }
                  if(geolocres.city == "") {
                    if(geolocres.locality == "") {
                      airspace = geolocres.principalSubdivision
                    }else{
                      airspace = geolocres.locality
                    }
                  }else{
                    airspace = geolocres.city
                  }
                  if(geolocres.countryCode == ""){
                    airspace = geolocres.locality + "🌊"
                  }else{
                    airspace = airspace + ` ${country2emoji(geolocres.countryCode)}`
                  }
                  cb({icao:icao,altidude:posres.children[2].value,airspeed:airspeedres.value ,aircraft:aircraft, icon:icon, paintjobicon:paintjob, paintjobtext:paintjobtext, airspace:airspace, latitude:posres.children[1].value, longitude:posres.children[0].value})
                })
                .catch(err => {
                  errcb(err)
                })
              })
              .catch(err => {
                errcb(err)
              })
            })
            .catch(err => {
              errcb(err)
            })
          })
          .catch(err => {
            errcb(err)
          })
        })
        .catch(err => {
          errcb(err)
        })
      })
      .catch(err => {
        errcb(err)
      })
    })
    .catch(err => {
      errcb(err)
    })
}