const form = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city-input");
const searchButton = form.querySelector("button[type='submit']");
const statusMessage = document.querySelector("#status");
const weatherSection = document.querySelector("#weather-section");
const forecastList = document.querySelector("#forecast-list");
const unitButtons = document.querySelectorAll(".unit-button");
let weatherData = null;
let unit = "c";

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    cityInput.focus();
    showStatus("Lütfen bir şehir adı gir.", "error");
    return;
  }

  setLoading(true);
  showStatus(`${city} için hava durumu getiriliyor…`, "loading");
  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error("Uygulama sunucusu bulunamadı. Proje klasöründe `npm start` çalıştırıp http://localhost:3000 adresini aç.");
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Hava durumu alınamadı. Lütfen tekrar dene.");
    weatherData = result;
    renderWeather();
    weatherSection.hidden = false;
    showStatus("");
  } catch (error) {
    weatherSection.hidden = true;
    const message = error instanceof TypeError
      ? "Sunucuya bağlanılamadı. Proje klasöründe `npm start` çalıştırıp http://localhost:3000 adresini aç."
      : error.message;
    showStatus(message || "Bağlantı kurulamadı. İnternet bağlantını kontrol et.", "error");
  } finally {
    setLoading(false);
  }
});

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    unit = button.dataset.unit;
    unitButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    if (weatherData) renderWeather();
  });
});

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.querySelector("span:first-child").textContent = isLoading ? "Ara…" : "Ara";
  form.setAttribute("aria-busy", String(isLoading));
}

function showStatus(message, state = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status${state ? ` is-${state}` : ""}`;
}

function formatTemperature(celsius, fahrenheit) {
  return `${Math.round(unit === "c" ? celsius : fahrenheit)}°${unit.toUpperCase()}`;
}

function iconFor(code, isDay = 1) {
  if ([1000].includes(code)) return isDay ? "☀️" : "🌙";
  if ([1003].includes(code)) return isDay ? "🌤️" : "☁️";
  if ([1006, 1009].includes(code)) return "☁️";
  if ([1030, 1135, 1147].includes(code)) return "🌫️";
  if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return "🌧️";
  if ([1066, 1069, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return "❄️";
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return "⛈️";
  return "🌡️";
}

function dateFromApi(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function renderWeather() {
  const { location, current, forecast } = weatherData;
  document.querySelector("#city-name").textContent = `${location.name}, ${location.country}`;
  document.querySelector("#current-date").textContent = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(dateFromApi(forecast.forecastday[0].date));
  document.querySelector("#temperature").textContent = formatTemperature(current.temp_c, current.temp_f);
  document.querySelector("#condition").textContent = current.condition.text;
  document.querySelector("#current-icon").textContent = iconFor(current.condition.code, current.is_day);
  document.querySelector("#humidity").textContent = `${current.humidity}%`;
  document.querySelector("#wind").textContent = `${Math.round(current.wind_kph)} km/sa`;
  document.querySelector("#feels-like").textContent = formatTemperature(current.feelslike_c, current.feelslike_f);

  forecastList.replaceChildren(...forecast.forecastday.map(renderForecastDay));
}

function renderForecastDay(day, index) {
  const date = dateFromApi(day.date);
  const label = index === 0 ? "Bugün" : new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date);
  const article = document.createElement("article");
  article.className = "forecast-day";

  const name = document.createElement("p");
  name.className = "forecast-name";
  name.textContent = label;
  const icon = document.createElement("span");
  icon.className = "forecast-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = iconFor(day.day.condition.code);
  const condition = document.createElement("p");
  condition.className = "forecast-condition";
  condition.textContent = day.day.condition.text;
  const temperatures = document.createElement("p");
  temperatures.className = "forecast-temperatures";
  const high = document.createElement("span");
  high.textContent = formatTemperature(day.day.maxtemp_c, day.day.maxtemp_f);
  const low = document.createElement("span");
  low.className = "forecast-low";
  low.textContent = formatTemperature(day.day.mintemp_c, day.day.mintemp_f);
  temperatures.append(high, low);
  article.append(name, icon, condition, temperatures);
  return article;
}
