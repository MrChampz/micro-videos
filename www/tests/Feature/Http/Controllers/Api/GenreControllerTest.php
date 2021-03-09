<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Http\Controllers\Api\GenreController;
use App\Models\Category;
use App\Models\Genre;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\Request;
use Tests\Exceptions\TestException;
use Tests\TestCase;
use Tests\Traits\TestSaves;
use Tests\Traits\TestValidations;

class GenreControllerTest extends TestCase
{
    use DatabaseMigrations, TestValidations, TestSaves;

    private $genre;
    private $sendData;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sendData = [
            'name' => 'test'
        ];
        $this->genre = Genre::factory()->create([
            'is_active' => true
        ]);
    }

    public function testIndex()
    {
        $response = $this->get(route('genres.index'));

        $response
            ->assertStatus(200)
            ->assertJson([$this->genre->toArray()]);
    }

    public function testShow()
    {
        $response = $this->get(route(
            'genres.show',
            ['genre' => $this->genre->id]
        ));

        $response
            ->assertStatus(200)
            ->assertJson($this->genre->toArray());
    }

    public function testSave()
    {
        $category = Category::factory()->create();

        $data = [
            [
                'send_data' => $this->sendData + [
                    'categories' => [$category->id]
                ],
                'test_data' => $this->sendData + ['is_active' => true]
            ],
            [
                'send_data' => $this->sendData + [
                    'is_active' => true,
                    'categories' => [$category->id]
                ],
                'test_data' => $this->sendData + ['is_active' => true]
            ],
            [
                'send_data' => $this->sendData + [
                    'is_active' => false,
                    'categories' => [$category->id]
                ],
                'test_data' => $this->sendData + ['is_active' => false]
            ]
        ];

        foreach ($data as $key => $value) {
            $response = $this->assertStore(
                $value['send_data'],
                $value['test_data'] + ['deleted_at' => null]
            );
            $response->assertJsonStructure([
                'created_at',
                'updated_at'
            ]);
            $response = $this->assertUpdate(
                $value['send_data'],
                $value['test_data'] + ['deleted_at' => null]
            );
            $response->assertJsonStructure([
                'created_at',
                'updated_at'
            ]);
        }
    }

    public function testRollbackStore()
    {
        $controller = \Mockery::mock(GenreController::class)
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();
        $controller
            ->shouldReceive('validate')
            ->withAnyArgs()
            ->andReturn($this->sendData);
        $controller
            ->shouldReceive('rulesStore')
            ->withAnyArgs()
            ->andReturn([]);
        $controller
            ->shouldReceive('handleRelations')
            ->once()
            ->andThrow(new TestException());

        $request = \Mockery::mock(Request::class);

        try {
            $controller->store($request);
        } catch (TestException $exception) {
            $this->assertCount(1, Genre::all());
        }
    }

    public function testDestroy()
    {
        $response = $this->json(
            'DELETE',
            route('genres.destroy', ['genre' => $this->genre->id]),
            []
        );

        $response->assertNoContent();
        $this->assertNull(Genre::find($this->genre->id));
        $this->assertNotNull(Genre::withTrashed()->find($this->genre->id));
    }

    public function testInvalidationRequired()
    {
        $data = ['name' => ''];
        $this->assertInvalidationInStoreAction($data, 'required');
        $this->assertInvalidationInUpdateAction($data, 'required');
    }

    public function testInvalidationMax()
    {
        $data = ['name' => str_repeat('a', 256)];
        $this->assertInvalidationInStoreAction($data, 'max.string', ['max' => 255]);
        $this->assertInvalidationInUpdateAction($data, 'max.string', ['max' => 255]);
    }

    public function testInvalidationBoolean()
    {
        $data = ['is_active' => 'a'];
        $this->assertInvalidationInStoreAction($data, 'boolean');
        $this->assertInvalidationInUpdateAction($data, 'boolean');
    }

    public function testInvalidationCategoriesField()
    {
        $data = ['categories' => 'a'];
        $this->assertInvalidationInStoreAction($data, 'array');
        $this->assertInvalidationInUpdateAction($data, 'array');

        $data = ['categories' => [100]];
        $this->assertInvalidationInStoreAction($data, 'exists');
        $this->assertInvalidationInUpdateAction($data, 'exists');
    }

    protected function routeStore()
    {
        return route('genres.store');
    }

    protected function routeUpdate()
    {
        return route('genres.update', ['genre' => $this->genre->id]);
    }

    protected function model()
    {
        return Genre::class;
    }
}
