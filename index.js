const UNIT_C = 'cels';
const UNIT_F = 'fahr';
const DAYS = ["sun","mon","tue","wed","thu","fri","sat"]
const THEMES = { day : "#3e96ee", night : "#1b4368", rain : "#4b6177" };

var app = {
    data : {},
    unit : UNIT_F,
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
    rain_cond : ["moderate rain","heavy rain","thunderstorm","heavy intensity rain"],
    pre_cities : ["los angeles","Denver","New York","London","Moscow","Hong Kong"]
}

function getWeatherFor(city){
    document.getElementById('weather').innerHTML = `Loading...`

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=48cd58f888a06eff3e989435bea46736`)
    .then( function(response) {
	    return response.json();
    })
    .then(function(weather) {
        console.log(weather);
        if(weather.cod === 200){
            updateCurrent(weather);
            getForecastFor(city);
            document.getElementById('weather').innerHTML = `Condition: ${convertTemp(weather.main.temp)}`
        }
            else document.getElementById('weather').innerHTML = `No data.`
    })
}

function updateCurrent(weather){
    app.data = weather;

    let forTime = getForeignTimeAt( new Date(), app.data.timezone );
    let forSunrise = getForeignTimeAt( dateFromSec(app.data.sys.sunrise), app.data.timezone );
    let forSunset = getForeignTimeAt( dateFromSec(app.data.sys.sunset), app.data.timezone );

    if (forTime > forSunrise && forTime < forSunset) app.dayCycle = "day";
    else  app.dayCycle = "night";

    document.querySelector('head > meta[name="theme-color"]').content = THEMES[app.dayCycle];

    let condDesc = app.data.weather[0].description;

    if (app.rain_cond.indexOf(condDesc) >= 0) {
        document.body.setAttribute('data-weather-cycle',"rain")
        document.querySelector('head > meta[name="theme-color"]').content = THEMES.rain;
    }
    else  document.body.removeAttribute('data-weather-cycle')

    document.body.setAttribute('data-day-cycle',app.dayCycle)

	$('#cur_conditions .description')[0].innerText = condDesc;
    

    let icons = getIconsFor(condDesc, app.dayCycle);
    $('#cur_conditions .icon')[0].innerHTML = icons.HTML;

    document.title = `${icons.main} ${convertTemp(app.data.main.temp)}° - ${condDesc}`;



    $('.cur-for-time')[0].innerHTML = dateToHourMin( forTime )
    $('.sunrise-num')[0].innerText = dateToHourMin( forSunrise )
    $('.sunset-num')[0].innerText = dateToHourMin( forSunset )

    $('#cur_temp')[0].innerText = convertTemp(app.data.main.temp)
    $('.temp-low')[0].innerText = convertTemp(app.data.main.temp_min)
    $('.temp-high')[0].innerText = convertTemp(app.data.main.temp_max)
    
    $('.city-name')[0].innerHTML = `${app.data.name}, ${app.data.sys.country}`
    $('.latitude')[0].innerHTML = `${app.data.coord.lat}`
    $('.longitude')[0].innerHTML = `${app.data.coord.lon}`

    $('.humid-num')[0].innerText = app.data.main.humidity
    $('.humid-num')[1].innerText = app.data.main.humidity

    $('.press-num')[0].innerText = app.data.main.pressure

    $('.wind-num')[0].innerText = app.data.wind.speed
    $('.wind-deg').css('transform',`rotate(${ app.data.wind.deg }deg)`)

    renderPreviews();
}










function getForecastFor(city){
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=48cd58f888a06eff3e989435bea46736`)
    .then( function(response) {
        return response.json();
    })
    .then(function(prog) {
        renderForecast(prog);
    })
}

function renderForecast(data){
    const forecastList = document.getElementById('hours_container')
    let listHTML = "";
    for ( hour in data.list ) listHTML += forecastHourHTMl(data.list[hour]);

    forecastList.innerHTML = listHTML;
}

function forecastHourHTMl(hour){
                
    let forTime = dateFromSec(hour.dt);
    console.log(dateFromSec(hour.dt))
    let dayTimeHTML = `<span class="day">${DAYS[forTime.getDay()]}</span><span class="hour">${dateToHour(forTime)}</span>`;
    let forSunrise = dateFromSec(hour.sys.sunrise);
    let forSunset = dateFromSec(hour.sys.sunset);
    let dayCycle;

    if (forTime.getHours() > forSunrise.getHours() && forTime.getHours() < forSunset.getHours()) dayCycle = "day";
    else  dayCycle = "night";

    let descr = hour.weather[0].description;
    console.log(descr)

    let icons = getIconsFor(descr, dayCycle);

    let iconDivHTML = `<div class="icon">${icons.HTML}</div>`
 
    let highTemp = convertTemp(hour.main.temp_max)
    let tempsHTML = `<span class="temp-pair temp-high">${highTemp}</span>`

    return  `<div class="forecast-hour">
                <div>${dayTimeHTML}</div>
                ${iconDivHTML}
                <div>${tempsHTML}&nbsp;&nbsp;|&nbsp;&nbsp;<span class="description">${hour.weather[0].main}</span></div>
            </div>`
}









function renderPreviews(){
    $('#previews_container tbody')[0].innerHTML = "";
    for ( city in app.pre_cities ) getPreviewFor(app.pre_cities[city]);

}

function getPreviewFor(city){
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=48cd58f888a06eff3e989435bea46736`)
    .then( function(response) {
        return response.json();
    })
    .then(function(weather) {
        console.log(weather)
        renderPreviewCity(weather);
    })
}

function renderPreviewCity(data){
    const previewList = $('#previews_container tbody')[0];
                
    let forTime = getForeignTimeAt( new Date(), data.timezone);
    let forSunrise = getForeignTimeAt( dateFromSec(data.sys.sunrise), data.timezone );
    let forSunset = getForeignTimeAt( dateFromSec(data.sys.sunset), data.timezone );
    let dayCycle;

    if (forTime.getHours() > forSunrise.getHours() && forTime.getHours() < forSunset.getHours()) dayCycle = "day";
    else  dayCycle = "night";

    let descr = data.weather[0].description;

    let icons = getIconsFor(descr, dayCycle);
    
    let cityHTML =  `<tr class="city_preview" onclick="getWeatherFor('${data.name}, ${data.sys.country}')">
                        <td class="icon">${icons.HTML}</td>
                        <td class="city">${data.name}, ${data.sys.country}</td>
                        <td class="cur-for-time">${dateToHourMin(forTime)}</td>
                        <td class="temp-pair">${convertTemp(data.main.temp)}</td>
                        <td class="humid-num">💧 ${data.main.humidity}</td>
                    </tr>`;

    previewList.innerHTML += cityHTML;

}






function getIconsFor(cond, dayCycle){
    let condIcon;
    let iconHTML = "";

    if ( dayCycle == "night" ){

        if (app.night_icons.hasOwnProperty(cond)) {
            condIcon = app.night_icons[cond];
            iconHTML += `🌙<div class="icon-secondary">${condIcon}</div>`;
        }
        else {
            condIcon = "🌙";
            iconHTML = condIcon;
        }
    }
    else {
        condIcon = app.icons.hasOwnProperty(cond) ?
            app.icons[cond] : '☀';
        iconHTML = condIcon;
    }

    return { "main" : condIcon, "HTML" : iconHTML, }
}





function convertTemp(k) {
    if ( app.unit === UNIT_F ) return Math.floor((k - 273.15) * 1.8 + 32);
    else return Math.floor(k - 273.15)
}

function changeUnits(unit){
    if (unit != UNIT_C && unit != UNIT_F) return false;
    app.unit = unit;
    document.body.setAttribute('data-unit',unit)
    updateCurrent(app.data)
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


getWeatherFor('Provo')