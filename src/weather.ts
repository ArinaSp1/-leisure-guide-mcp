import type { WeatherSnapshot } from "./types.js";

interface GeocodingResponse {
  results?: Array<{ name: string; latitude: number; longitude: number }>;
}

interface ForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    precipitation_probability: number[];
  };
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: { "user-agent": "Leisure-Guide-MCP/0.7" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  return (await response.json()) as T;
}

interface WttrResponse {
  nearest_area?: Array<{ areaName?: Array<{ value: string }>; latitude?: string; longitude?: string }>;
  current_condition?: Array<{
    temp_C: string; FeelsLikeC: string; precipMM: string; weatherCode: string;
    windspeedKmph: string; localObsDateTime?: string;
  }>;
  weather?: Array<{ hourly?: Array<{ chanceofrain?: string }> }>;
}

function wttrToWmo(code: number): number {
  if (code === 113) return 0;
  if (code === 116) return 2;
  if ([119, 122].includes(code)) return 3;
  if ([143, 248, 260].includes(code)) return 45;
  if ([179, 182, 185, 227, 230, 281, 284, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(code)) return 71;
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(code)) return 61;
  if ([200, 386, 389, 392, 395].includes(code)) return 95;
  return 3;
}

async function getWttrWeather(city: string): Promise<WeatherSnapshot> {
  const url = new URL(`https://wttr.in/${encodeURIComponent(city)}`);
  url.searchParams.set("format", "j1");
  const data = await fetchJson<WttrResponse>(url);
  const current = data.current_condition?.[0];
  if (!current) throw new Error(`Could not retrieve weather for ${city}`);
  const area = data.nearest_area?.[0];
  const rain = data.weather?.[0]?.hourly?.slice(0, 3).map((hour) => Number(hour.chanceofrain ?? 0)) ?? [0];
  return {
    city: area?.areaName?.[0]?.value || city,
    latitude: Number(area?.latitude ?? 0),
    longitude: Number(area?.longitude ?? 0),
    temperatureC: Number(current.temp_C),
    apparentTemperatureC: Number(current.FeelsLikeC),
    precipitationMm: Number(current.precipMM),
    precipitationProbability: Math.max(0, ...rain),
    windKph: Number(current.windspeedKmph),
    weatherCode: wttrToWmo(Number(current.weatherCode)),
    observedAt: current.localObsDateTime || new Date().toISOString(),
  };
}

export async function getWeather(
  city: string,
  countryCode?: string,
): Promise<WeatherSnapshot> {
  try {
  const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodingUrl.searchParams.set("name", city);
  geocodingUrl.searchParams.set("count", "1");
  geocodingUrl.searchParams.set("language", "en");
  if (countryCode) geocodingUrl.searchParams.set("countryCode", countryCode);

  const geocoding = await fetchJson<GeocodingResponse>(geocodingUrl);
  const place = geocoding.results?.[0];
  if (!place) throw new Error(`Could not find a location named ${city}`);

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(place.latitude));
  forecastUrl.searchParams.set("longitude", String(place.longitude));
  forecastUrl.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
  );
  forecastUrl.searchParams.set("hourly", "precipitation_probability");
  forecastUrl.searchParams.set("forecast_days", "1");
  forecastUrl.searchParams.set("timezone", "auto");

  const forecast = await fetchJson<ForecastResponse>(forecastUrl);
  const currentHour = forecast.current.time.slice(0, 13);
  const currentIndex = forecast.hourly.time.findIndex((time) => time.startsWith(currentHour));
  const upcomingProbabilities = forecast.hourly.precipitation_probability.slice(
    Math.max(0, currentIndex),
    Math.max(0, currentIndex) + 6,
  );

  return {
    city: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    temperatureC: forecast.current.temperature_2m,
    apparentTemperatureC: forecast.current.apparent_temperature,
    precipitationMm: forecast.current.precipitation,
    precipitationProbability: Math.max(0, ...upcomingProbabilities),
    windKph: forecast.current.wind_speed_10m,
    weatherCode: forecast.current.weather_code,
    observedAt: forecast.current.time,
  };
  } catch {
    return getWttrWeather(city);
  }
}
