import { useKeycloak } from "@react-keycloak/web";
import { Redirect, useLocation } from 'react-router-dom';
import { Waiting } from "../components";

const Login = () => {
  const { keycloak } = useKeycloak();
  const location = useLocation<{ from: { pathname: string }}>();

  const { from } = location.state || { from: { pathname: "/" }};

  if (keycloak!.authenticated === true) {
    return <Redirect to={ from } />
  }

  keycloak!.login({
    redirectUri: `${ window.location.origin }${ process.env.REACT_APP_BASENAME }${ from.pathname }`
  });

  return <Waiting />;
}

export default Login;