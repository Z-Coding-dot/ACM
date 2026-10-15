<?php
namespace App\Http\Controllers;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\DirectoryResource;
use App\Models\Appointment;
use App\Models\Customer;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
class DashboardController extends Controller {
    public function __invoke(Request $request) {
        $business=$request->attributes->get('business');
        $day=CarbonImmutable::now($business->time_zone)->startOfDay();
        $daily=Appointment::with(['customer','staff'])->where('business_id',$business->id)->where('starts_at','>=',$day->utc())->where('starts_at','<',$day->addDay()->utc())->orderBy('starts_at')->get();
        $next=Appointment::with(['customer','staff'])->where('business_id',$business->id)->whereIn('status',['scheduled','confirmed'])->where('starts_at','>',now())->orderBy('starts_at')->limit(3)->get();
        $recent=Customer::where('business_id',$business->id)->where('active',true)->latest()->limit(4)->get();
        return response()->json(['data'=>['date'=>$day->toDateString(),'daily'=>$daily->map(fn($a)=>AppointmentResource::data($a))->all(),'upcoming'=>$next->map(fn($a)=>AppointmentResource::data($a))->all(),
            'statusCounts'=>$daily->countBy('status')->all(),'customerTotal'=>Customer::where('business_id',$business->id)->where('active',true)->count(),'recentCustomers'=>$recent->map(fn($c)=>DirectoryResource::data($c))->all()]]);
    }
}
