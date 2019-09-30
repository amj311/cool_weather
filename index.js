
document.getElementById("city").addEventListener('keyup', function(){
    if( document.getElementById("city").value === "" ) document.getElementById('citiesList').innerHTML = "";
    else {
        
        let query = this.value;
        let listHTML = "";

        const url = "http://bioresearch.byu.edu/cs260/jquery/getcity.cgi?q="+query;

        fetch(url)
            .then(function(response) {
                return response.json();
            }).then(function(cities) {
                console.log(cities);
                if(cities.length > 0){        
                    for ( city of cities ){
                        listHTML += `<li class="clickable" onclick="applyTextFrom(this)">${city.city}</li>`
                    }
                }
                else listHTML = "<li>No matches.</li>"

                document.getElementById('citiesList').innerHTML = `<ul>${listHTML}</ul>`;
            });
    }
});

function getCitiesLike(string){
    //console.log(string)
    let matches = [];
    for (city of cities){
        if( city.toLowerCase().indexOf( string.toLowerCase() ) >= 0 ) matches.push(city);
    }
    return matches;
}

function applyTextFrom(el){
    document.getElementById('city').value = el.innerText;
    document.getElementById('citiesList').innerHTML = "";
}

function getWeatherFor(city){
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=48cd58f888a06eff3e989435bea46736`).then( function(response) {
	    return response.json();
    }).then(function(weather) {
        console.log(weather);
        if(weather.cod === 200){
            document.getElementById('weather').innerHTML = `Condition: ${kelvinToF(weather.main.temp)}`
        }
})
}

function kelvinToF(k) { return Math.floor((k - 273.15) * 1.8 + 32) }
function kelvinToC(k) { return Math.floor(k - 273.15) }