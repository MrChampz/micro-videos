import * as React from 'react';
import {useKeycloak} from "@react-keycloak/web";
import {Button} from "@material-ui/core";

const LoginButton = () => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized || keycloak.authenticated) {
    return null;
  }

  return <Button color="inherit">Login</Button>;
};

export default LoginButton;