let map;
let cityMarkers;
let airportMarkers;
let cityMarkerIcon;
let airportMarkerIcon;
let highlightLayer;
let lastCountryData = null;
let lastCountryCode = null;
let userCountryCode = null;

// loading spinner
function showLoading() {
  document.getElementById("loading-overlay").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loading-overlay").style.display = "none";
}

// Fetch JSON helper
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Highlight country border
function highlightCountry(feature) {
  highlightLayer.clearLayers();
  highlightLayer.addData(feature);

  if (!map.hasLayer(highlightLayer)) {
    map.addLayer(highlightLayer);
  }

  highlightLayer.bringToFront(); 
}

// Load cities and airports
async function loadMarkers(code) {
  cityMarkers.clearLayers();
  airportMarkers.clearLayers();

  try {
    const cities = await fetchJSON(`php/getCities.php?code=${code}`);
    cities.forEach(city => {
      const marker = L.marker([city.lat, city.lng], { icon: cityMarkerIcon, pane: 'markerPane' })
        .bindPopup(`<b>City:</b> ${city.name}`);

      cityMarkers.addLayer(marker);
    });
  } catch (err) {
    // console.error("Error loading cities:", err);
  }

  try {
    const airports = await fetchJSON(`php/getAirports.php?code=${code}`);
    airports.forEach(airport => {
      const marker = L.marker([airport.lat, airport.lng], { icon: airportMarkerIcon, pane: 'markerPane' })
        .bindPopup(`<b>Airport:</b> ${airport.name}`);

      airportMarkers.addLayer(marker);
    });
  } catch (err) {
    // console.error("Error loading airports:", err);
  }
}

// Populate dropdown
async function populateDropdown() {
  const countries = await fetchJSON("php/getCountryList.php");
  const select = document.getElementById("country-select");

  countries.forEach((country) => {
    const opt = document.createElement("option");
    opt.value = country.iso3;
    opt.textContent = country.name;
    select.appendChild(opt);
  });
}

// Handle country selection
async function handleCountryChange(code) {
  showLoading();
  try {
    const feature = await fetchJSON(`php/getCountryBorders.php?code=${code}`);
    const data = await fetchJSON(`php/getCountryData.php?code=${code}`);
    lastCountryCode = code;
    lastCountryData = data;

    highlightCountry(feature);
    await loadMarkers(data.iso2);
    map.fitBounds(highlightLayer.getBounds(), { padding: [100, 100] });
    updateCountryModal(data);
    new bootstrap.Modal(document.getElementById('modalCountry')).show();
  } catch (err) {
    // console.error("Error loading country data:", err);
  } finally {
    hideLoading();
  }
}

// Init Map
async function init() {
  map = L.map("map").setView([20, 0], 2);

  // Create custom panes
  map.createPane('highlightPane');
  map.getPane('highlightPane').style.zIndex = 400;

  map.createPane('markerPane');
  map.getPane('markerPane').style.zIndex = 650;

  const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  });

  const satellite = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: "&copy; OpenTopoMap contributors"
  });

  streets.addTo(map);

  // country layer
  highlightLayer = L.geoJSON(null, {
    pane: 'highlightPane',
    style: {
      color: "#ff000033",
      weight: 2,
      fillColor: "#ff6666",
      fillOpacity: 0.3
    }
  }).addTo(map);

  // cluster groups
  cityMarkers = L.markerClusterGroup({
    pane: 'markerPane',
    iconCreateFunction: (cluster) =>{
      return L.divIcon({
        html: `<div class="cluster-icon city">${cluster.getChildCount()}</div>`,
        className: 'marker-cluster',
        iconSize: [30, 30]
      });
    }
  });
  airportMarkers = L.markerClusterGroup({
    pane: 'markerPane',
    iconCreateFunction: (cluster) => {
      return L.divIcon({
        html: `<div class="cluster-icon airport">${cluster.getChildCount()}</div>`,
        className: 'marker-cluster',
        iconSize: [30, 30]
      });
    }
  });

  map.addLayer(cityMarkers);
  map.addLayer(airportMarkers);

  const baseMaps = {
    "Streets": streets,
    "Satellite": satellite
  };

  const overlayMaps = {
    "Selected Country": highlightLayer,
    "Cities": cityMarkers,
    "Airports": airportMarkers
  };

  const layersControl = L.control.layers(baseMaps, overlayMaps);
  layersControl.addTo(map);

  // Move the default control into custom wrapper
  const controlContainer = document.querySelector('.leaflet-control-layers');
  document.getElementById('layer-control').appendChild(controlContainer);

  // Add event listener to toggle layer control
  document.getElementById('layer-toggle').addEventListener('click', () => {
    document.getElementById('layer-control').classList.toggle('collapsed');
  });

  cityMarkerIcon = L.ExtraMarkers.icon({
    icon: "fa-city",
    markerColor: "blue",
    shape: "circle",
    prefix: "fa",
    iconAnchor: [15, 30],
  });
  
  airportMarkerIcon = L.ExtraMarkers.icon({
    icon: "fa-plane",
    markerColor: "red",
    shape: "square",
    prefix: "fa",
    iconAnchor: [15, 30],
  });

  await populateDropdown();

  document.getElementById("country-select").addEventListener("change", (e) => {
    if (e.target.value) handleCountryChange(e.target.value);
  });

  // Easy Buttons

  // home button
  L.easyButton('fa-home', async () => {
    if (userCountryCode) {
      await handleCountryChange(userCountryCode);
    } else {
      const locationModal = new bootstrap.Modal(document.getElementById('locationModal'));
      locationModal.show();
    }
  }, 'Go to your country').addTo(map);

  // weather button
  L.easyButton('fa-cloud', async () => {
    const countryISO = document.getElementById("country-select").value;
    if (!countryISO) return;
    if (countryISO !== lastCountryCode) {
      lastCountryData = await fetchJSON(`php/getCountryData.php?code=${countryISO}`);
      lastCountryCode = countryISO;
    }
    updateWeatherModal(lastCountryData);
    new bootstrap.Modal(document.getElementById('modalWeather')).show();
  }, 'Weather').addTo(map);

  // currency button
  L.easyButton('fa-dollar-sign', async () => {
    const countryISO = document.getElementById("country-select").value;
    if (!countryISO) return;
    if (countryISO !== lastCountryCode) {
      lastCountryData = await fetchJSON(`php/getCountryData.php?code=${countryISO}`);
      lastCountryCode = countryISO;
    }
    updateCurrencyModal(lastCountryData);
    new bootstrap.Modal(document.getElementById('modalCurrency')).show();
  }, 'Currency').addTo(map);

  // news button
  L.easyButton('fa-newspaper', async () => {
    const countryISO = document.getElementById("country-select").value;
    if (!countryISO) return;
  
    const content = document.getElementById('news-content');
    content.innerHTML = '<p>Loading news articles...</p>';
    new bootstrap.Modal(document.getElementById('modalNews')).show();
  
    try {
      const news = await fetchJSON(`php/getNews.php?code=${countryISO}`);
      updateNewsModal(news);
    } catch (err) {
      content.innerHTML = '<p>Failed to load news articles.</p>';
      // console.error('News fetch error:', err);
    }
  }, 'News').addTo(map);


  // Wikipedia button
  L.easyButton('fa-book-open', async () => {
    const countryISO = document.getElementById("country-select").value;
    if (!countryISO) return;
  
    const content = document.getElementById('wikipedia-content');
    content.innerHTML = '<p>Loading Wikipedia article...</p>';
    new bootstrap.Modal(document.getElementById('modalWikipedia')).show();
  
    try {
      const data = await fetchJSON(`php/getCountryData.php?code=${countryISO}`);
      updateWikipediaModal(data);
    } catch (err) {
      content.innerHTML = '<p>Failed to load Wikipedia info.</p>';
      // console.error('Wikipedia fetch error:', err);
    }
  }, 'Wikipedia').addTo(map);

  // Holidays button
  L.easyButton('fa-calendar-alt', async () => {
    const countryISO = lastCountryData?.iso2;
    if (!countryISO) return;
  
    const content = document.getElementById('holidays-content');
    content.innerHTML = '<p>Loading public holidays...</p>';
    const holidaysModal = new bootstrap.Modal(document.getElementById('modalHolidays'));
    holidaysModal.show();
  
    try {
      const year = new Date().getFullYear();
      const holidays = await fetchJSON(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryISO}`);
      updateHolidayModal(holidays);
    } catch (err) {
      content.innerHTML = `<p>Failed to load holidays.</p>`;
      // console.error('Holiday API error:', err);
    }
  }, 'Public Holidays').addTo(map);

  // Auto-select user's country based on geolocation upon page load
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const result = await fetchJSON(`php/getCoordinates.php?lat=${lat}&lng=${lng}`);
          const iso = result.code;
          if (iso) {
            userCountryCode = iso;
            document.getElementById("country-select").value = iso;
            await handleCountryChange(iso);
          }
        } catch (err) {
          userCountryCode = null;
        } finally {
          hideLoading();
        }
      },
      (err) => {
        userCountryCode = null;
        const locationModal = new bootstrap.Modal(document.getElementById('locationModal'));
        locationModal.show();
        hideLoading();
      }
    );
  } else {
    userCountryCode = null;
    const locationModal = new bootstrap.Modal(document.getElementById('locationModal'));
    locationModal.show();
    hideLoading();
  }
}

init();

// Modal update functions

// weather modal
function updateWeatherModal(data) {
  const weatherContent = document.getElementById("weather-content");

  // Current weather
  if (!data.weather || data.weather.description === 'N/A') {
    weatherContent.innerHTML = "<p>Weather data not available.</p>";
    return;
  }

  // Format today's date using DateJS
  const now = new Date();
  const formattedDate = now.toString("dddd, d MMMM"); // e.g., "Tuesday, 11 March"

  // Update modal title
  const modalTitle = document.querySelector('#modalWeather .modal-title');
  modalTitle.textContent = `${data.capital}, ${data.name}`;

  // Render current weather
  weatherContent.innerHTML = `
    <div class="text-center mb-3">
      <p class="mb-1 text-muted">Today, ${formattedDate}</p>
      <p class="mb-1">${data.weather.description}, ${data.weather.temp}°C</p>
      <p class="text-muted small">Humidity: ${data.weather.humidity}% | Wind: ${data.weather.wind} m/s</p>
    </div>
  `;

  // Forecast (first 5 entries ≈ 15 hours ahead)
  if (data.forecast && data.forecast.length > 0) {
    const preview = data.forecast.slice(0, 5).map(item => {
      const time = new Date(item.time).toString("ddd HH:mm");
      const iconUrl = `https://openweathermap.org/img/wn/${item.icon}@2x.png`;
      return `
        <li class="d-flex align-items-center mb-2">
          <img src="${iconUrl}" alt="${item.description}" style="height: 55px; margin-right: 8px;">
          <span>${time}: ${item.temp}°C, ${item.description}</span>
        </li>
      `;
    }).join('');
  
    weatherContent.innerHTML += `
      <div class="text-start">
        <h6 class="mt-3">Forecast</h6>
        <ul class="list-unstyled small">
          ${preview}
        </ul>
      </div>
    `;
  }
}

// currency modal
function updateCurrencyModal(data) {
  const currencyContent = document.getElementById("currency-content");

  if (!data.currency || !data.exchangeRates || Object.keys(data.exchangeRates).length === 0) {
    currencyContent.innerHTML = "<p>Currency data not available.</p>";
    return;
  }

  const availableCurrencies = Object.keys(data.exchangeRates).sort();

  currencyContent.innerHTML = `
    <div class="text-center mb-3">
     <p><strong>Base Currency:</strong> ${data.currencyNames?.[data.currency] || data.currency} (${data.currency})</p>
    </div>
    <form id="currency-form">
      <div class="form-group">
        <label for="amount">Amount in ${data.currency}:</label>
        <input type="number" class="form-control" id="amount" placeholder="Enter amount" required>
      </div>

      <div class="form-group mt-3">
        <label for="target-currency">Convert to:</label>
        <select class="form-control" id="target-currency">
          ${availableCurrencies.map(cur => {
            const name = data.currencyNames?.[cur] || cur;
            return `<option value="${cur}">${cur} - ${name}</option>`;
          }).join('')}
        </select>
      </div>

      <div id="conversion-result" class="text-center mt-3 fw-bold"></div>
    </form>
  `;

  const amountInput = document.getElementById("amount");
  const targetCurrency = document.getElementById("target-currency");
  const result = document.getElementById("conversion-result");

  function updateResult() {
    const amount = parseFloat(amountInput.value);
    const rate = parseFloat(data.exchangeRates?.[targetCurrency.value]);

    if (isNaN(amount)) {
      result.textContent = "Please enter a valid amount.";
    } else if (isNaN(rate)) {
      result.textContent = "Exchange rate unavailable.";
    } else {
      const converted = numeral(amount * rate).format('0,0.00');
      result.textContent = `${amount} ${data.currency} = ${converted} ${targetCurrency.value}`;
    }
  }

  amountInput?.addEventListener("input", updateResult);
  targetCurrency?.addEventListener("change", updateResult);
}


// news modal
function updateNewsModal(newsArray) {
  const content = document.getElementById('news-content');

  if (!newsArray.length) {
    content.innerHTML = '<p>No news available.</p>';
    return;
  }

  const cards = newsArray.map(article => {
    const image = article.image || 'img/news-placeholder.jpg';
    return `
      <a href="${article.link}" target="_blank" class="text-decoration-none text-reset">
        <div class="card mb-3 shadow-sm">
          <div class="row g-0 align-items-stretch">
            <div class="col-4">
              <img src="${image}" alt="${article.title}"
                  class="img-fluid h-100 w-100 rounded-start"
                  style="object-fit: cover;" />
            </div>
            <div class="col-8">
              <div class="card-body h-100 d-flex flex-column justify-content-center">
                <h6 class="card-title">${article.title}</h6>
                <p class="text-muted small mt-1">${article.source}</p>
              </div>
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');

  content.innerHTML = cards;
}

// Wikipedia modal
function updateWikipediaModal(data) {
  const content = document.getElementById('wikipedia-content');
  const title = data.name.replace(/ /g, '_');

  content.innerHTML = '<p>Loading Wikipedia content...</p>';

  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
    .then(res => res.json())
    .then(info => {
      if (info.extract) {
        content.innerHTML = `
          <p>${info.extract}</p>
          <p><a href="${info.content_urls.desktop.page}" target="_blank">Read more on Wikipedia</a></p>
        `;
      } else {
        content.innerHTML = `<p>Wikipedia content not available.</p>`;
      }
    })
    .catch(err => {
      content.innerHTML = `<p>Failed to load Wikipedia data.</p>`;
      // console.error('Wikipedia API error:', err);
    });
}

// Holidays modal
function updateHolidayModal(data) {
  const content = document.getElementById('holidays-content');

  if (!Array.isArray(data) || data.length === 0) {
    content.innerHTML = `<p>No public holidays found.</p>`;
    return;
  }

  const list = data.map(h => `
    <div class="d-flex justify-content-between py-2 border-bottom">
      <div><strong>${h.localName}</strong><br><small class="text-muted">${h.name}</small></div>
      <div class="text-end text-primary">${new Date(h.date).toString("dddd d MMMM")}</div>
    </div>
  `).join('');

  content.innerHTML = `<div class="px-2">${list}</div>`;
}

// Country modal
function formatPostalPattern(raw) {
  return raw
    .split('|')                           // Split different formats
    .map(pattern => 
      pattern
        .replace(/@/g, 'A')
        .replace(/#/g, '9')
    )
    .join(', ');
}


function updateCountryModal(data) {
  const content = document.getElementById("country-content");
  const flagUrl = `img/flags/${data.iso2.toLowerCase()}.png`;

  content.innerHTML = `
    <img src="${flagUrl}" alt="${data.name} flag" style="height: 24px;" class="mb-3"><br>
    <h5 class="mb-4">${data.name}</h5>
    <ul class="list-unstyled">
      ${[
        { icon: 'landmark text-primary', label: 'Capital', value: data.capital || 'N/A' },
        { icon: 'globe-europe text-success', label: 'Continent', value: data.continent || 'N/A' },
        { icon: 'language text-warning', label: 'Languages', value: data.languages || 'N/A' },
        { icon: 'money-bill text-secondary', label: 'Currency', value: data.currency || 'N/A' },
        { icon: 'users text-info', label: 'Population', value: data.population ? numeral(data.population).format('0,0') : 'N/A' },
        { icon: 'ruler-combined text-danger', label: 'Area', value: data.area ? numeral(data.area).format('0,0') + ' km²' : 'N/A' },
        { icon: 'mail-bulk text-muted', label: 'Postal Format', value: data.postal ? 'e.g. like: ' + formatPostalPattern(data.postal) : 'N/A' },
        { icon: 'code text-dark', label: 'ISO Alpha-2', value: data.iso2 },
        { icon: 'code text-dark', label: 'ISO Alpha-3', value: data.iso3 },
      ]
        .map(item => `
          <li class="d-flex justify-content-between align-items-start py-1 border-bottom">
            <div><i class="fas fa-${item.icon} me-2"></i><strong>${item.label}:</strong></div>
            <div class="text-end">${item.value}</div>
          </li>
        `)
        .join('')}
    </ul>
  `;
}