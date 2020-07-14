
const THEMES = { day : "#3e96ee", night : "#1b4368", rain : "#4b6177" };

var appData = {
    data : {},
    unit : 'fahr',
    cond : "rain",
    icons : {
        "clear sky" : "☀",
        "few clouds" : "🌤",
        "broken clouds" : "🌤",
        "scattered clouds" : "⛅",
        "overcast clouds" : "☁",
        "light rain" : "🌦",
        "light intensity shower rain" : "🌦",
        "shower rain" : "🌦",
        "moderate rain" : "🌧",
        "heavy intensity rain" : "⛈",
        "thunderstorm" : "⛈",
        "mist" : "🌫",
        "fog" : "🌫"
    },
    night_icons : {
        "few clouds" : "☁",
        "broken clouds" : "☁",
        "scattered clouds" : "☁",
        "overcast clouds" : "☁",
        "light rain" : "🌧",
        "light intensity shower rain" : "🌧",
        "shower rain" : "🌧",
        "moderate rain" : "🌧",
        "heavy intensity rain" : "⛈",
        "thunderstorm" : "⛈",
        "mist" : "🌫",
        "fog" : "🌫"
    },
    
    rain_cond : ["light intensity shower rain","moderate rain","heavy rain","thunderstorm","heavy intensity rain"],
    
    changeUnits : function(unit){
        if (unit != app.UNIT_C && unit != app.UNIT_F) return false;
        app.unit = unit;
        document.body.setAttribute('data-unit',unit)
    },
    
}

var app = new Vue ({
    el: "#app",

    data: {
        openWeatherID: "48cd58f888a06eff3e989435bea46736",
        unit: 'fahr',
        isDay: false,
        currentData: {},
        forecastHours: [],
        message: "hello",
        UNIT_C: 'cels',
        UNIT_F: 'fahr',
        DAYS: ["sun","mon","tue","wed","thu","fri","sat"],
        pre_cities: ["Moscow","los angeles","Denver","New York","London","Hong Kong"],
        pre_data: [],
    },

    created() {
        this.getWeatherFor('New York')
    },

    mounted() {
        this.getLocalWeather();
    },

    methods: {
        getLocalWeather() {
            console.log("called function")
            if (navigator) {
                this.loading = true;
                navigator.geolocation.getCurrentPosition(
                    res => {
                        console.log(res)
                        let lat = res.coords.latitude;
                        let lon = res.coords.longitude;
                        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.openWeatherID}`)
                        .then( function(response) {
                            return response.json();
                        })
                        .then(function(weather) {
                            console.log(weather);
                            if(weather.cod === 200){
                                app.updateCurrent(weather);
                            }
                        })

                        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.openWeatherID}`)
                        .then( function(response) {
                            return response.json();
                        })
                        .then(function(prog) {
                            app.forecastHours = prog.list;
                        })
                    },
                    err => console.log(err)
                );
            }
        },

        formatKTemp(ktemp) {
            return this.unit == this.UNIT_C ? Math.floor(k - 273.15) : Math.floor(obj.c * 1.8 + 32);
        },

        toggleUnits(){
            $('input[name="units"]').click()
        },

        getWeatherFor(city){
        
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.openWeatherID}`)
            .then( function(response) {
                return response.json();
            })
            .then(function(weather) {
                console.log(weather);
                if(weather.cod === 200){
                    app.updateCurrent(weather);
                    app.getForecastFor(city);
                }
            })
        },        

        updateCurrent(weather) {
        
            let forTime = getForeignTimeAt( new Date(), weather.timezone );
            let forSunrise = getForeignTimeAt( dateFromSec(weather.sys.sunrise), weather.timezone );
            let forSunset = getForeignTimeAt( dateFromSec(weather.sys.sunset), weather.timezone );
        
            if (forTime > forSunrise && forTime < forSunset) appData.dayCycle = "day";
            else  appData.dayCycle = "night";
        
            document.querySelector('head > meta[name="theme-color"]').content = THEMES[appData.dayCycle];
        
            let condDesc = weather.weather[0].description;
        
            if (appData.rain_cond.indexOf(condDesc) >= 0) {
                document.body.setAttribute('data-weather-cycle',"rain")
                document.querySelector('head > meta[name="theme-color"]').content = THEMES.rain;
            }
            else  document.body.removeAttribute('data-weather-cycle')
        
            document.body.setAttribute('data-day-cycle',appData.dayCycle)
        
            weather.icons = getIconsFor(condDesc, appData.dayCycle);
        
            document.title = `${weather.icons.main} ${tempCFPair(weather.main.temp)}° - ${condDesc}`;
        
            weather.time = dateToHourMin( forTime )
            weather.sunrise = dateToHourMin( forSunrise )
            weather.sunset = dateToHourMin( forSunset )
        
            weather.temp = tempCFPair(weather.main.temp)
            weather.lowTemp = tempCFPair(weather.main.temp_min)
            weather.highTemp = tempCFPair(weather.main.temp_max)
            
            weather.wind.mph = windToMPH(weather.wind.speed)
            weather.wind.degStyle = `transform: rotate(${ weather.wind.deg }deg)`
            
            appData.data = weather;
            this.currentData = weather;

            renderPreviews();
        },


        getForecastFor(city){
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${this.openWeatherID}`)
            .then( function(response) {
                return response.json();
            })
            .then(function(prog) {
                app.forecastHours = prog.list;
            })
        },

    },

    computed: {
        async citiesData() {
            return this.pre_cities;
        },

        hourlyInfo() {
            return this.forecastHours.map( function(hour){
                let obj = {}

                let forTime = getForeignTimeAt( dateFromSec(hour.dt), appData.data.timezone );
                let forSunrise = getForeignTimeAt( dateFromSec(appData.data.sys.sunrise), appData.data.timezone );
                let forSunset = getForeignTimeAt( dateFromSec(appData.data.sys.sunset), appData.data.timezone );
                
                obj.isDay = forTime.getHours() > forSunrise.getHours() && forTime.getHours() < forSunset.getHours();
                obj.day = app.DAYS[forTime.getDay()];
                obj.time = dateToHour(forTime);
                
                let descr = hour.weather[0].description;

                let dayCycle = '';
                if (forTime.getHours() > forSunrise.getHours() && forTime.getHours() < forSunset.getHours()) dayCycle = "day";
                else  dayCycle = "night";
                obj.iconHTML = getIconsFor(descr, dayCycle).HTML;
            
                obj.highTemp = tempCFPair(hour.main.temp_max);
                obj.lowTemp = tempCFPair(hour.main.temp_min);

                obj.summary = hour.weather[0].main;

                return obj;
            })
        }
    }
})



function renderPreviews(){
    $('#previews_container tbody')[0].innerHTML = "";
    app.pre_cities.forEach( city => getPreviewFor(city) );
}

function getPreviewFor(city){
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=48cd58f888a06eff3e989435bea46736`)
    .then( function(response) {
        return response.json();
    })
    .then(function(weather) {
        console.log(weather)
        calculatePreviewData(weather);
    })
}

function calculatePreviewData(city){
    forTime = getForeignTimeAt( new Date(), city.timezone);
    let forSunrise = getForeignTimeAt( dateFromSec(city.sys.sunrise), city.timezone );
    let forSunset = getForeignTimeAt( dateFromSec(city.sys.sunset), city.timezone );
    let dayCycle;

    if (forTime.getHours() > forSunrise.getHours() && forTime.getHours() < forSunset.getHours()) dayCycle = "day";
    else  dayCycle = "night";

    let descr = city.weather[0].description;

    city.time = dateToHourMin(forTime)
    city.icons = getIconsFor(descr, dayCycle);
    city.temp = tempCFPair(city.main.temp)    
    app.pre_data.push(city)
}






function getIconsFor(cond, dayCycle){
    let condIcon;
    let iconHTML = "";

    if ( dayCycle == "night" ){

        if (appData.night_icons.hasOwnProperty(cond)) {
            condIcon = appData.night_icons[cond];
            iconHTML += `🌙<div class="icon-secondary">${condIcon}</div>`;
        }
        else {
            condIcon = "🌙";
            iconHTML = condIcon;
        }
    }
    else {
        condIcon = appData.icons.hasOwnProperty(cond) ?
            appData.icons[cond] : '☀';
        iconHTML = condIcon;
    }

    return { "main" : condIcon, "HTML" : iconHTML, }
}





function tempCFPair(k) {
    let obj = {};
    obj.c = Math.floor(k - 273.15);
    obj.f = Math.floor(obj.c * 1.8 + 32);
    return obj;
}

function windToMPH(s) {
    return (s * 2.237).toFixed(2)
}






function getForeignTimeAt(date, zone) {
    localOffset = date.getTimezoneOffset() * 60000;
    foreignOffset = zone * -1000;
    timeDifference = (localOffset - foreignOffset);

    let foreignTime = date.getTime() + timeDifference;

    return new Date(foreignTime);
}

function dateFromSec(secs){
    return new Date(secs * 1000)
}

function dateToHourMin(date){
    let hr12 = "AM"
    
    let hrs = date.getHours();
    if (hrs >= 12) hr12 = "PM";
    if (hrs == 0) hrs = "12"
    else if(hrs > 12) hrs -= 12;

    let mins = date.getMinutes();
    if (mins < 10) mins = "0"+mins;

    return `${hrs}:${mins} ${hr12}` 
}

function dateToHour(date){
    let hr12 = "AM"
    
    let hrs = date.getHours();
    if (hrs >= 12) hr12 = "PM";
    if (hrs == 0) hrs = "12"
    else if(hrs > 12) hrs -= 12;

    return `${hrs} ${hr12}` 
}



$('input[name="units"]').on('change', function() {
    if($('input[name="units"]:checked').length) appData.changeUnits(app.UNIT_F);
    else appData.changeUnits(app.UNIT_C);
})


