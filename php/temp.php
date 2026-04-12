<?php
header('Content-Type: application/json');

$path = '../data/countryBorders.geo.json';
$json = file_get_contents($path);
$data = json_decode($json, true);

$list = [];

foreach ($data['features'] as $feature) {
  $list[] = [
    'name' => $feature['properties']['name'] ?? '',
    'iso3' => $feature['id'] ?? ''
  ];
}

echo json_encode($list);