<?php
header('Content-Type: application/json');
require __DIR__ . '/.env.php';

$code = $_GET['code'] ?? '';

if (!$code) {
    echo json_encode([]);
    exit;
}

// Build URL
$url = "http://api.geonames.org/searchJSON?country=$code&featureClass=P&maxRows=50&username=$geonamesUser";

// Get response
$response = @file_get_contents($url);  // The "@" prevents warnings if URL fails
if ($response === false) {
    echo json_encode(['error' => 'Failed to contact GeoNames']);
    exit;
}

// Decode JSON
$data = json_decode($response, true);

if (!isset($data['geonames']) || empty($data['geonames'])) {
    echo json_encode([]);
    exit;
}

// Extract useful fields
$cities = [];
foreach ($data['geonames'] as $place) {
    $cities[] = [
        'name' => $place['name'],
        'lat' => (float) $place['lat'],
        'lng' => (float) $place['lng']
    ];
}

echo json_encode($cities);