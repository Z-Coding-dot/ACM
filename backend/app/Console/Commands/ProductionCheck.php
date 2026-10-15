<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
class ProductionCheck extends Command {
    protected $signature='acm:production-check';
    protected $description='Validate production settings without printing secrets or changing data';
    public function handle(): int {
        $errors=[];
        if (!app()->isProduction()) $errors[]='APP_ENV must be production.';
        if (config('app.debug')) $errors[]='APP_DEBUG must be false.';
        if (config('database.default')!=='mysql' || !config('database.connections.mysql.password')) $errors[]='Configure MySQL with an application password.';
        if (!config('session.secure') || !config('session.http_only') || !config('session.encrypt') || config('session.driver')!=='database') $errors[]='Use secure, encrypted, HttpOnly database sessions.';
        foreach(['app.url','acm.frontend_url'] as $key) if(parse_url(config($key),PHP_URL_SCHEME)!=='https' || !parse_url(config($key),PHP_URL_HOST) || parse_url(config($key),PHP_URL_USER)) $errors[]=$key.' must be a real HTTPS origin.';
        $key=config('app.key');
        if (!is_string($key) || !str_starts_with($key,'base64:') || strlen(base64_decode(substr($key,7),true)?:'')!==32) $errors[]='Supply a private 32-byte Laravel application key.';
        $origin=config('acm.frontend_url'); $host=parse_url($origin,PHP_URL_HOST);
        if (!in_array($origin,config('cors.allowed_origins'),true) || in_array('*',config('cors.allowed_origins'),true)) $errors[]='CORS must explicitly allow the frontend HTTPS origin.';
        if (!in_array($host,config('sanctum.stateful'),true)) $errors[]='Sanctum must include the frontend hostname.';
        if (config('mail.default')!=='smtp' || !config('mail.mailers.smtp.host') || !filter_var(config('mail.from.address'),FILTER_VALIDATE_EMAIL)) $errors[]='Configure a real SMTP relay and sender address.';
        if ((bool)config('services.google.client_id') !== (bool)config('services.google.client_secret')) $errors[]='Google credentials must both be configured or both left blank.';
        if (config('services.google.client_id') && config('services.google.redirect')!==rtrim(config('app.url'),'/').'/auth/google/callback') $errors[]='Google callback must match the canonical backend HTTPS origin.';
        foreach(config('acm.limits') as $name=>$limit) if($limit!==null && $limit<1) $errors[]='Initial-plan limits must be positive integers or blank: '.$name;
        foreach($errors as $error) $this->error($error);
        if($errors) return self::FAILURE;
        $this->info('Production settings passed. SMTP delivery, Google credentials, DNS and HTTPS still need live verification.');
        return self::SUCCESS;
    }
}
