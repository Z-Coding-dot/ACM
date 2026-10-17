<?php

namespace App\Http\Controllers;

use App\Http\Requests\DirectoryQuery;
use App\Http\Requests\DirectoryRequest;
use App\Http\Resources\DirectoryResource;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\StaffMember;
use App\Services\DirectoryIntegrity;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class DirectoryController extends Controller
{
    private function model(Request $r): string
    {
        return ['customers' => Customer::class, 'services' => Service::class, 'staff' => StaffMember::class][$r->route('kind')];
    }

    private function query(Request $r)
    {
        $q = $this->model($r)::query()->where('business_id', $r->attributes->get('business')->id);
        if ($r->route('kind') === 'staff') {
            $q->with('services');
        }

        return $q;
    }

    public function index(DirectoryQuery $r)
    {
        $input = $r->validated();
        $q = $this->query($r);
        if ($search = $input['search'] ?? null) {
            $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';
            $q->where(function ($q) use ($like, $r) {
                $q->whereRaw("name LIKE ? ESCAPE '!'", [$like]);
                if ($r->route('kind') !== 'services') {
                    $q->orWhereRaw("email LIKE ? ESCAPE '!'", [$like])->orWhereRaw("phone LIKE ? ESCAPE '!'", [$like]);
                }
            });
        }
        $active = $input['active'] ?? ($r->route('kind') === 'customers' ? 'true' : 'all');
        if ($active !== 'all') {
            $q->where('active', $active === 'true');
        }
        $page = $q->orderBy(($input['sort'] ?? 'name') === 'createdAt' ? 'created_at' : 'name', $input['direction'] ?? 'asc')->orderBy('id')->paginate($input['per_page'] ?? 50);

        return response()->json(['data' => $page->getCollection()->map(fn ($record) => DirectoryResource::data($record))->all(), 'meta' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total(), 'last_page' => $page->lastPage()]]);
    }

    public function show(Request $r, string $id)
    {
        $record = $this->query($r)->findOrFail($id);
        Gate::authorize('view', $record);

        return response()->json(['data' => DirectoryResource::data($record)]);
    }

    public function store(DirectoryRequest $r)
    {
        Gate::authorize('create', [$this->model($r), $r->attributes->get('business')]);

        return $this->write($r, null);
    }

    public function update(DirectoryRequest $r, string $id)
    {
        $record = $this->query($r)->findOrFail($id);
        Gate::authorize('update', $record);

        return $this->write($r, $id);
    }

    private function write(DirectoryRequest $r, ?string $id)
    {
        try {
            $record = DB::transaction(function () use ($r, $id) {
                Business::whereKey($r->attributes->get('business')->id)->lockForUpdate()->firstOrFail();
                $record = $id ? $this->query($r)->findOrFail($id) : new ($this->model($r));
                if ($id) {
                    Gate::authorize('update', $record);
                } else {
                    Gate::authorize('create', [$this->model($r), $r->attributes->get('business')]);
                }
                $v = $r->validated();
                if ($record instanceof StaffMember && isset($v['userId']) && ! $r->attributes->get('business')->memberships()->where('user_id', $v['userId'])->exists()) {
                    throw ValidationException::withMessages(['userId' => ['error.validation']]);
                }
                $fields = match ($r->route('kind')) {
                    'customers' => ['name' => $v['name'], 'email' => $v['email'] ?? '', 'phone' => $v['phone'], 'notes' => $v['notes'] ?? '', 'fingerprint' => hash('sha256', mb_strtolower($v['name']).'|'.($v['email'] ?? '').'|'.preg_replace('/[^+0-9]/', '', $v['phone']))],
                    'services' => ['name' => $v['name'], 'description' => $v['description'] ?? '', 'duration_minutes' => $v['durationMinutes'], 'price_minor' => $v['priceMinor'], 'currency' => $v['currency'], 'active' => $v['active']],
                    'staff' => ['name' => $v['name'], 'email' => $v['email'], 'phone' => $v['phone'], 'active' => $v['active'], 'hours' => $v['hours'], ...array_key_exists('userId', $v) ? ['user_id' => $v['userId']] : []],
                };
                $record->fill($fields);
                $record->business_id = $r->attributes->get('business')->id;
                $record->save();
                $record->refresh();
                if ($record instanceof StaffMember) {
                    $record->services()->sync(array_fill_keys($v['serviceIds'], ['business_id' => $record->business_id]));
                    $record->unsetRelation('services');
                }
                app(DirectoryIntegrity::class)->check($record);

                return $record;
            }, 3);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['name' => ['error.duplicate']]);
        }

        return response()->json(['data' => DirectoryResource::data($record)], $id ? 200 : 201);
    }

    public function destroy(Request $r, string $id)
    {
        $record = $this->query($r)->findOrFail($id);
        Gate::authorize('delete', $record);
        DB::transaction(function () use ($record) {
            Business::whereKey($record->business_id)->lockForUpdate()->firstOrFail();
            $record->refresh();
            Gate::authorize('delete', $record);
            $record->update(['active' => false]);
            app(DirectoryIntegrity::class)->check($record);
        }, 3);

        return response()->noContent();
    }
}
