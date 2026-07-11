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
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  return (await response.json()) as T;
}

export async function getWeather(
  city: string,
  countryCode?: string,
): Promise<WeatherSnapshot> {
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
}
