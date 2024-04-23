import { formatInTimeZone } from "date-fns-tz";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// or KDIX?
const RADAR_IMAGE_SRC = "https://radar.weather.gov/ridge/standard/NORTHEAST_loop.gif"
const FORECAST_URL = "https://api.weather.gov/gridpoints/PHI/50,85/forecast"
const HOURLY_FORECAST_URL = "https://api.weather.gov/gridpoints/PHI/50,85/forecast/hourly"

const TIMEZONE = "America/New_York"

// Keep radar image updated
const radarImage = document.querySelector("#radar-image");
radarImage.src = RADAR_IMAGE_SRC;
function updateRadarImage() {
  radarImage.src = RADAR_IMAGE_SRC + "?" + new Date().getTime();
}
updateRadarImage();

function renderForecastDetails(forecast) {
  return `
    <img class="details__section-icon" src="${forecast.icon}" />
    <div class="details__section-info">
      <p>
        <span><b>${forecast.name}</b></span>
        <span> | </span>
        <span>
          🌡 ${forecast.temperature}${forecast.temperatureUnit} 
        </span>
        <span>
          (🧖‍♀️ ${forecast.relativeHumidity.value ?? 0}%)
        </span>
        <span>
          🌧 ${(forecast.probabilityOfPrecipitation.value ?? 0)}%
        </span>
      </p>
      <p>${forecast.detailedForecast}</p>
    </div>
  `
}

// Fetch and render forecast information
const currentForecastSection = document.querySelector("#current-forecast");
const nextForecastSection = document.querySelector("#next-forecast");
async function getForecast() {
  const response = await fetch(FORECAST_URL);
  if (!response.ok) {
    const responseText = await response.text();
    console.error(`Failed to get forecast, ${responseText}`);
    currentForecastSection.innerHTML = `
      <p>Could not fetch forecast information: ${responseText}</p>
    `;
    nextForecastSection.innerHTML = "";
    return;
  }

  const responseJson = await response.json();
  const [currentForecast, nextForecast] = responseJson.properties.periods;

  currentForecastSection.innerHTML = renderForecastDetails(currentForecast);
  nextForecastSection.innerHTML = renderForecastDetails(nextForecast);
}
getForecast();

function renderHourlyForecast(forecast) {
  /*
        Icon
        Short description
  */
  const startTime = forecast.startTime;
  return `
    <div class="hourly__section">
      <p>
        <span>${formatInTimeZone(startTime, TIMEZONE, "MM/dd")}</span>
        <span>${formatInTimeZone(startTime, TIMEZONE, "haaa")}</span>
      </p>
      <p class="hourly__section-temperature">
        <span>
          🌡 ${forecast.temperature}${forecast.temperatureUnit} 
        </span>
        <span>
          (🧖‍♀️ ${forecast.relativeHumidity.value ?? 0}%)
        </span>
      </p>
      <p>
        🌧 ${(forecast.probabilityOfPrecipitation.value ?? 0)}%
      </p>
      <p>${forecast.shortForecast}</p>
    </div>
  `;
}

// Fetch and render hourly forecast information
const hourlyForecasts = document.querySelector("#hourly");
async function getHourlyForecast() {
  const response = await fetch(HOURLY_FORECAST_URL);
  if (!response.ok) {
    const responseText = await response.text();
    console.error(`Failed to get hourly forecast, ${responseText}`);
    hourlyForecasts.innerHTML = `
      <p>Could not fetch hourly forecast information: ${responseText}</p>
    `;
    return;
  }

  const responseJson = await response.json();
  const forecasts = responseJson.properties.periods.slice(0, 8);

  hourlyForecasts.innerHTML = forecasts.map(renderHourlyForecast).join("");
}
getHourlyForecast();

// Render current datetime
const timeElement = document.querySelector("#time");
function updateTime() {
  const now = new Date();
  timeElement.innerText = formatInTimeZone(now, TIMEZONE, "MM/dd/yyyy hh:mm:ss");
}
updateTime();

setInterval(() => {
  updateTime();
}, 1 * SECOND);


// Keep data fresh
setInterval(() => {
  updateRadarImage();
  getForecast();
  getHourlyForecast();
}, 5 * MINUTE);

