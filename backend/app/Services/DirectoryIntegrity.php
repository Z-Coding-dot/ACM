<?php
namespace App\Services;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\StaffMember;
use App\Models\TenantRecord;
class DirectoryIntegrity {
    public function check(TenantRecord $record): void {
        $kind=match(true) { $record instanceof Customer=>'customers',$record instanceof Service=>'services',$record instanceof StaffMember=>'staff' };
        $limit=config('acm.limits.'.$kind);
        if ($record->active && $limit!==null && $record::where('business_id',$record->business_id)->where('active',true)->count()>$limit) abort(response()->json(['code'=>'error.planLimit'],409));
        $column=match(true) { $record instanceof Customer=>'customer_id',$record instanceof Service=>'service_id',$record instanceof StaffMember=>'staff_member_id' };
        $bookings=Appointment::where('business_id',$record->business_id)->where($column,$record->id)->whereIn('status',Scheduling::OCCUPIED)->where('ends_at','>',now())->get();
        if (!$record->active && $bookings->isNotEmpty()) abort(response()->json(['code'=>'error.bookedRecord'],409));
        if ($record instanceof StaffMember && $bookings->isNotEmpty()) {
            $record->load('services'); $business=$record->business->load(['settings','hours']);
            foreach($bookings as $booking) if (!$record->services->contains('id',$booking->service_id) || !app(Scheduling::class)->withinHours($business,$record,$booking->starts_at,$booking->ends_at,false)) abort(response()->json(['code'=>'error.scheduleInUse'],409));
        }
    }
}
