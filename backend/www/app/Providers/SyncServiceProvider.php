<?php

namespace App\Providers;

use App\Models\CastMember;
use App\Models\Category;
use App\Models\Genre;
use App\Observers\SyncModelObserver;
use Illuminate\Support\ServiceProvider;

class SyncServiceProvider extends ServiceProvider
{
    public function register() {}

    public function boot()
    {
        if(env('RABBITMQ_SYNC_ENABLED') !== true){
            return;
        }

        Category::observe(SyncModelObserver::class);
        Genre::observe(SyncModelObserver::class);
        CastMember::observe(SyncModelObserver::class);
    }
}
