# Geographic Data Explorer

Geographic Data Explorer is a PHP-based web application that aggregates real-time geographic, weather, and news data from multiple third-party APIs. The project was built to demonstrate structured API integration, data validation, and error handling in a multi-source environment.

---

## Overview

The application allows users to explore country and city information through an interactive interface powered by external APIs. Data is retrieved server-side and returned as structured JSON to the frontend.

The project focuses on:

- Handling multiple external API integrations
- Validating and parsing structured JSON responses
- Managing failed or incomplete API responses
- Ensuring consistent application behaviour under edge cases

---

## APIs Integrated

- GeoNames API
- OpenCage API
- RestCountries API
- NewsData.io API
- OpenWeatherMap API
- Wikipedia API

---

## Tech Stack

- PHP (server-side API handling)
- jQuery
- Bootstrap
- Leaflet.js (map rendering)
- REST APIs

---

## Key Implementation Details

- Server-side PHP endpoints aggregate and normalise responses from multiple APIs
- Structured JSON parsing and response validation
- Error handling for failed API calls and missing data
- Frontend dynamically updates based on asynchronous responses

---

## Learning Focus

This project emphasised:

- Working with third-party APIs and understanding request/response cycles
- Handling inconsistent or partial data from external services
- Testing edge cases such as invalid queries and network failures
- Ensuring predictable behaviour across multiple dependent data sources

---

## Running Locally

1. Clone the repository
2. Configure API keys inside the appropriate PHP configuration files
3. Run using a local PHP server (e.g. XAMPP, MAMP, or built-in PHP server)
