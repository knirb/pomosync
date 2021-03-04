import { createMuiTheme } from "@material-ui/core/styles";
const testTheme = createMuiTheme({
  overrides: {
    MuiInput: {
      underline: {
        "&:after": {
          borderBottom: "2px solid #fff",
        },
      },
    },
  },
  palette: {
    error: {
      main: "#fff",
    },
    primary: {
      main: "#fff",
    },
    pomodoro: {
      main: "#FC5242",
      contrastText: "#fff",
    },
    text: {
      primary: "#fff",
    },
  },
});
export default testTheme;
