import React from 'react';
import { Route as PublicRoute, Switch } from 'react-router-dom';
import { useKeycloak } from "@react-keycloak/web";

import routes from './';
import { Waiting } from "../components";
import { PrivateRoute } from "./PrivateRoute";

const Router: React.FC = () => {
  const { initialized } = useKeycloak();

  if (!initialized) {
    return <Waiting />;
  }

  return (
    <Switch>
      { routes.map((route, key) => {
        const Route = route.auth === true ? PrivateRoute : PublicRoute;
        return <Route key={ key } { ...route } />;
      })}
    </Switch>
  );
}

export default Router;
