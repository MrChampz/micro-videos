import React, { useCallback } from "react";
import { Route, Redirect } from "react-router";
import { RouteComponentProps, RouteProps } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>
}

export const PrivateRoute: React.FC<PrivateRouteProps> = (props) => {
  const { component: Component, ...routeProps } = props;
  const { keycloak } = useKeycloak();

  const render = useCallback((props) => {
    if (keycloak.authenticated) {
      return <Component { ...props } />
    }

    return <Redirect to={{
      pathname: "/login",
      state: { from: props.location }
    }} />;
  }, [
    keycloak.authenticated,
    Component
  ]);

  return <Route { ...routeProps } render={ render } />
}