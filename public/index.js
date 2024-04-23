const SECOND = 1000;
const MINUTE = 60 * SECOND;

const RADAR_IMAGE_SRC = "https://radar.weather.gov/ridge/standard/KDIX_loop.gif"
const SPINNER_SRC = "/img/spinner.gif"
const FORECAST_URL = "https://api.weather.gov/gridpoints/PHI/50,85/forecast"

// Keep radar image updated
const radarImage = document.querySelector("#radar-image");
radarImage.src = RADAR_IMAGE_SRC;
function updateRadarImage() {
  radarImage.src = SPINNER_SRC;
  radarImage.src = RADAR_IMAGE_SRC + "?" + new Date().getTime();
}
updateRadarImage();

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

  currentForecastSection.innerHTML = `
    <img src="${currentForecast.icon}" />
    <div>
      <b>${currentForecast.name}</b>
      <p>🌡 ${currentForecast.temperature}${currentForecast.temperatureUnit} <span>(🧖‍♀️ ${currentForecast.relativeHumidity.value ?? 0}%)</span></p>
      <p>🌧 ${(currentForecast.probabilityOfPrecipitation.value ?? 0)}%</p>
      <p>✏️  ${currentForecast.detailedForecast}</p>
    </div>
  `;

  nextForecastSection.innerHTML = `
    <img src="${nextForecast.icon}" />
    <div>
      <b>${nextForecast.name}</b>
      <p>🌡 ${nextForecast.temperature}${nextForecast.temperatureUnit} <span>(🧖‍♀️ ${nextForecast.relativeHumidity.value ?? 0}%)</span></p>
      <p>🌧 ${(nextForecast.probabilityOfPrecipitation.value ?? 0)}%</p>
      <p>✏️  ${nextForecast.detailedForecast}</p>
    </div>
  `;
}
getForecast();

// Render current datetime
const timeElement = document.querySelector("#time");
function updateTime() {
  const now = new Date();
  timeElement.innerText = now.toLocaleString();
}
updateTime();

setInterval(() => {
  updateTime();
}, 1 * SECOND);


// Keep data fresh
setInterval(() => {
  updateRadarImage();
  getForecast();
}, 5 * MINUTE);

