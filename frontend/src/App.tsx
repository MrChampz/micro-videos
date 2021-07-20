import React from 'react';
import { Box, CssBaseline, MuiThemeProvider } from '@material-ui/core';
import { BrowserRouter } from 'react-router-dom';
import { ReactKeycloakProvider } from "@react-keycloak/web";

import { Navbar, Breadcrumbs, SnackbarProvider, LoadingProvider, Spinner } from './components';
import { keycloak, keycloakConfig } from "./util/auth";
import Router from './routes/Router';
import theme from './theme';

const App: React.FC = () => {
  return (
    <ReactKeycloakProvider authClient={ keycloak } initOptions={ keycloakConfig }>
      <MuiThemeProvider theme={ theme }>
        <LoadingProvider>
          <SnackbarProvider>
            <CssBaseline />
            <BrowserRouter basename={ process.env.REACT_APP_BASENAME }>
              <Spinner />
              <Navbar />
              <Box paddingTop="70px">
                <Breadcrumbs />
                <Router />
              </Box>
            </BrowserRouter>
          </SnackbarProvider>
        </LoadingProvider>
      </MuiThemeProvider>
    </ReactKeycloakProvider>
  );
}

export default App;
