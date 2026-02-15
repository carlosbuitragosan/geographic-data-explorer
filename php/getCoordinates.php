<?php
header('Content-Type: application/json');
require __DIR__ . '/.env.php';

$lat = $_GET['lat'] ?? '';
$lng = $_GET['lng'] ?? '';
if (!$lat || !$lng) {
  echo json_encode(['error' => 'Missing coordinates']);
  exit;
}

// 1. Reverse geocode via OpenCage
$url = "https://api.opencagedata.com/geocode/v1/json?q=$lat+$lng&key=$opencageKey";
$res = json_decode(file_get_contents($url), true);
$components = $res['results'][0]['components'] ?? [];


$countryName = $components['country'] ?? 'Unknown';
$countryCode2 = strtoupper($components['country_code'] ?? '');

// 2. Map ISO2 -> ISO3 using countryBorders.geo.json
$borders = json_decode(file_get_contents('../data/countryBorders.geo.json'), true);
$iso3 = '';


$iso2Keys = ['ISO3166-1-Alpha-2', 'iso_a2'];

foreach ($borders['features'] as $f) {
  if (strcasecmp($f['properties']['name'] ?? '', $countryName) === 0) {
    $iso3 = $f['id'] ?? '';
    break;
  }
}

echo json_encode([
  'name' => $countryName,
  'code' => $iso3
]);