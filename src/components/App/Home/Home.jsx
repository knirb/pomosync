import React, { useState, useEffect } from "react";
import { Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import http from "services/httpService";
import { TextField } from "@material-ui/core";

import "styles/Home/Home.scss";

const Home = () => {
  const history = useHistory();
  const [state, setState] = useState({
    room: "",
    username: "",
  });
  const createNewRoom = async () => {
    const { data: res } = await http.get("/newroom");
    history.push(`/room/${res.room}`);
  };
  useEffect(() => {
    document.body.style = "background-color:#FC5242";
  }, []);

  const handleChange = ({ currentTarget: input }) => {
    setState((state) => {
      return { ...state, [input.name]: input.value };
    });
  };
  return (
    <div className="Home">
      <h1 style={{ fontSize: "8rem", marginBottom: "2rem" }}>Pomosync</h1>
      <h2>Pomos are best with friends</h2>
      <div>
        <div>
          <TextField
            className={`home-room-input`}
            name="username"
            value={state.username}
            inputProps={{ style: { color: "white" } }}
            color="secondary"
            placeholder="Username"
            onChange={handleChange}
            style={{ marginBottom: "1rem" }}
          />
        </div>
        <TextField
          className={`home-room-input`}
          name="room"
          value={state.room}
          inputProps={{ style: { color: "white" } }}
          color="secondary"
          placeholder="Room name"
          onChange={handleChange}
          style={{ marginBottom: "1rem" }}
        />
      </div>
      <Button
        variant="contained"
        onClick={
          state.room
            ? () =>
                history.push({
                  pathname: `/room/${state.room}`,
                  state: {
                    username: state.username,
                  },
                })
            : createNewRoom
        }
      >
        New Room
      </Button>
      <Button
        variant="contained"
        onClick={
          state.room ? () => history.push(`/room/${state.room}`) : () => {}
        }
      >
        Join room
      </Button>
    </div>
  );
};

export default Home;
