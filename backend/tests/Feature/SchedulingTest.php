<?php
namespace Tests\Feature;
use App\Enums\BusinessRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class SchedulingTest extends TestCase {
    use RefreshDatabase;
    private string $business;
    private string $customer;
    private string $service;
    private string $staff;
    private array $input;
    protected function setUp(): void {
        parent::setUp(); $this->travelTo(CarbonImmutable::parse('2026-10-14T08:00:00Z'));
        $this->business=$this->actingAs(User::factory()->create())->postJson('/api/v1/businesses',BusinessTest::input())->json('activeBusinessId');
        $this->withHeader('X-Business-ID',$this->business);
        $this->customer=$this->postJson('/api/v1/customers',DirectoryTest::contact())->json('data.id');
        $this->service=$this->postJson('/api/v1/services',DirectoryTest::service())->json('data.id');
        $this->staff=$this->postJson('/api/v1/staff',DirectoryTest::staff([$this->service]))->json('data.id');
        $this->input=['customerId'=>$this->customer,'serviceId'=>$this->service,'staffId'=>$this->staff,'startsAt'=>'2026-10-15T09:00:00Z','status'=>'confirmed','notes'=>'Booking'];
    }
    public function test_booking_derives_duration_and_preserves_price_snapshot_with_real_range_queries(): void {
        $id=$this->postJson('/api/v1/appointments',[...$this->input,'endsAt'=>'2030-01-01T00:00:00Z','businessId'=>'untrusted'])->assertCreated()->assertJsonPath('data.endsAt','2026-10-15T09:30:00.000000Z')->assertJsonPath('data.customerName','Contact')->json('data.id');
        $this->patchJson('/api/v1/services/'.$this->service,[...DirectoryTest::service(),'priceMinor'=>9999])->assertOk();
        $this->getJson('/api/v1/appointments/'.$id)->assertJsonPath('data.priceMinor',1234);
        $this->getJson('/api/v1/calendar?from=2026-10-15&to=2026-10-15')->assertOk()->assertJsonCount(1,'data');
        $this->getJson('/api/v1/appointments?search=Contact')->assertJsonCount(1,'data');
        $this->getJson('/api/v1/appointments?from=2026-10-16&to=2026-10-16')->assertJsonCount(0,'data');
        $this->patchJson('/api/v1/appointments/'.$id,[...$this->input,'startsAt'=>'2026-10-15T10:00:00Z'])->assertOk()->assertJsonPath('data.startsAt','2026-10-15T10:00:00.000000Z');
    }
    public function test_overlap_is_rejected_and_cancellation_releases_capacity_without_resurrection(): void {
        $id=$this->postJson('/api/v1/appointments',$this->input)->assertCreated()->json('data.id');
        $this->postJson('/api/v1/appointments',$this->input)->assertConflict();
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'cancelled'])->assertOk();
        $this->postJson('/api/v1/appointments',$this->input)->assertCreated();
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'confirmed'])->assertConflict();
        $this->patchJson('/api/v1/appointments/'.$id,$this->input)->assertConflict();
    }
    public function test_customers_cannot_be_booked_simultaneously_across_different_staff(): void {
        $this->postJson('/api/v1/appointments',$this->input)->assertCreated();
        $second=$this->postJson('/api/v1/staff',[...DirectoryTest::staff([$this->service]),'email'=>'second@example.test'])->json('data.id');
        $this->postJson('/api/v1/appointments',[...$this->input,'staffId'=>$second])->assertConflict();
        $customer=$this->postJson('/api/v1/customers',DirectoryTest::contact('Other'))->json('data.id');
        $this->postJson('/api/v1/appointments',[...$this->input,'staffId'=>$second,'customerId'=>$customer])->assertCreated();
    }
    public function test_business_and_staff_breaks_closed_hours_and_slot_alignment_are_enforced(): void {
        $v=DirectoryTest::staff([$this->service]); $v['hours'][4]['breaks']=[['open'=>'12:00','close'=>'13:00']];
        $this->patchJson('/api/v1/staff/'.$this->staff,$v)->assertOk();
        foreach(['08:30','16:45','12:00','09:15'] as $time) $this->postJson('/api/v1/appointments',[...$this->input,'startsAt'=>'2026-10-15T'.$time.':00Z'])->assertUnprocessable();
        $this->postJson('/api/v1/appointments',[...$this->input,'startsAt'=>'2026-02-30T09:00:00Z'])->assertUnprocessable();
        $this->postJson('/api/v1/appointments',[...$this->input,'startsAt'=>'2026-10-15T09:00:00'])->assertUnprocessable();
        $slots=$this->getJson('/api/v1/availability?'.http_build_query(['serviceId'=>$this->service,'staffId'=>$this->staff,'date'=>'2026-10-15']))->assertOk()->json('data');
        $this->assertContains('2026-10-15T09:00:00.000000Z',$slots);
        $this->assertNotContains('2026-10-15T12:00:00.000000Z',$slots);
        $this->assertNotContains('2026-10-15T16:45:00.000000Z',$slots);
    }
    public function test_business_configuration_controls_initial_status_and_unassigned_capacity(): void {
        $v=BusinessTest::input(); $v['appointmentSettings']['requireConfirmation']=true;
        $this->patchJson('/api/v1/business',$v)->assertOk();
        $this->postJson('/api/v1/appointments',[...$this->input,'staffId'=>null])->assertCreated()->assertJsonPath('data.status','scheduled');
        $customer=$this->postJson('/api/v1/customers',DirectoryTest::contact('Other'))->json('data.id');
        $this->postJson('/api/v1/appointments',[...$this->input,'customerId'=>$customer,'staffId'=>null])->assertConflict();
        $v['appointmentSettings']['allowUnassigned']=false; $this->patchJson('/api/v1/business',$v)->assertOk();
        $this->postJson('/api/v1/appointments',[...$this->input,'staffId'=>null,'startsAt'=>'2026-10-15T10:00:00Z'])->assertUnprocessable();
    }
    public function test_archived_references_and_foreign_workspace_records_cannot_be_booked(): void {
        $this->deleteJson('/api/v1/customers/'.$this->customer)->assertNoContent();
        $this->postJson('/api/v1/appointments',$this->input)->assertUnprocessable();
        $other=User::factory()->create(); $id=$this->actingAs($other)->postJson('/api/v1/businesses',BusinessTest::input('Other'))->json('activeBusinessId'); $this->withHeader('X-Business-ID',$id);
        $this->postJson('/api/v1/appointments',$this->input)->assertUnprocessable();
        $this->getJson('/api/v1/availability?'.http_build_query(['serviceId'=>$this->service,'date'=>'2026-10-15']))->assertUnprocessable();
    }
    public function test_status_transitions_and_permissions_are_checked_server_side(): void {
        $id=$this->postJson('/api/v1/appointments',$this->input)->json('data.id');
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'completed'])->assertConflict();
        $this->travelTo(CarbonImmutable::parse('2026-10-15T10:00:00Z'));
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'completed'])->assertOk();
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'cancelled'])->assertConflict();
        $staff=User::factory()->create(); Business::findOrFail($this->business)->memberships()->create(['user_id'=>$staff->id,'role'=>BusinessRole::Staff]);
        $this->actingAs($staff)->postJson('/api/v1/appointments',[...$this->input,'startsAt'=>'2026-10-16T09:00:00Z'])->assertForbidden();
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'cancelled'])->assertForbidden();
        $this->getJson('/api/v1/appointments/'.$id)->assertOk();
    }
    public function test_timezone_conversion_and_dst_gap_and_fold_use_actual_utc_instants(): void {
        $v=BusinessTest::input(); $v['timeZone']='Asia/Kabul'; $this->patchJson('/api/v1/business',$v)->assertOk();
        $id=$this->postJson('/api/v1/appointments',[...$this->input,'startsAt'=>'2026-10-15T09:00:00+04:30'])->assertCreated()->assertJsonPath('data.startsAt','2026-10-15T04:30:00.000000Z')->json('data.id');
        $v['timeZone']='America/New_York'; $v['hours']=array_map(fn($h)=>[...$h,'open'=>'00:00','close'=>'05:00'],$v['hours']);
        $this->patchJson('/api/v1/business',$v)->assertConflict();
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'cancelled'])->assertOk();
        $this->patchJson('/api/v1/business',$v)->assertOk();
        $this->patchJson('/api/v1/staff/'.$this->staff,[...DirectoryTest::staff([$this->service]),'hours'=>$v['hours']])->assertOk();
        $fold=$this->getJson('/api/v1/availability?'.http_build_query(['serviceId'=>$this->service,'staffId'=>$this->staff,'date'=>'2026-11-01']))->assertOk()->json('data');
        $this->assertContains('2026-11-01T05:00:00.000000Z',$fold); $this->assertContains('2026-11-01T06:00:00.000000Z',$fold);
        $gap=$this->getJson('/api/v1/availability?'.http_build_query(['serviceId'=>$this->service,'staffId'=>$this->staff,'date'=>'2027-03-14']))->assertOk()->json('data');
        foreach($gap as $slot) $this->assertNotSame('02',CarbonImmutable::parse($slot)->setTimezone('America/New_York')->format('H'));
        $this->assertContains('2027-03-14T07:00:00.000000Z',$gap);
    }
    public function test_directory_changes_cannot_orphan_live_bookings_and_dashboard_uses_real_tenant_data(): void {
        $id=$this->postJson('/api/v1/appointments',[...$this->input,'startsAt'=>'2026-10-14T09:00:00Z'])->assertCreated()->json('data.id');
        foreach(['customers'=>$this->customer,'services'=>$this->service,'staff'=>$this->staff] as $kind=>$record) $this->deleteJson('/api/v1/'.$kind.'/'.$record)->assertConflict();
        $this->patchJson('/api/v1/staff/'.$this->staff,DirectoryTest::staff())->assertConflict();
        $this->getJson('/api/v1/dashboard')->assertOk()->assertJsonPath('data.customerTotal',1)->assertJsonPath('data.statusCounts.confirmed',1)->assertJsonCount(1,'data.daily')->assertJsonPath('data.upcoming.0.id',$id);
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'cancelled'])->assertOk();
        $this->deleteJson('/api/v1/customers/'.$this->customer)->assertNoContent();
        $this->getJson('/api/v1/dashboard')->assertJsonPath('data.customerTotal',0)->assertJsonCount(0,'data.upcoming');
        $other=User::factory()->create(); $business=$this->actingAs($other)->postJson('/api/v1/businesses',BusinessTest::input('Other'))->json('activeBusinessId');
        $this->withHeader('X-Business-ID',$business)->getJson('/api/v1/appointments/'.$id)->assertNotFound();
        $this->patchJson('/api/v1/appointments/'.$id.'/status',['status'=>'cancelled'])->assertNotFound();
        $this->getJson('/api/v1/dashboard')->assertJsonCount(0,'data.daily')->assertJsonPath('data.customerTotal',0);
    }
}
