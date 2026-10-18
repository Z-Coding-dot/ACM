<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PublicContentController extends Controller
{
    public function published(Request $request)
    {
        $input = $request->validate(['locale' => ['required', Rule::in(['en', 'fa-AF'])]]);
        $content = DB::table('public_content')->where('locale', $input['locale'])->whereNotNull('published')->pluck('published', 'key');

        return response()->json(['data' => $content->all()])->header('Cache-Control', 'no-cache');
    }

    public function index(Request $request)
    {
        $input = $request->validate(['locale' => ['required', Rule::in(['en', 'fa-AF'])]]);

        return response()->json(['data' => DB::table('public_content')->where('locale', $input['locale'])->get()->map(fn ($row) => [
            'key' => $row->key, 'draft' => $row->draft, 'published' => $row->published, 'publishedAt' => $row->published_at,
        ]), 'keys' => array_keys(config('public-content'))]);
    }

    public function update(Request $request, string $key)
    {
        abort_unless(array_key_exists($key, config('public-content')), 404);
        $input = $request->validate(['locale' => ['required', Rule::in(['en', 'fa-AF'])], 'value' => ['required', 'string', 'max:5000'], 'publish' => ['required', 'boolean']]);
        preg_match_all('/{{\s*(\w+)\s*}}/', $input['value'], $matches);
        $expected = config('public-content')[$key];
        $actual = array_values(array_unique($matches[1]));
        sort($expected);
        sort($actual);
        if ($expected !== $actual) {
            throw ValidationException::withMessages(['value' => ['Content placeholders must match the original text.']]);
        }
        $attributes = ['draft' => $input['value'], 'updated_at' => now()];
        if ($input['publish']) {
            $attributes += ['published' => $input['value'], 'published_at' => now()];
        }
        DB::transaction(function () use ($key, $input, $attributes) {
            DB::table('public_content')->insertOrIgnore(['locale' => $input['locale'], 'key' => $key, 'draft' => $input['value'], 'created_at' => now(), 'updated_at' => now()]);
            DB::table('public_content')->where('locale', $input['locale'])->where('key', $key)->update($attributes);
        });

        return response()->noContent();
    }

    public function destroy(Request $request, string $key)
    {
        abort_unless(array_key_exists($key, config('public-content')), 404);
        $input = $request->validate(['locale' => ['required', Rule::in(['en', 'fa-AF'])]]);
        DB::table('public_content')->where('locale', $input['locale'])->where('key', $key)->delete();

        return response()->noContent();
    }

    public function pageView(Request $request)
    {
        $input = $request->validate(['path' => ['required', Rule::in(['/', '/about'])], 'locale' => ['required', Rule::in(['en', 'fa-AF'])]]);
        $where = ['day' => now()->toDateString(), 'path' => $input['path'], 'locale' => $input['locale']];
        DB::table('page_views')->insertOrIgnore([...$where, 'views' => 0]);
        DB::table('page_views')->where($where)->increment('views');

        return response()->noContent();
    }
}
