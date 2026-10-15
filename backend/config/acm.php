<?php

return [
    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://127.0.0.1:5173'), '/'),
    'limits' => [
        'businesses' => env('ACM_BUSINESSES_PER_USER') === null || env('ACM_BUSINESSES_PER_USER') === '' ? null : (int) env('ACM_BUSINESSES_PER_USER'),
        'customers' => env('ACM_CUSTOMERS_PER_BUSINESS') === null || env('ACM_CUSTOMERS_PER_BUSINESS') === '' ? null : (int) env('ACM_CUSTOMERS_PER_BUSINESS'),
        'services' => env('ACM_SERVICES_PER_BUSINESS') === null || env('ACM_SERVICES_PER_BUSINESS') === '' ? null : (int) env('ACM_SERVICES_PER_BUSINESS'),
        'staff' => env('ACM_STAFF_PER_BUSINESS') === null || env('ACM_STAFF_PER_BUSINESS') === '' ? null : (int) env('ACM_STAFF_PER_BUSINESS'),
    ],
];
