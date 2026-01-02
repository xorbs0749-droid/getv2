import axios from "axios";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  main: string; // Clear, Clouds, Rain, Snow, etc.
  description: string;
  temp: number;
  humidity: number;
  windSpeed: number;
}

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OpenWeatherMap API key not configured");
  }

  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: "metric",
        lang: "kr",
      },
    });

    const data = response.data;
    
    return {
      main: data.weather[0]?.main || "Clear",
      description: data.weather[0]?.description || "",
      temp: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    };
  } catch (error) {
    console.error("Weather API error:", error);
    throw new Error("Failed to fetch weather data");
  }
}

export function getWeatherCategory(weatherMain: string): string {
  const weatherMap: Record<string, string> = {
    Clear: "sunny",
    Clouds: "cloudy",
    Rain: "rainy",
    Drizzle: "rainy",
    Snow: "snowy",
    Thunderstorm: "rainy",
    Mist: "cloudy",
    Fog: "cloudy",
    Haze: "cloudy",
  };

  return weatherMap[weatherMain] || "sunny";
}
