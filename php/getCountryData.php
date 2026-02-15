<?php
header('Content-Type: application/json');
require __DIR__ . '/.env.php';

$code = $_GET['code'] ?? '';

if (!$code) {
    echo json_encode(['error' => 'No country code provided']);
    exit;
}

$url = "https://restcountries.com/v3.1/alpha/$code";
$response = file_get_contents($url);
$data = json_decode($response, true);

if (!$data || !isset($data[0])) {
    echo json_encode(['error' => 'Invalid country data']);
    exit;
}

$country = $data[0];
$name = $country['name']['common'] ?? 'N/A';
$capital = $country['capital'][0] ?? 'N/A';
$population = number_format($country['population'] ?? 0);
$currencyCode = array_keys($country['currencies'] ?? [])[0] ?? '';
$exchangeRate = 'N/A';
$weather = [
    'description' => 'N/A',
    'temp' => 'N/A',
    'humidity' => 'N/A',
    'wind' => 'N/A'
];
$wiki = '#';

// Currency (exchangerate-api.com)
$exchangeRates = [];
$currencyNames = [];

$exchangeRate = 'N/A';
$exchangeRates = [];
$currencyNames = [];

if ($currencyCode) {
    // 1. Fetch exchange rates for this country's currency
    $currencyApiUrl = "https://open.er-api.com/v6/latest/$currencyCode";
    $response = @file_get_contents($currencyApiUrl);

    if ($response) {
        $exchangeData = json_decode($response, true);

        if (!empty($exchangeData['rates'])) {
            $exchangeRates = $exchangeData['rates'];

            if (isset($exchangeRates['USD'])) {
                $exchangeRate = $exchangeRates['USD'];
            }
        }
    }

    // 2. Fetch human-readable currency names from OpenExchangeRates
    $namesResponse = @file_get_contents("https://openexchangerates.org/api/currencies.json");
    if ($namesResponse) {
        $currencyNames = json_decode($namesResponse, true);
    }
}

// Uncomment to debug:
// header('Content-Type: application/json');
// echo json_encode($exchangeRates); exit;

// Weather (OpenWeather)
if ($capital) {
    // Current weather
    $weatherData = json_decode(file_get_contents("https://api.openweathermap.org/data/2.5/weather?q=$capital&appid=$openWeatherKey&units=metric"), true);
    if (!empty($weatherData)) {
        $weather['description'] = ucfirst($weatherData['weather'][0]['description'] ?? 'N/A');
        $weather['temp'] = round($weatherData['main']['temp']) ?? 'N/A';
        $weather['humidity'] = $weatherData['main']['humidity'] ?? 'N/A';
        $weather['wind'] = round($weatherData['wind']['speed']) ?? 'N/A';
    }

    // Forecast
    $forecastData = json_decode(file_get_contents("https://api.openweathermap.org/data/2.5/forecast?q=$capital&appid=$openWeatherKey&units=metric"), true);
    if (!empty($forecastData['list'])) {
        foreach ($forecastData['list'] as $entry) {
            $dt = $entry['dt_txt']; // e.g. "2025-05-09 12:00:00"
            $temp = round($entry['main']['temp']);
            $desc = ucfirst($entry['weather'][0]['description']);
            $icon = $entry['weather'][0]['icon'] ?? '';
            $forecast[] = [
                'time' => $dt,
                'temp' => $temp,
                'description' => $desc,
                'icon' => $icon
            ];
        }
    }
}

// Wikipedia
$wiki = 'https://en.wikipedia.org/wiki/' . str_replace(' ', '_', $name);

// Output JSON
echo json_encode([
    'name' => $name,
    'capital' => $capital,
    'population' => $population,
    'currency' => $currencyCode,
    'exchangeRates' => $exchangeRates,
    'currencyNames' => $currencyNames,
    'weather' => $weather,
    'forecast' => $forecast,
    'wikipedia' => $wiki,
    'continent' => $country['continents'][0] ?? '',
    'languages' => isset($country['languages']) ? implode(', ', $country['languages']) : '',
    'area' => $country['area'] ?? '',
    'postal' => $country['postalCode']['format'] ?? '',
    'iso2' => $country['cca2'] ?? '',
    'iso3' => $country['cca3'] ?? ''
]);