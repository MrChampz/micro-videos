import React from 'react';
import { AppBar, Toolbar, Typography } from '@material-ui/core';
import {useKeycloak} from "@react-keycloak/web";
import { useStyles } from './styles';
import logo from '../../static/img/logo.png';
import Menu from './Menu';
import LoginButton from "../LoginButton";
import UserAccountMenu from "./UserAccountMenu";

const Navbar: React.FC = () => {
  const classes = useStyles();
  const { keycloak } = useKeycloak();
  return keycloak.authenticated ? (
    <AppBar>
      <Toolbar className={ classes.toolbar }>
        <Menu />
        <Typography className={ classes.title }>
          <img src={ logo } alt="Codeflix" className={ classes.logo } />
        </Typography>
        <LoginButton />
        <UserAccountMenu />
      </Toolbar>
    </AppBar>
  ) : null;
};

export default Navbar;