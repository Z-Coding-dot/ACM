<?php
namespace Tests\Feature;
use App\Enums\BusinessRole;
use App\Models\Business;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class DirectoryTest extends TestCase {
    use RefreshDatabase;
    private User $owner;
    private string $business;
    protected function setUp(): void {
        parent::setUp(); $this->owner=User::factory()->create();
        $this->business=$this->actingAs($this->owner)->postJson('/api/v1/businesses',BusinessTest::input())->assertCreated()->json('activeBusinessId');
        $this->withHeader('X-Business-ID',$this->business);
    }
    public static function contact(string $name='Contact'): array { return ['name'=>$name,'email'=>'contact@example.test','phone'=>'+93 700 000 111','notes'=>'Contact note']; }
    public static function service(): array { return ['name'=>'Consultation','description'=>'A consultation','durationMinutes'=>30,'priceMinor'=>1234,'currency'=>'JPY','active'=>true]; }
    public static function staff(array $serviceIds=[]): array { return ['name'=>'Provider','email'=>'staff@example.test','phone'=>'+93 700 000 222','active'=>true,'serviceIds'=>$serviceIds,'hours'=>BusinessTest::input()['hours']]; }
    public function test_customer_crud_search_pagination_duplicates_and_archive_preserve_history(): void {
        $id=$this->postJson('/api/v1/customers',[...self::contact(),'businessId'=>'untrusted','id'=>'untrusted'])->assertCreated()->assertJsonPath('data.businessId',$this->business)->json('data.id');
        $this->postJson('/api/v1/customers',self::contact())->assertUnprocessable();
        $this->postJson('/api/v1/customers',self::contact('Other'))->assertCreated();
        $this->getJson('/api/v1/customers?per_page=1')->assertJsonCount(1,'data')->assertJsonPath('meta.total',2)->assertJsonPath('meta.last_page',2);
        $this->getJson('/api/v1/customers?search=Other')->assertJsonCount(1,'data');
        $this->getJson('/api/v1/customers?search=%25')->assertJsonCount(0,'data');
        $this->patchJson('/api/v1/customers/'.$id,self::contact('Updated'))->assertOk()->assertJsonPath('data.name','Updated');
        $this->deleteJson('/api/v1/customers/'.$id)->assertNoContent();
        $this->assertDatabaseHas('customers',['id'=>$id,'active'=>false]);
        $this->getJson('/api/v1/customers/'.$id)->assertOk()->assertJsonPath('data.active',false);
        $this->getJson('/api/v1/customers?active=false')->assertJsonCount(1,'data');
    }
    public function test_service_prices_are_minor_unit_integers_and_archived_profiles_remain_readable(): void {
        $id=$this->postJson('/api/v1/services',self::service())->assertCreated()->assertJsonPath('data.priceMinor',1234)->json('data.id');
        $this->patchJson('/api/v1/services/'.$id,[...self::service(),'priceMinor'=>0,'currency'=>'USD','active'=>false])->assertOk()->assertJsonPath('data.active',false);
        $this->getJson('/api/v1/services/'.$id)->assertOk()->assertJsonPath('data.currency','USD');
        $this->postJson('/api/v1/services',[...self::service(),'priceMinor'=>1.5])->assertUnprocessable();
        $this->postJson('/api/v1/services',[...self::service(),'durationMinutes'=>0])->assertUnprocessable();
        $this->deleteJson('/api/v1/services/'.$id)->assertNoContent();
    }
    public function test_staff_service_assignments_breaks_and_optional_account_link_are_persisted(): void {
        $service=$this->postJson('/api/v1/services',self::service())->assertCreated()->json('data.id');
        $v=self::staff([$service]); $v['hours'][1]['breaks']=[['open'=>'12:00','close'=>'13:00']]; $v['userId']=$this->owner->id;
        $id=$this->postJson('/api/v1/staff',$v)->assertCreated()->assertJsonPath('data.serviceIds.0',$service)->assertJsonPath('data.hours.1.breaks.0.open','12:00')->json('data.id');
        $this->assertDatabaseHas('staff_services',['business_id'=>$this->business,'staff_member_id'=>$id,'service_id'=>$service]);
        $this->patchJson('/api/v1/staff/'.$id,[...self::staff(),'active'=>false])->assertOk()->assertJsonPath('data.serviceIds',[])->assertJsonPath('data.userId',(string)$this->owner->id);
        $this->deleteJson('/api/v1/staff/'.$id)->assertNoContent();
    }
    public function test_foreign_resources_are_inaccessible_even_with_valid_own_membership(): void {
        $contact=$this->postJson('/api/v1/customers',self::contact())->json('data.id');
        $service=$this->postJson('/api/v1/services',self::service())->json('data.id');
        $staff=$this->postJson('/api/v1/staff',self::staff([$service]))->json('data.id');
        $attacker=User::factory()->create();
        $foreign=$this->actingAs($attacker)->postJson('/api/v1/businesses',BusinessTest::input('Foreign'))->assertCreated()->json('activeBusinessId');
        $this->withHeader('X-Business-ID',$foreign);
        foreach (['customers'=>$contact,'services'=>$service,'staff'=>$staff] as $kind=>$id) {
            $this->getJson('/api/v1/'.$kind.'/'.$id)->assertNotFound();
            $this->patchJson('/api/v1/'.$kind.'/'.$id,match($kind){'customers'=>self::contact(),'services'=>self::service(),'staff'=>self::staff()})->assertNotFound();
            $this->deleteJson('/api/v1/'.$kind.'/'.$id)->assertNotFound();
        }
        $this->postJson('/api/v1/staff',self::staff([$service]))->assertUnprocessable();
        $this->postJson('/api/v1/staff',[...self::staff(),'userId'=>$this->owner->id])->assertUnprocessable();
        $this->assertDatabaseHas('customers',['id'=>$contact,'active'=>true]);
    }
    public function test_role_permissions_are_enforced_on_every_directory_write(): void {
        $reader=User::factory()->create();
        Business::findOrFail($this->business)->memberships()->create(['user_id'=>$reader->id,'role'=>BusinessRole::Staff]);
        $this->actingAs($reader);
        foreach (['customers'=>self::contact(),'services'=>self::service(),'staff'=>self::staff()] as $kind=>$input) {
            $this->getJson('/api/v1/'.$kind)->assertOk(); $this->postJson('/api/v1/'.$kind,$input)->assertForbidden();
        }
        Business::findOrFail($this->business)->memberships()->where('user_id',$reader->id)->update(['role'=>BusinessRole::Receptionist]);
        $this->postJson('/api/v1/customers',self::contact())->assertCreated();
        $this->postJson('/api/v1/services',self::service())->assertForbidden();
    }
    public function test_invalid_query_and_payload_types_are_rejected(): void {
        $this->getJson('/api/v1/customers?per_page=100000')->assertUnprocessable();
        $this->getJson('/api/v1/customers?sort=password')->assertUnprocessable();
        $this->postJson('/api/v1/customers',[...self::contact(),'email'=>[]])->assertUnprocessable();
        $this->postJson('/api/v1/staff',[...self::staff(),'hours'=>[]])->assertUnprocessable();
        $this->assertDatabaseCount('customers',0);
    }
}
