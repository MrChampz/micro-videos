import { RouteComponentProps, RouteProps as RouterRouteProps } from 'react-router-dom';
import {
  Dashboard,
  CategoryList,
  CategoryForm,
  CastMemberList,
  CastMemberForm,
  GenreList,
  GenreForm,
  VideoList,
  VideoForm,
  Uploads,
  Login
} from '../pages';
import React from "react";

export interface RouteProps extends RouterRouteProps {
  name: string;
  label: string;
  auth?: boolean;
  component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>
}

const routes: RouteProps[] = [
  {
    name: 'login',
    label: 'Login',
    path: '/login',
    component: Login,
    exact: true,
    auth: false
  },
  {
    name: 'dashboard',
    label: 'Dashboard',
    path: '/',
    component: Dashboard,
    exact: true,
    auth: true
  },
  {
    name: 'categories.list',
    label: 'Listar categorias',
    path: '/categories',
    component: CategoryList,
    exact: true,
    auth: true
  },
  {
    name: 'categories.create',
    label: 'Criar categoria',
    path: '/categories/create',
    component: CategoryForm,
    exact: true,
    auth: true
  },
  {
    name: 'categories.edit',
    label: 'Editar categoria',
    path: '/categories/:id/edit',
    component: CategoryForm,
    exact: true,
    auth: true
  },
  {
    name: 'cast_members.list',
    label: 'Listar membros de elencos',
    path: '/cast_members',
    component: CastMemberList,
    exact: true,
    auth: true
  },
  {
    name: 'cast_members.create',
    label: 'Criar membro de elenco',
    path: '/cast_members/create',
    component: CastMemberForm,
    exact: true,
    auth: true
  },
  {
    name: 'cast_members.edit',
    label: 'Editar membro de elenco',
    path: '/cast_members/:id/edit',
    component: CastMemberForm,
    exact: true,
    auth: true
  },
  {
    name: 'genres.list',
    label: 'Listar gêneros',
    path: '/genres',
    component: GenreList,
    exact: true,
    auth: true
  },
  {
    name: 'genres.create',
    label: 'Criar gênero',
    path: '/genres/create',
    component: GenreForm,
    exact: true,
    auth: true
  },
  {
    name: 'genres.edit',
    label: 'Editar gênero',
    path: '/genres/:id/edit',
    component: GenreForm,
    exact: true,
    auth: true
  },
  {
    name: 'videos.list',
    label: 'Listar vídeos',
    path: '/videos',
    component: VideoList,
    exact: true,
    auth: true
  },
  {
    name: 'videos.create',
    label: 'Criar vídeo',
    path: '/videos/create',
    component: VideoForm,
    exact: true,
    auth: true
  },
  {
    name: 'videos.edit',
    label: 'Editar vídeo',
    path: '/videos/:id/edit',
    component: VideoForm,
    exact: true,
    auth: true
  },
  {
    name: 'uploads',
    label: 'Uploads',
    path: '/uploads',
    component: Uploads,
    exact: true,
    auth: true
  },
];

export default routes;