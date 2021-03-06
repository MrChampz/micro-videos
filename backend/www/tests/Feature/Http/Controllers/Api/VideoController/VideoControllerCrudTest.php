<?php

namespace Tests\Feature\Http\Controllers\Api\VideoController;

use App\Http\Resources\VideoResource;
use App\Models\Category;
use App\Models\Genre;
use App\Models\Video;
use Illuminate\Support\Arr;
use Tests\Traits\TestResources;
use Tests\Traits\TestSaves;
use Tests\Traits\TestValidations;

class VideoControllerCrudTest extends BaseVideoControllerTestCase
{
    use TestValidations, TestSaves, TestResources;

    private $serializedFields = [
        'id',
        'title',
        'description',
        'year_launched',
        'opened',
        'rating',
        'duration',
        'categories' => [
            '*' => [
                'id',
                'name',
                'description',
                'is_active',
                'created_at',
                'updated_at',
                'deleted_at',
            ]
        ],
        'genres' => [
            '*' => [
                'id',
                'name',
                'is_active',
                'created_at',
                'updated_at',
                'deleted_at'
            ]
        ],
        'cast_members' => [
            '*' => [
                'id',
                'name',
                'type',
                'created_at',
                'updated_at',
                'deleted_at'
            ]
        ],
        'video' => [
            'name',
            'url'
        ],
        'trailer' => [
            'name',
            'url'
        ],
        'thumb' => [
            'name',
            'url'
        ],
        'banner' => [
            'name',
            'url'
        ],
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function testIndex()
    {
        $response = $this->get(route('videos.index'));

        $response
            ->assertStatus(200)
            ->assertJson([
                'meta' => ['per_page' => 15],
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => $this->serializedFields,
                ],
                'links' => [],
                'meta' => [],
            ]);

        $resource = VideoResource::collection(collect([$this->video]));
        $this->assertResource($response, $resource);
    }

    public function testShow()
    {
        $response = $this->get(route(
            'videos.show',
            ['video' => $this->video->id]
        ));

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => $this->serializedFields
            ]);

        $id = $response->json('data.id');
        $resource = new VideoResource(Video::find($id));
        $this->assertResource($response, $resource);
    }

    public function testSaveWithoutFiles()
    {
        $testData = Arr::except($this->sendData, ['categories', 'genres', 'cast_members']);
        $data = [
            [
                'send_data' => $this->sendData,
                'test_data' => $testData + ['opened' => false]
            ],
            [
                'send_data' => $this->sendData + [
                    'opened' => true
                ],
                'test_data' => $testData + ['opened' => true]
            ],
            [
                'send_data' => $this->sendData + [
                    'rating' => Video::RATING_LIST[1]
                ],
                'test_data' => $testData + ['rating' => Video::RATING_LIST[1]]
            ]
        ];

        foreach ($data as $key => $value) {
            $response = $this->assertStore(
                $value['send_data'],
                $value['test_data'] + ['deleted_at' => null]
            );
            $id = $response->json('data.id');
            
            $response->assertStatus(201);
            $response->assertJsonStructure([
                'data' => $this->serializedFields
            ]);

            $this->assertHasCategory($id, $value['send_data']['categories'][0]);
            $this->assertHasGenre($id, $value['send_data']['genres'][0]);

            $response = $this->assertUpdate(
                $value['send_data'],
                $value['test_data'] + ['deleted_at' => null]
            );
            $id = $response->json('data.id');
            
            $response->assertStatus(200);
            $response->assertJsonStructure([
                'data' => $this->serializedFields
            ]);

            $this->assertHasCategory($id, $value['send_data']['categories'][0]);
            $this->assertHasGenre($id, $value['send_data']['genres'][0]);
        }
    }

    public function testDestroy()
    {
        $response = $this->json(
            'DELETE',
            route('videos.destroy', ['video' => $this->video->id]),
            []
        );

        $response->assertNoContent();
        $this->assertNull(Video::find($this->video->id));
        $this->assertNotNull(Video::withTrashed()->find($this->video->id));
    }

    public function testInvalidationRequired()
    {
        $data = [
            'title' => '',
            'description' => '',
            'year_launched' => '',
            'rating' => '',
            'duration' => '',
            'categories' => '',
            'genres' => ''
        ];
        $this->assertInvalidationInStoreAction($data, 'required');
        $this->assertInvalidationInUpdateAction($data, 'required');
    }

    public function testInvalidationMax()
    {
        $data = ['title' => str_repeat('a', 256)];
        $this->assertInvalidationInStoreAction($data, 'max.string', ['max' => 255]);
        $this->assertInvalidationInUpdateAction($data, 'max.string', ['max' => 255]);
    }

    public function testInvalidationInteger()
    {
        $data = ['duration' => 'a'];
        $this->assertInvalidationInStoreAction($data, 'integer');
        $this->assertInvalidationInUpdateAction($data, 'integer');
    }

    public function testInvalidationBoolean()
    {
        $data = ['opened' => 'a'];
        $this->assertInvalidationInStoreAction($data, 'boolean');
        $this->assertInvalidationInUpdateAction($data, 'boolean');
    }

    public function testInvalidationYearLaunchedField()
    {
        $data = ['year_launched' => 'a'];
        $this->assertInvalidationInStoreAction($data, 'date_format', ['format' => 'Y']);
        $this->assertInvalidationInUpdateAction($data, 'date_format', ['format' => 'Y']);
    }

    public function testInvalidationRatingField()
    {
        $data = ['rating' => 0];
        $this->assertInvalidationInStoreAction($data, 'in');
        $this->assertInvalidationInUpdateAction($data, 'in');
    }

    public function testInvalidationCategoriesField()
    {
        $data = ['categories' => 'a'];
        $this->assertInvalidationInStoreAction($data, 'array');
        $this->assertInvalidationInUpdateAction($data, 'array');

        $data = ['categories' => [100]];
        $this->assertInvalidationInStoreAction($data, 'exists');
        $this->assertInvalidationInUpdateAction($data, 'exists');

        $category = Category::factory()->create();
        $category->delete();
        $data = ['categories' => [$category->id]];
        $this->assertInvalidationInStoreAction($data, 'exists');
        $this->assertInvalidationInUpdateAction($data, 'exists');
    }

    public function testInvalidationGenresField()
    {
        $data = ['genres' => 'a'];
        $this->assertInvalidationInStoreAction($data, 'array');
        $this->assertInvalidationInUpdateAction($data, 'array');

        $data = ['genres' => [100]];
        $this->assertInvalidationInStoreAction($data, 'exists');
        $this->assertInvalidationInUpdateAction($data, 'exists');

        $genre = Genre::factory()->create();
        $genre->delete();
        $data = ['genres' => [$genre->id]];
        $this->assertInvalidationInStoreAction($data, 'exists');
        $this->assertInvalidationInUpdateAction($data, 'exists');
    }

    protected function assertHasCategory($videoId, $categoryId)
    {
        $this->assertDatabaseHas('category_video', [
            'video_id' => $videoId,
            'category_id' => $categoryId
        ]);
    }

    protected function assertHasGenre($videoId, $genreId)
    {
        $this->assertDatabaseHas('genre_video', [
            'video_id' => $videoId,
            'genre_id' => $genreId
        ]);
    }

    protected function routeStore()
    {
        return route('videos.store');
    }

    protected function routeUpdate()
    {
        return route('videos.update', ['video' => $this->video->id]);
    }

    protected function model()
    {
        return Video::class;
    }
}
