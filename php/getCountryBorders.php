<?php
header('Content-Type: application/json');

$code = $_GET['code'] ?? '';

// Load GeoJSON
$geojson = json_decode(file_get_contents('../data/countryBorders.geo.json'), true);

if (!$geojson || !isset($geojson['features'])) {
  echo json_encode(['error' => 'GeoJSON not found or invalid']);
  exit;
}

if (!$code) {
  echo json_encode(['error' => 'Missing country code']);
  exit;
}

// Find matching country
foreach ($geojson['features'] as $feature) {
  // Sometimes ISO code is stored inside properties
  $props = $feature['properties'];
  if (($feature['id'] ?? '') === $code || ($props['iso_a3'] ?? '') === $code) {
    echo json_encode($feature);
    exit;
  }
}

echo json_encode(['error' => 'Country code not found']);