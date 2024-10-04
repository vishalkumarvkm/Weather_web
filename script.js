// Get references to the HTML elements
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const recentCitiesDropdown = document.getElementById("recent-cities-dropdown");

// OpenWeather API key
const API_KEY = "e03eb8f5f8b7053d8b141af9037ac94e"; // Replace with your actual API key

// Function to create a weather card (current weather and forecast)
const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
        return `<div class="details text-white">
                    <h2 class="text-2xl">${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h4>Temperature: ${weatherItem.main.temp.toFixed(2)}°C</h4>
                    <h4>Wind: ${weatherItem.wind.speed} m/s</h4>
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h4>${weatherItem.weather[0].description}</h4>
                </div>`;
    } else {
        return `<li class="card bg-gray-800 text-white p-4 rounded">
                    <h3>${weatherItem.dt_txt.split(" ")[0]}</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
                    <h4>Temp: ${weatherItem.main.temp.toFixed(2)}°C</h4>
                    <h4>Wind: ${weatherItem.wind.speed} m/s</h4>
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                </li>`;
    }
};

// Function to get weather details for a city using its coordinates
const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            const uniqueForecastData = [];
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastData = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastData.includes(forecastData)) {
                    uniqueForecastData.push(forecastData);
                    return true;
                }
                return false;
            });

            // Clear previous data
            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";

            // Display current weather and 5-day forecast
            fiveDaysForecast.forEach((weatherItem, index) => {
                if (index === 0) {
                    currentWeatherDiv.innerHTML = createWeatherCard(cityName, weatherItem, index);
                    addRecentCity(cityName); // Add to recent searches
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                }
            });
        })
        .catch(() => {
            alert("An error occurred while fetching the weather forecast!");
        });
};

// Function to get city coordinates based on the city name
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${cityName}`);
            const { name, lat, lon } = data[0];
            getWeatherDetails(name, lat, lon);
        })
        .catch(() => {
            alert("An error occurred while fetching the coordinates!");
        });
};

// Function to get user's current coordinates based on their geolocation
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(REVERSE_GEOCODING_URL)
                .then(res => res.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(() => {
                    alert("An error occurred while fetching the city!");
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access.");
            }
        }
    );
};

// Add recently searched city to dropdown and localStorage
const addRecentCity = (cityName) => {
    let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];
    if (!recentCities.includes(cityName)) {
        recentCities.push(cityName);
        localStorage.setItem("recentCities", JSON.stringify(recentCities));
        updateRecentCitiesDropdown(recentCities);
    }
};

// Update the dropdown options
const updateRecentCitiesDropdown = (cities) => {
    recentCitiesDropdown.innerHTML = "<option value='' disabled selected>Select a recently searched city</option>"; // Reset
    cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        recentCitiesDropdown.appendChild(option);
    });
};

// Event listener for dropdown selection
recentCitiesDropdown.addEventListener("change", (event) => {
    const selectedCity = event.target.value;
    if (selectedCity) {
        getCityCoordinates(); // Call the function to fetch weather for selected city
    }
});

// Event listener for location button
locationButton.addEventListener("click", getUserCoordinates);

// Event listener for search button
searchButton.addEventListener("click", getCityCoordinates);

// Event listener for pressing Enter in the input field
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

// Load recent cities on page load
window.onload = () => {
    const recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];
    updateRecentCitiesDropdown(recentCities);
};
