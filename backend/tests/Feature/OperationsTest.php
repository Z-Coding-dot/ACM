<?php
namespace Tests\Feature;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class OperationsTest extends TestCase {
    use RefreshDatabase;
    public function test_initial_plan_limits_are_configurable_and_archiving_releases_contact_capacity(): void {
        config(['acm.limits.businesses'=>1,'acm.limits.customers'=>1,'acm.limits.services'=>1]);
        $id=$this->actingAs(User::factory()->create())->postJson('/api/v1/businesses',BusinessTest::input())->assertCreated()->json('activeBusinessId');
        $this->postJson('/api/v1/businesses',BusinessTest::input('Extra'))->assertConflict()->assertJsonPath('code','error.planLimit');
        $this->withHeader('X-Business-ID',$id);
        $customer=$this->postJson('/api/v1/customers',DirectoryTest::contact())->assertCreated()->json('data.id');
        $this->postJson('/api/v1/customers',DirectoryTest::contact('Extra'))->assertConflict();
        $this->deleteJson('/api/v1/customers/'.$customer)->assertNoContent();
        $this->postJson('/api/v1/customers',DirectoryTest::contact('Extra'))->assertCreated();
        $this->postJson('/api/v1/services',DirectoryTest::service())->assertCreated();
        $service=$this->postJson('/api/v1/services',[...DirectoryTest::service(),'active'=>false])->assertCreated()->json('data.id');
        $this->patchJson('/api/v1/services/'.$service,DirectoryTest::service())->assertConflict();
        $this->assertDatabaseHas('services',['id'=>$service,'active'=>false]);
    }
    public function test_mysql_composite_foreign_keys_prevent_cross_tenant_relationships(): void {
        $a=Appointment::factory()->create();
        $foreign=Customer::factory()->create(['business_id'=>Business::factory()->configured()->create()->id]);
        $a->customer_id=$foreign->id;
        $this->expectException(QueryException::class); $a->save();
    }
    public function test_readiness_and_cli_health_check_use_the_real_mysql_connection(): void {
        $this->getJson('/health/ready')->assertOk()->assertJsonPath('status','ready');
        $this->artisan('acm:health')->assertSuccessful();
    }
    public function test_production_preflight_rejects_local_defaults_without_revealing_secrets(): void {
        $this->artisan('acm:production-check')->assertFailed();
        $this->app['env']='production';
        config(['app.debug'=>false,'app.url'=>'https://acm.example.test','app.key'=>'base64:'.base64_encode(random_bytes(32)),
            'acm.frontend_url'=>'https://acm.example.test','database.connections.mysql.password'=>'test-configuration-only',
            'session.secure'=>true,'session.http_only'=>true,'session.encrypt'=>true,'session.driver'=>'database',
            'cors.allowed_origins'=>['https://acm.example.test'],'sanctum.stateful'=>['acm.example.test'],'mail.default'=>'smtp',
            'mail.mailers.smtp.host'=>'smtp.example.test','mail.from.address'=>'no-reply@example.test']);
        $this->artisan('acm:production-check')->assertSuccessful();
        config(['cors.allowed_origins'=>['*']]); $this->artisan('acm:production-check')->assertFailed();
    }
}
