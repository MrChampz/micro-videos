import React, { createRef, MutableRefObject, useCallback, useContext, useEffect, useRef } from 'react';
import { Card, CardContent, Checkbox, FormControlLabel, Grid, TextField, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { Controller, useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { omit, zipObject } from 'lodash';
import * as yup from '../../../util/vendor/yup';
import {  CastMember, Category, Genre, Response, Video, VideoFileFieldsMap } from '../../../util/models';
import { DefaultForm, SubmitActions } from '../../../components';
import VideoResource from '../../../util/http/video-resource';
import RatingField from './RatingField';
import UploadField from './UploadField';
import GenreField, { GenreFieldComponent } from './GenreField';
import CategoryField, { CategoryFieldComponent } from './CategoryField';
import CastMemberField, { CastMemberFieldComponent } from './CastMemberField';
import { InputFileComponent } from './InputFile';
import useSnackbarFormError from '../../../hooks/useSnackbarFormError';
import LoadingContext from '../../../components/LoadingProvider/LoadingContext';
import SnackbarUpload from '../../../components/SnackbarUpload';
import { Creators } from '../../../store/uploads';
import { FileInfo } from '../../../store/uploads/types';
import { useStyles } from './styles';

const validationSchema = yup.object().shape({
  title: yup
    .string()
    .label("Título")
    .max(255)
    .required(),
  description: yup
    .string()
    .label("Sinopse")
    .required(),
  year_launched: yup
    .number()
    .label("Ano de lançamento")
    .min(1)
    .required(),
  duration: yup
    .number()
    .label("Duração")
    .min(1)
    .required(),
  cast_members: yup
    .array()
    .label("Membros do elenco")
    .min(1)
    .required(),
  genres: yup
    .array()
    .label("Gêneros")
    .min(1)
    .required()
    .genreHasCategories(),
  categories: yup
    .array()
    .label("Categorias")
    .min(1)
    .required(),
  rating: yup
    .string()
    .label("Classificação")
    .required(),
});

const uploadFields = Object.keys(VideoFileFieldsMap);

interface VideoForm {
  title: string;
  description: string;
  year_launched: string | number;
  duration: string | number;
  cast_members: CastMember[];
  genres: Genre[];
  categories: Category[];
  rating: any;
  thumb_file: File | null;
  banner_file: File | null;
  trailer_file: File | null;
  video_file: File | null;
  opened: boolean;
}

const Form: React.FC = () => {
  const {
    register,
    getValues, 
    setValue,
    handleSubmit, 
    watch, 
    control, 
    reset,
    trigger,
    formState: { submitCount, errors }
  } = useForm<VideoForm>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      title: '',
      description: '',
      year_launched: '',
      duration: '',
      rating: null,
      cast_members: [],
      genres: [],
      categories: [],
      thumb_file: null,
      banner_file: null,
      trailer_file: null,
      video_file: null,
      opened: false
    }
  });
  useSnackbarFormError(submitCount, errors);

  const classes = useStyles();
  const router = useHistory();
  const dispatch = useDispatch();
  const { id } = useParams<{ id?: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isGreaterThanMd = useMediaQuery(theme.breakpoints.up('md'));
  const castMemberFieldRef = useRef() as MutableRefObject<CastMemberFieldComponent>;
  const genreFieldRef = useRef() as MutableRefObject<GenreFieldComponent>;
  const categoryFieldRef = useRef() as MutableRefObject<CategoryFieldComponent>;
  const uploadFieldsRef = useRef(
    zipObject(uploadFields, uploadFields.map(() => createRef()))
  ) as MutableRefObject<{ [key: string]: MutableRefObject<InputFileComponent> }>;

  const loading = useContext(LoadingContext);

  const resetForm = useCallback((data: any) => {
    Object.keys(uploadFieldsRef.current)
          .forEach(field => uploadFieldsRef.current[field].current.clear());
    castMemberFieldRef.current.clear();
    genreFieldRef.current.clear();
    categoryFieldRef.current.clear();
    reset(data);
  }, [uploadFieldsRef, castMemberFieldRef, genreFieldRef, categoryFieldRef, reset]);

  useEffect(() => {
    uploadFields.forEach((field: any) => {
      register(field, { setValueAs: value => value as File });
    });
  }, [register]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const { data } = await VideoResource.get<Response<Video>>(id);
        const video = data.data;
        resetForm({
          title: video.title,
          description: video.description,
          year_launched: video.year_launched,
          duration: video.duration,
          rating: video.rating,
          cast_members: video.cast_members,
          genres: video.genres,
          categories: video.categories,
          opened: video.opened,
          thumb_file: null,
          banner_file: null,
          trailer_file: null,
          video_file: null,
        });
      } catch(error) {
        console.error(error);
        enqueueSnackbar("Não foi possível carregar as informações", { variant: 'error' });
      }
    })();
  }, [id, resetForm, enqueueSnackbar]);

  const onSubmit = async (formData, event) => {
    const sendData = omit(formData, [...uploadFields]);
    sendData['cast_members'] = formData.cast_members.map(castMember => castMember.id);
    sendData['genres'] = formData.genres.map(genre => genre.id);
    sendData['categories'] = formData.categories.map(category => category.id);

    try {
      const promise = !id
        ?  VideoResource.create<Response<Video>>(sendData)
        :  VideoResource.update<Response<Video>>(id, sendData);

      const { data } = await promise;
  
      enqueueSnackbar("Vídeo salvo com sucesso", { variant: 'success' });
      uploadFiles(data.data);

      const formData = {
        title: data.data.title,
        description: data.data.description,
        year_launched: data.data.year_launched,
        duration: data.data.duration,
        rating: data.data.rating,
        cast_members: data.data.cast_members,
        genres: data.data.genres,
        categories: data.data.categories,
        opened: data.data.opened,
        thumb_file: null,
        banner_file: null,
        trailer_file: null,
        video_file: null,
      };
      id && resetForm(formData);

      setTimeout(() => {
        event ? (
          id ? router.replace(`/videos/${ data.data.id }/edit`)
             : router.push(`/videos/${ data.data.id }/edit`)
        ) : router.push('/videos');
      });
    } catch(error) {
      console.log(error);
      enqueueSnackbar("Não foi possível salvar o vídeo", { variant: 'error' });
    }
  }

  const uploadFiles = (video: Video) => {
    const files: FileInfo[] = uploadFields
      .filter(fileField => getValues()[fileField])
      .map(fileField => ({ fileField, file: getValues()[fileField]}));

    if (!files.length) return;

    dispatch(Creators.addUpload({ video, files }));

    enqueueSnackbar('', {
      key: 'snackbar-upload',
      persist: true,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right'
      },
      content: (key) => (
        <SnackbarUpload id={ key } />
      )
    });
  }

  return (
    <DefaultForm
      GridItemProps={{ xs: 12 }}
      onSubmit={ handleSubmit(onSubmit) }
    >
      <Grid container spacing={5}>
        <Grid item xs={12} md={6}>
          <Controller
            name="title"
            control={ control }
            render={({ field }) =>
              <TextField
                label="Título"
                fullWidth
                variant="outlined"
                error={ errors.title !== undefined }
                helperText={ errors.title && errors.title.message }
                disabled={ loading }
                InputLabelProps={{
                  shrink: id ? true : undefined
                }}
                { ...field } 
              />
            }
          />
          <Controller
            name="description"
            control={ control }
            render={({ field }) =>
              <TextField
                label="Sinopse"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                error={ errors.description !== undefined }
                helperText={ errors.description && errors.description.message }
                disabled={ loading }
                InputLabelProps={{
                  shrink: id ? true : undefined
                }}
                margin="normal"
                { ...field } 
              />
            }
          />
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Controller
                name="year_launched"
                control={ control }
                render={({ field }) =>
                  <TextField
                    label="Ano de lançamento"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={ errors.year_launched !== undefined }
                    helperText={ errors.year_launched && errors.year_launched.message }
                    disabled={ loading }
                    InputLabelProps={{
                      shrink: id ? true : undefined
                    }}
                    margin="normal"
                    { ...field } 
                  />
                }
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="duration"
                control={ control }
                render={({ field }) =>
                  <TextField
                    label="Duração"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={ errors.duration !== undefined }
                    helperText={ errors.duration && errors.duration.message }
                    disabled={ loading }
                    InputLabelProps={{
                      shrink: id ? true : undefined
                    }}
                    margin="normal"
                    { ...field } 
                  />
                }
              />
            </Grid>
            <Grid item xs>
              <Controller
                name="cast_members"
                defaultValue={[]}
                control={ control }
                render={({ field }) =>
                  <CastMemberField
                    ref={ castMemberFieldRef }
                    castMembers={ field.value }
                    setCastMembers={ castMembers => {
                      setValue('cast_members', castMembers, { shouldValidate: true });
                    }}
                    error={ errors.cast_members }
                    disabled={ loading }
                  />
                }
              />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="genres"
                    defaultValue={[]}
                    control={ control }
                    render={({ field }) =>
                      <GenreField
                        ref={ genreFieldRef }
                        genres={ field.value }
                        setGenres={ genres => {
                          setValue('genres', genres, { shouldValidate: true });
                        }}
                        categories={ watch('categories') }
                        setCategories={ categories => {
                          setValue('categories', categories, { shouldValidate: true });
                        }}
                        error={ errors.genres }
                        disabled={ loading }
                      />
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="categories"
                    defaultValue={[]}
                    control={ control }
                    render={({ field }) => 
                      <CategoryField
                        ref={ categoryFieldRef }
                        categories={ field.value }
                        setCategories={ categories => {
                          setValue('categories', categories, { shouldValidate: true });
                        }}
                        genres={ watch('genres') }
                        error={ errors.categories }
                        disabled={ loading }
                      />
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="rating"
            control={ control }
            render={({ field }) =>
              <RatingField
                setValue={(value) => setValue('rating', value)}
                error={ errors.rating }
                disabled={ loading }
                FormControlProps={{
                  margin: isGreaterThanMd ? 'none' : 'normal',
                }}
                { ...field }
              />
            }
          />
          <br/>
          <Card className={ classes.uploadCard }>
            <CardContent>
              <Typography variant="h6" color="primary">
                Imagens
              </Typography>
              <UploadField
                ref={ uploadFieldsRef.current['thumb_file'] }
                label="Thumb"
                accept="image/*"
                setValue={ value => setValue('thumb_file', value) }
              />
              <UploadField
                ref={ uploadFieldsRef.current['banner_file'] }
                label="Banner"
                accept="image/*"
                setValue={ value => setValue('banner_file', value) }
              />
            </CardContent>
          </Card>
          <Card className={ classes.uploadCard }>
            <CardContent>
              <Typography variant="h6" color="primary">
                Vídeos
              </Typography>
              <UploadField
                ref={ uploadFieldsRef.current['trailer_file'] }
                label="Trailer"
                accept="video/mp4"
                setValue={ value => setValue('trailer_file', value) }
              />
              <UploadField
                ref={ uploadFieldsRef.current['video_file'] }
                label="Principal"
                accept="video/mp4"
                setValue={ value => setValue('video_file', value) }
              />
            </CardContent>
          </Card>
          <br/>
          <Card className={ classes.openedCard }>
            <CardContent className={ classes.openedCardContent }>
              <Controller
                name="opened"
                control={ control }
                render={({ field }) =>
                  <FormControlLabel
                    label={
                      <Typography variant="subtitle2" color="primary">
                        Quero que este conteúdo apareça na seção lançamentos
                      </Typography>
                    }
                    labelPlacement="end"
                    disabled={ loading }
                    control={
                      <Checkbox
                        color="primary"
                        checked={ field.value }
                        { ...field }
                      />
                    }
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <SubmitActions
        disabled={ loading }
        onSave={() => {
          trigger().then(valid => {
            valid && onSubmit(getValues(), null);
          });
        }}
      />
    </DefaultForm>
  );
};

export default Form;