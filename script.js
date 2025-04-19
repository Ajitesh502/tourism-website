// 🌟 Replace with your actual API keys
const UNSPLASH_API_KEY = "ittgASysrzFD10YR_3m1neYw6qkPoA6sSKp016-jcPw";
const WEATHER_API_KEY = "158a21c247588093eea5647fdeff3f29";

// 🔹 Get search query from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ✅ Run when page loads
document.addEventListener("DOMContentLoaded", async function () {
    const location = getQueryParam("location");
    if (!location) return console.error("❌ No location provided in URL!");
    
    console.log("🔎 Location Searched:", location);
    fetchWeather(location);
    fetchImages("Modern", location);
    fetchImages("Historical", location);
    await fetchHotels(location); // Ensure hotels are fetched before categorizing
});

// 🔹 Convert Location Name to Coordinates (Using Nominatim API)
async function getCoordinates(location) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.length > 0 ? { lat: data[0].lat, lon: data[0].lon } : null;
    } catch (error) {
        console.error("❌ Error getting coordinates:", error);
        return null;
    }
}

// 🔹 Fetch & Display Images (Modern & Historical Places)
function fetchImages(category, location) {
    const url = `https://api.unsplash.com/search/photos?query=${category}%20${location}&client_id=${UNSPLASH_API_KEY}&per_page=5&orientation=landscape&content_filter=high`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById(category.toLowerCase() + "-places");
            if (!container) return;
            let imagesHTML = `<h2>${category} Places</h2><div class='image-container'>`;
            if (data.results.length === 0) imagesHTML += `<p>No relevant images found.</p>`;
            else data.results.forEach(image => {
                imagesHTML += `<img src="${image.urls.small}" alt="${category} in ${location}" class="result-image">`;
            });
            imagesHTML += "</div>";
            container.innerHTML = imagesHTML;
        })
        .catch(error => console.error(`❌ Error fetching ${category} images:`, error));
}

// 🔹 Fetch & Display Weather
function fetchWeather(location) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${WEATHER_API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.cod !== 200) return console.error("❌ Weather fetch error:", data.message);
            document.getElementById("weather-container").innerHTML = `
                <h2>Weather Forecast</h2>
                <img src="https://openweathermap.org/img/w/${data.weather[0].icon}.png" alt="Weather Icon">
                <p>${data.weather[0].description}</p>
                <p class="weather-temp">${data.main.temp}°C</p>`;
        })
        .catch(error => console.error("❌ Error fetching weather data:", error));
}

// 🔹 Fetch & Display Hotels, Categorizing Luxury & Budget
async function fetchHotels(location) {
    const coords = await getCoordinates(location);
    if (!coords) return;
    const overpassQuery = `[out:json];node["tourism"="hotel"](around:5000, ${coords.lat}, ${coords.lon});out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const luxuryContainer = document.getElementById("luxury-hotels");
            const budgetContainer = document.getElementById("budget-hotels");
            let luxuryHTML = "<h2>Luxury Hotels</h2><div class='hotel-container'>";
            let budgetHTML = "<h2>Budget Hotels</h2><div class='hotel-container'>";
            if (data.elements.length === 0) {
                luxuryHTML += "<p>No luxury hotels found.</p>";
                budgetHTML += "<p>No budget hotels found.</p>";
            } else {
                data.elements.forEach(hotel => {
                    const hotelName = hotel.tags.name || "Unnamed Hotel";
                    const imageUrl = "https://via.placeholder.com/200";
                    const price = hotel.tags.stars ? "Luxury" : "Budget";
                    const hotelHTML = `
                        <div class="hotel-box">
                            <img src="${imageUrl}" alt="${hotelName}" width="200">
                            <h3>${hotelName}</h3>
                            <p>Latitude: ${hotel.lat}, Longitude: ${hotel.lon}</p>
                        </div>`;
                    if (price === "Luxury") luxuryHTML += hotelHTML;
                    else budgetHTML += hotelHTML;
                });
            }
            luxuryHTML += "</div>";
            budgetHTML += "</div>";
            luxuryContainer.innerHTML = luxuryHTML;
            budgetContainer.innerHTML = budgetHTML;
        })
        .catch(error => console.error("❌ Error fetching hotels:", error));
}

// 🔹 Search Button Click Event
document.getElementById("search-button").addEventListener("click", function () {
    const location = document.getElementById("search-box").value.trim();
    if (location) window.location.href = `search-result.html?location=${encodeURIComponent(location)}`;
    else alert("⚠️ Please enter a location!");
});
