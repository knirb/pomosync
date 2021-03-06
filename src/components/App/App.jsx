import { MuiThemeProvider } from "@material-ui/core";

import testTheme from "../../themes/testTheme";

import React from "react";
import { Route, Switch } from "react-router-dom";
import "styles/App.scss";
import Home from "./Home";
import Room from "./Room";
import Footer from "./Footer";

const App = () => {
  return (
    <div className="App">
      <MuiThemeProvider theme={testTheme}>
        <Switch>
          <Route path="/room/:roomId" component={Room} />
          <Route path="/" component={Home} />
        </Switch>
        <Footer />
      </MuiThemeProvider>
    </div>
  );
};

export default App;
