<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function actingAs(\Illuminate\Contracts\Auth\Authenticatable $user, $guard = null)
    {
        // Each actor starts with fresh guards in the reused feature-test application.
        $this->app['auth']->forgetGuards();

        return parent::actingAs($user, $guard ?? 'web');
    }

    public function createApplication()
    {
        $app = parent::createApplication();
        $connection = $app['config']['database.default'];
        $database = $app['config']["database.connections.{$connection}.database"];
        if ($connection !== 'mysql' || ! str_ends_with((string) $database, '_test')) {
            throw new \RuntimeException('Backend tests require a dedicated MySQL database ending in _test.');
        }

        return $app;
    }
}
