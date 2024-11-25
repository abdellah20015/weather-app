import React, { useState, useEffect } from "react";
import {
  Search,
  Wind,
  Droplets,
  MapPin,
  Loader2,
  Sun,
  Moon,
  Star,
  Bell,
  Eye,
  Gauge,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png"; // Icône par défaut
import shadowUrl from "leaflet/dist/images/marker-shadow.png"; // Ombre

const customIcon = new L.Icon({
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41], // Taille de l'icône
  iconAnchor: [12, 41], // Point d'ancrage
  popupAnchor: [1, -34], // Position de la popup
  shadowSize: [41, 41], // Taille de l'ombre
});

const API_KEY = "7cf5b8f5fe48225594145665abe4bebd";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const WeatherApp = () => {
  const [theme, setTheme] = useState("dark");
  const [city, setCity] = useState("Rabat");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favoritesCities");
    return saved ? JSON.parse(saved) : [];
  });
  const [alerts, setAlerts] = useState([]);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  // Theme handling
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Geolocation
  useEffect(() => {
    if (showLocationPrompt && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `${BASE_URL}/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=${API_KEY}`
            );
            const data = await response.json();
            setCity(data.name);
            fetchWeather(data.name);
            fetchForecast(data.name);
          } catch (err) {
            console.error("Error getting location weather:", err);
          }
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, [showLocationPrompt]);

  // Favorites persistence
  useEffect(() => {
    localStorage.setItem("favoritesCities", JSON.stringify(favorites));
  }, [favorites]);

  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BASE_URL}/weather?q=${cityName}&units=metric&appid=${API_KEY}`
      );
      if (!response.ok) throw new Error("City not found");
      const data = await response.json();
      setWeather(data);

      // Fetch alerts
      const alertsResponse = await fetch(
        `${BASE_URL}/onecall?lat=${data.coord.lat}&lon=${data.coord.lon}&exclude=current,minutely,hourly,daily&appid=${API_KEY}`
      );
      const alertsData = await alertsResponse.json();
      if (alertsData.alerts) {
        setAlerts(alertsData.alerts);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (cityName) => {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast?q=${cityName}&units=metric&appid=${API_KEY}`
      );
      if (!response.ok) throw new Error("Forecast not available");
      const data = await response.json();
      const processedData = data.list
        .filter((item, index) => index % 8 === 0)
        .map((item) => ({
          date: new Date(item.dt * 1000).toLocaleDateString(),
          temp: Math.round(item.main.temp),
        }));
      setForecast(processedData);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = (cityName) => {
    setFavorites((prev) =>
      prev.includes(cityName)
        ? prev.filter((c) => c !== cityName)
        : [...prev, cityName]
    );
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-blue-100 to-white"
      } p-4`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Theme Toggle and Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="p-2 rounded-full hover:bg-gray-700/30 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="text-yellow-400" />
            ) : (
              <Moon className="text-gray-600" />
            )}
          </button>

          <div className="flex gap-4">
            {favorites.length > 0 && (
              <div className="flex gap-2">
                {favorites.map((favCity) => (
                  <button
                    key={favCity}
                    onClick={() => {
                      setCity(favCity);
                      fetchWeather(favCity);
                      fetchForecast(favCity);
                    }}
                    className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    {favCity}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (city.trim()) {
              fetchWeather(city);
              fetchForecast(city);
            }
          }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-gray-700/30 text-white rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Search city..."
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-white" size={40} />
          </div>
        ) : error ? (
          <div className="bg-red-500/20 text-red-200 p-4 rounded-lg text-center max-w-md mx-auto">
            {error}
          </div>
        ) : weather ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weather Card */}
            <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-lg p-6 text-white shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">{weather.name}</h1>
                    <button
                      onClick={() => toggleFavorite(weather.name)}
                      className="p-1 rounded-full hover:bg-gray-700/30 transition-colors"
                    >
                      <Star
                        className={`${
                          favorites.includes(weather.name)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        } transition-colors`}
                        size={20}
                      />
                    </button>
                  </div>
                  <div className="flex items-center text-gray-400 mt-1">
                    <MapPin size={16} className="mr-1" />
                    <span className="mr-2">{weather.sys.country}</span>
                    <img
                      src={`https://flagcdn.com/24x18/${weather.sys.country.toLowerCase()}.png`}
                      alt={`${weather.sys.country} flag`}
                      className="h-4"
                    />
                  </div>
                </div>
                <img
                  src={`https://openweathermap.org/img/w/${weather.weather[0].icon}.png`}
                  alt="weather icon"
                  className="w-16 h-16"
                />
              </div>

              <div className="mb-8">
                <div className="text-6xl font-bold">
                  {Math.round(weather.main.temp)}°C
                </div>
                <div className="text-gray-400 mt-1">
                  {weather.weather[0].description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center bg-gray-700/30 rounded-lg p-4 transition-all duration-300 hover:bg-gray-700/40">
                  <Wind className="text-blue-400 mr-2" />
                  <div>
                    <div className="text-gray-400 text-sm">Wind Speed</div>
                    <div className="font-semibold">
                      {weather.wind.speed} m/s
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-gray-700/30 rounded-lg p-4 transition-all duration-300 hover:bg-gray-700/40">
                  <Droplets className="text-blue-400 mr-2" />
                  <div>
                    <div className="text-gray-400 text-sm">Humidity</div>
                    <div className="font-semibold">
                      {weather.main.humidity}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-gray-700/30 rounded-lg p-4 transition-all duration-300 hover:bg-gray-700/40">
                  <Gauge className="text-blue-400 mr-2" />
                  <div>
                    <div className="text-gray-400 text-sm">Pressure</div>
                    <div className="font-semibold">
                      {weather.main.pressure} hPa
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-gray-700/30 rounded-lg p-4 transition-all duration-300 hover:bg-gray-700/40">
                  <Eye className="text-blue-400 mr-2" />
                  <div>
                    <div className="text-gray-400 text-sm">Visibility</div>
                    <div className="font-semibold">
                      {(weather.visibility / 1000).toFixed(1)} km
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Map */}
            <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-lg p-6 shadow-lg h-[400px] transition-all duration-300">
              <MapContainer
                center={[weather.coord.lat, weather.coord.lon]}
                zoom={10}
                className="h-full w-full rounded-lg"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                  position={[weather.coord.lat, weather.coord.lon]}
                  icon={customIcon}
                >
                  <Popup>
                    {weather.name}, {weather.sys.country}
                    <br />
                    {Math.round(weather.main.temp)}°C
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            {/* Temperature Chart */}
            {forecast && (
              <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-lg p-6 shadow-lg lg:col-span-2 transition-all duration-300">
                <h2 className="text-white text-xl font-semibold mb-4">
                  5-Day Forecast
                </h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecast}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                        unit="°C"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            theme === "dark" ? "#1F2937" : "#FFFFFF",
                          border: "none",
                          borderRadius: "0.5rem",
                          color: theme === "dark" ? "#FFFFFF" : "#1F2937",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="temp"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: "#3B82F6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )};
            {/* Weather Widgets Section */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Daily Overview Widget */}
              <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-xl p-6 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Daily Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Feels Like</span>
                    <span className="font-medium">
                      {Math.round(weather.main.feels_like)}°C
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Min Temp</span>
                    <span className="font-medium">
                      {Math.round(weather.main.temp_min)}°C
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Max Temp</span>
                    <span className="font-medium">
                      {Math.round(weather.main.temp_max)}°C
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Sunrise</span>
                    <span className="font-medium">
                      {new Date(weather.sys.sunrise * 1000).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Sunset</span>
                    <span className="font-medium">
                      {new Date(weather.sys.sunset * 1000).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wind Details Widget */}
              <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-xl p-6 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Wind Details
                </h3>
                <div className="space-y-4">
                  <div className="relative h-32 w-32 mx-auto">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="h-24 w-24 border-4 border-blue-500/30 rounded-full flex items-center justify-center"
                        style={{ transform: `rotate(${weather.wind.deg}deg)` }}
                      >
                        <Wind
                          className="text-blue-400 transform -rotate-45"
                          size={32}
                        />
                      </div>
                      <div className="absolute text-sm text-gray-400">
                        {weather.wind.speed} m/s
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Direction</span>
                      <span className="font-medium">{weather.wind.deg}°</span>
                    </div>
                    {weather.wind.gust && (
                      <div className="flex justify-between items-center text-gray-300">
                        <span>Gusts</span>
                        <span className="font-medium">
                          {weather.wind.gust} m/s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Air Quality Widget */}
              <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-xl p-6 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Atmospheric Conditions
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-gray-300">Clouds</div>
                    <div className="font-medium text-white">
                      {weather.clouds.all}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-gray-300">Pressure</div>
                    <div className="font-medium text-white">
                      {weather.main.pressure} hPa
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-gray-300">Humidity</div>
                    <div className="font-medium text-white">
                      {weather.main.humidity}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-gray-300">Visibility</div>
                    <div className="font-medium text-white">
                      {(weather.visibility / 1000).toFixed(1)} km
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Settings Panel (can be toggled) */}
        <div className="fixed bottom-4 right-4 space-y-2">
          <button
            onClick={() => setShowLocationPrompt(true)}
            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-colors"
            title="Use my location"
          >
            <MapPin className="text-white" size={20} />
          </button>
          {alerts.length > 0 && (
            <button
              className="p-2 bg-red-500 hover:bg-red-600 rounded-full shadow-lg transition-colors"
              title="Weather Alerts"
            >
              <Bell className="text-white" size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom hook for persistent storage

export default WeatherApp;
