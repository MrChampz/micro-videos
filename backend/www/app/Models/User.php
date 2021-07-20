<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Contracts\Auth\Authenticatable;

class User implements Authenticatable
{
    protected $id;
    protected $name;
    protected $email;
    protected $token;

    public function __construct(string $id, string $name, string $email, string $token)
    {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->token = $token;
    }

    public function getAuthIdentifier(): string
    {
        return $this->id;
    }

    public function getAuthIdentifierName(): string
    {
        return $this->email;
    }

    public function getAuthPassword()
    {
        throw new \Exception("Not implemented");
    }

    public function getRememberToken()
    {
        throw new \Exception("Not implemented");
    }

    public function setRememberToken($value)
    {
        throw new \Exception("Not implemented");
    }

    public function getRememberTokenName()
    {
        throw new \Exception("Not implemented");
    }
}
