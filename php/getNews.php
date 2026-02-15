<?php
header('Content-Type: application/json');
require __DIR__ . '/.env.php';

$code = $_GET['code'] ?? '';

if (!$code) {
  echo json_encode(['error' => 'No country code provided']);
  exit;
}

// Get country name from code
$urlRest = "https://restcountries.com/v3.1/alpha/$code";
$responseRest = file_get_contents($urlRest);
$dataRest = json_decode($responseRest, true);
$name = $dataRest[0]['name']['common'] ?? '';

if (!$name) {
  echo json_encode(['error' => 'Country name not found']);
  exit;
}

// Call NewsData.io API for general top news
$urlNews = "https://newsdata.io/api/1/news?apikey=$newsDataKey&q=" . urlencode($name) . "&language=en&category=top";
$responseNews = file_get_contents($urlNews);
$dataNews = json_decode($responseNews, true);

if (!$dataNews || empty($dataNews['results'])) {
  echo json_encode(['error' => 'No news found']);
  exit;
}

// Deduplicate using cleaned (normalized) title
$seen = [];
$uniqueArticles = [];

foreach ($dataNews['results'] as $item) {
  $title = trim($item['title'] ?? '');
  $key = strtolower(preg_replace('/[^a-z0-9]/i', '', $title));

  if ($title && !in_array($key, $seen)) {
    $seen[] = $key;
    $uniqueArticles[] = $item;
    if (count($uniqueArticles) >= 10) break;
  }
}

// Format for frontend
$formatted = [];

foreach ($uniqueArticles as $item) {
  $formatted[] = [
    'title' => $item['title'] ?? 'Untitled',
    'link' => $item['link'] ?? '#',
    'image' => $item['image_url'] ?? '',
    'source' => $item['source_id'] ?? 'Unknown'
  ];
}

echo json_encode($formatted);