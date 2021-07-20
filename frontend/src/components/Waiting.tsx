import {makeStyles, Typography} from "@material-ui/core";

const useStyles = makeStyles({
  root: {
    position: 'absolute',
    top: 0
  }
});

const Waiting = () => {
  const classes = useStyles();
  return (
    <Typography className={ classes.root }>Carregando..</Typography>
  );
};

export default Waiting;