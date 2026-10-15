<?php
namespace App\Http\Controllers;
use App\Http\Requests\AppointmentRequest;
use App\Http\Requests\AppointmentQuery;
use App\Http\Requests\AvailabilityRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Business;
use App\Services\Scheduling;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
class AppointmentController extends Controller {
    public function __construct(private Scheduling $scheduling) {}
    public function index(AppointmentQuery $r) {
        $v=$r->validated(); $business=$r->attributes->get('business');
        $from=CarbonImmutable::parse($v['from']??CarbonImmutable::now($business->time_zone)->subDays(30)->toDateString(),$business->time_zone)->startOfDay();
        $to=CarbonImmutable::parse($v['to']??$from->addDays(120)->toDateString(),$business->time_zone)->startOfDay()->addDay();
        if ($to->lte($from) || $from->diffInDays($to)>367) throw ValidationException::withMessages(['to'=>['appointment.invalidRange']]);
        $q=Appointment::with(['customer','staff'])->where('business_id',$business->id);
        if (!($v['customerId']??null) || ($v['from']??null) || ($v['to']??null)) $q->where('starts_at','>=',$from->utc())->where('starts_at','<',$to->utc());
        foreach(['status'=>'status','staffId'=>'staff_member_id','customerId'=>'customer_id'] as $key=>$column) if ($v[$key]??null) $q->where($column,$v[$key]);
        if ($search=$v['search']??null) {
            $like='%'.str_replace(['!','%','_'],['!!','!%','!_'],$search).'%';
            $q->where(fn($q)=>$q->whereRaw("service_name LIKE ? ESCAPE '!'",[$like])->orWhereHas('customer',fn($q)=>$q->whereRaw("name LIKE ? ESCAPE '!'",[$like])));
        }
        $page=$q->orderBy('starts_at')->orderBy('id')->paginate($v['per_page']??50);
        return response()->json(['data'=>$page->getCollection()->map(fn($a)=>AppointmentResource::data($a))->all(),'meta'=>['current_page'=>$page->currentPage(),'per_page'=>$page->perPage(),'total'=>$page->total(),'last_page'=>$page->lastPage()]]);
    }
    private function record(Request $r,string $id): Appointment { return Appointment::with(['customer','staff'])->where('business_id',$r->attributes->get('business')->id)->findOrFail($id); }
    public function show(Request $r,string $id) { $a=$this->record($r,$id); Gate::authorize('view',$a); return response()->json(['data'=>AppointmentResource::data($a)]); }
    public function store(AppointmentRequest $r) { $business=$r->attributes->get('business'); Gate::authorize('create',[Appointment::class,$business]); return response()->json(['data'=>AppointmentResource::data($this->scheduling->save($business,$r->validated(),null,$r->user()))],201); }
    public function update(AppointmentRequest $r,string $id) { Gate::authorize('update',$this->record($r,$id)); return response()->json(['data'=>AppointmentResource::data($this->scheduling->save($r->attributes->get('business'),$r->validated(),$id,$r->user()))]); }
    public function availability(AvailabilityRequest $r) { return response()->json(['data'=>$this->scheduling->availability($r->attributes->get('business'),$r->validated())]); }
    public function destroy(Request $r,string $id) { $r->merge(['status'=>'cancelled']); $this->status($r,$id); return response()->noContent(); }
    public function status(Request $r,string $id) {
        Gate::authorize('update',$this->record($r,$id));
        $v=$r->validate(['status'=>['required','string',Rule::in(['confirmed','completed','cancelled','no-show'])]]);
        $a=DB::transaction(function() use($r,$id,$v) {
            Business::whereKey($r->attributes->get('business')->id)->lockForUpdate()->firstOrFail();
            $a=$this->record($r,$id); Gate::authorize('update',$a);
            if ($v['status']===$a->status) return $a;
            $allowed=match($a->status) { 'scheduled'=>['confirmed','completed','cancelled','no-show'],'confirmed'=>['completed','cancelled','no-show'], default=>[] };
            if (!in_array($v['status'],$allowed,true) || (in_array($v['status'],['completed','no-show'],true) && $a->starts_at->gt(now()))) abort(409);
            $a->update(['status'=>$v['status']]); return $a;
        },3);
        return response()->json(['data'=>AppointmentResource::data($a)]);
    }
}
