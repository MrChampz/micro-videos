<?php

namespace App\Observers;

use Bschmitt\Amqp\Message;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SyncModelObserver
{
    public function created(Model $model)
    {
        $modelName = $this->getModelName($model);
        $action = __FUNCTION__;
        $routingKey = "model.{$modelName}.{$action}";
        $data = $model->toArray();

        try {
            $this->publish($routingKey, $data);
        } catch (\Exception $exception) {
            $this->reportException([
                'modelId' => $model->id,
                'modelName' => $modelName,
                'action' => $action,
                'originalException' => $exception
            ]);
        }
    }

    public function updated(Model $model)
    {
        $modelName = $this->getModelName($model);
        $action = __FUNCTION__;
        $routingKey = "model.{$modelName}.{$action}";
        $data = $model->toArray();

        try {
            $this->publish($routingKey, $data);
        } catch (\Exception $exception) {
            $this->reportException([
                'modelId' => $model->id,
                'modelName' => $modelName,
                'action' => $action,
                'originalException' => $exception
            ]);
        }
    }

    public function deleted(Model $model)
    {
        $modelName = $this->getModelName($model);
        $action = __FUNCTION__;
        $routingKey = "model.{$modelName}.{$action}";
        $data = ['id' => $model->id];

        try {
            $this->publish($routingKey, $data);
        } catch (\Exception $exception) {
            $this->reportException([
                'modelId' => $model->id,
                'modelName' => $modelName,
                'action' => $action,
                'originalException' => $exception
            ]);
        }
    }

    protected function getModelName(Model $model) {
        $reflection = new \ReflectionClass($model);
        $shortName = $reflection->getShortName();
        return Str::snake($shortName);
    }

    protected function publish($routingKey, array $data) {
        $message = new Message(
            json_encode($data),
            [
                'content_type' => 'application/json',
                'delivery_mode' => 2 // persistent
            ]
        );
        \Amqp::publish(
            $routingKey,
            $message,
            [
                'exchange_type' => 'topic',
                'exchange' => 'amq.topic'
            ]
        );
    }

    protected function reportException(array $params) {
        list(
            'modelId' => $modelId,
            'modelName' => $modelName,
            'action' => $action,
            'originalException' => $originalException
        ) = $params;
        $exception = new \Exception(
            "The model $modelName with ID $modelId not synced on $action",
            0,
            $originalException
        );
        report($exception);
    }
}
