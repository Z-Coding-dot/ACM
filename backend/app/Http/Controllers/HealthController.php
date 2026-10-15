<?php
namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
class HealthController extends Controller {
    public function __invoke() {
        try { DB::select('SELECT 1'); return response()->json(['status'=>'ready']); }
        catch (\Throwable) { return response()->json(['status'=>'unavailable'],503); }
    }
}
