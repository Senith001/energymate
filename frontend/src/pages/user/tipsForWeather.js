/**
 * Generates an energy-saving recommendation based on current weather data.
 * @param {Object} weather - The weather object containing temperature and description.
 * @returns {string} - A helpful energy-saving tip.
 */
export function getWeatherRecommendation(weather) {
  if (!weather || weather.temperature == null) {
    return "Weather information is loading...";
  }

  const { temperature, description } = weather;
  const condition = (description || "").toLowerCase();

  // Rule 1: Rain/Precipitation recommendation (User requested: -off the fan)
  if (
    condition.includes("rain") ||
    condition.includes("drizzle") ||
    condition.includes("storm") ||
    condition.includes("thunderstorm")
  ) {
    return "It's rainy today! You can switch off fans or cooling systems to save energy and enjoy the natural breeze.";
  }

  // Rule 2: Heat thresholds (User requested: temp > 24 -- switch fans)
  if (temperature > 30) {
    return "High temperatures detected. It's best to keep windows closed and use fans to circulate air, reducing the need for heavy AC usage.";
  }

  if (temperature > 24) {
    return "It's a bit warm today (above 24°C). Consider switching on fans instead of AC to save energy, or keep them at a moderate speed.";
  }

  // Rule 3: Comfortable/Moderate
  if (temperature > 20) {
    return "The weather is moderate and pleasant. Perfect time to rely on natural ventilation instead of power-hungry devices.";
  }

  // Fallback
  return "Enjoy the cool environment! You can minimize appliance usage to help maintain your energy-saving goals.";
}

/**
 * Maps OpenWeather description to a friendly weather icon/emoji.
 * @param {string} description 
 * @returns {string} emoji
 */
export function getWeatherIconEmoji(description) {
  const cond = (description || "").toLowerCase();
  if (cond.includes("sun") || cond.includes("clear")) return "☀️";
  if (cond.includes("rain") || cond.includes("drizzle")) return "🌧️";
  if (cond.includes("cloud")) return "☁️";
  if (cond.includes("storm") || cond.includes("thunder")) return "⛈️";
  if (cond.includes("snow")) return "❄️";
  if (cond.includes("mist") || cond.includes("fog")) return "🌫️";
  return "🌤️";
}