import { formatInTimeZone, toDate } from "date-fns-tz";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// const RADAR_IMAGE_SRC = "https://radar.weather.gov/ridge/standard/NORTHEAST_loop.gif"
// const RADAR_IMAGE_SRC = "https://radar.weather.gov/ridge/standard/KDIX_loop.gif"
const RADAR_IMAGE_SRC = "https://s.w-x.co/staticmaps/wu/wu/wxtype1200_cur/usbgm/animate.png"
const FORECAST_URL = "https://api.weather.gov/gridpoints/PHI/50,85/forecast"
const HOURLY_FORECAST_URL = "https://api.weather.gov/gridpoints/PHI/50,85/forecast/hourly"
const TIMEZONE = "America/New_York"
const TIME_URL = `http://worldtimeapi.org/api/timezone/${TIMEZONE}`;

// Use TIME_URL to query for time on first load, sometimes time sync
// takes a while on startup and local new Date is incorrect.
let useBrowserTime = true;

// Keep radar image updated
const radarImage = document.querySelector("#radar-image");
function updateRadarImage() {
  radarImage.src = RADAR_IMAGE_SRC + "?" + new Date().getTime();
}

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
          🌧 ${(forecast?.probabilityOfPrecipitation?.value ?? 0)}%
        </span>
      </p>
      <p class="details__section-info-forecast">${forecast.detailedForecast}</p>
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

function renderHourlyForecast(forecast) {
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
  const forecasts = responseJson.properties.periods.slice(0, 6);

  hourlyForecasts.innerHTML = forecasts.map(renderHourlyForecast).join("");
}

// Render current datetime
const timeElement = document.querySelector("#time");
async function updateTime() {
  const now = await getNow();
  timeElement.innerText = formatInTimeZone(now, TIMEZONE, "MM/dd/yyyy hh:mmaaa");
}

// Render current datetime from API on initial load
async function getNow() {
  if (useBrowserTime) {
    console.log("[MYLOG] Getting browser time");
    return new Date();
  }

  console.log("[MYLOG] Getting API time");
  
  const response = await fetch(TIME_URL);
  if (!response.ok) {
    const responseText = await response.text();
    console.warn(`Failed to get time from API, falling back to browser time: ${responseText}`);
    return new Date();
  }

  const responseJson = await response.json();
  return toDate(responseJson.datetime);
}

// Render timestamp of when data was last fetched
const lastUpdatedElement = document.querySelector("#last-updated");
async function updateUpdatedTime() {
  const now = await getNow();
  lastUpdatedElement.innerText = "updated: " + formatInTimeZone(now, TIMEZONE, "hh:mmaaa");
}

// Wrapper around setInterval that also calls the function immediately before
// setting the interval
function setIntervalImmediate(func, delay) {
  func();
  setInterval(func, delay);
}

// Keep data fresh
window.onload = () => {
  setTimeout(() => {
    setIntervalImmediate(() => {
      updateRadarImage();
      getForecast();
      getHourlyForecast();
      updateUpdatedTime();
    }, 5 * MINUTE);

    setIntervalImmediate(() => {
      updateTime();
    }, 30 * SECOND);
  }, 1 * SECOND);

  setTimeout(() => {
    useBrowserTime = true;
  }, 60 * SECOND);
};
