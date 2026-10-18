<?php

// The only PHP entry point in public_html. Laravel stays outside the web root.
// Default layout: /home/CPANEL_USER/{public_html,acm-backend}.
$backend = dirname(__DIR__).'/acm-backend';
if (! is_file($backend.'/vendor/autoload.php') || ! is_file($backend.'/bootstrap/app.php')) {
    http_response_code(503);
    header('Content-Type: application/json');
    header('Cache-Control: no-store, private');
    echo json_encode(['message' => 'Application setup is incomplete.']);
    exit;
}

require $backend.'/public/index.php';
