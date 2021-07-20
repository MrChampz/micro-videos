import React, {useCallback, useEffect, useState} from 'react';
import {Divider, Menu, MenuItem, Link, Button} from '@material-ui/core';
import AccountCircle from "@material-ui/icons/AccountCircle";
import {useKeycloak} from "@react-keycloak/web";
import {useStyles} from "./styles";
import {capitalize} from "../../util/string";

const UserAccountMenu: React.FC = () => {
  const classes = useStyles();
  const { keycloak, initialized } = useKeycloak();
  const { loadUserProfile } = keycloak;

  const [userName, setUserName] = useState("Carregando...");
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const loadUserName = useCallback(() => {
    loadUserProfile()
      .then(profile => {
        let name = capitalize(profile.firstName!);
        name = profile.lastName
          ? `${name} ${capitalize(profile.lastName.substr(0, 1))}.`
          : name;
        setUserName(name);
      })
      .catch(() => {
        setUserName("Erro..");
      });
  }, [loadUserProfile]);

  useEffect(() => {
    loadUserName();
  }, [loadUserName]);

  const handleOpen = (event: any) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  if (!initialized || !keycloak.authenticated) {
    return null;
  }

  return (
    <React.Fragment>
      <Button
        color="inherit"
        variant="text"
        startIcon={ <AccountCircle /> }
        aria-label="abrir menu do usuário"
        aria-controls="user-account-menu-appbar"
        aria-haspopup="true"
        onClick={ handleOpen }
        classes={{
          label: classes.username
        }}
      >
        { userName }
      </Button>
      <Menu
        id="user-account-menu-appbar"
        open={ open }
        anchorEl={ anchorEl }
        onClose={ handleClose }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        getContentAnchorEl={ null }
      >
        <MenuItem disabled>{ userName }</MenuItem>
        <Divider />
        <MenuItem
          component={Link}
          href="http://"
          rel="noopener"
          target="_blank"
          color="textPrimary"
          onClick={handleClose}
        >
          Auth. Admin.
        </MenuItem>
        <MenuItem
          component={Link}
          href="http://"
          rel="noopener"
          target="_blank"
          color="textPrimary"
          onClick={handleClose}
        >
          Minha conta
        </MenuItem>
        <MenuItem>Logout</MenuItem>
      </Menu>
    </React.Fragment>
  );
}
 
export default UserAccountMenu;