<?php

namespace App\Observers;

use App\Models\CastMember;
use Bschmitt\Amqp\Message;

class CastMemberObserver
{
    public function created(CastMember $castMember)
    {
        $message = new Message($castMember->toJson());
        \Amqp::publish('model.castMember.created', $message);
    }

    public function updated(CastMember $castMember)
    {
        $message = new Message($castMember->toJson());
        \Amqp::publish('model.castMember.updated', $message);
    }

    public function deleted(CastMember $castMember)
    {
        $message = new Message($castMember->toJson());
        \Amqp::publish('model.castMember.deleted', $message);
    }

    public function restored(CastMember $castMember)
    {
        //
    }

    public function forceDeleted(CastMember $castMember)
    {
        //
    }
}
