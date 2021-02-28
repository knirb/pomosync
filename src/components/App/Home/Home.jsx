import React, { useState, useEffect } from "react";
import { Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import http from "services/httpService";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

import "styles/Home/Home.scss";
import schema from "schema/homeSchema";

const Home = (props) => {
  const history = useHistory();
  const [state, setState] = useState({
    room: "",
    username: "",
  });
  const [errors, setErrors] = useState({
    room: "",
    username: "",
  });

  useEffect(() => {
    document.body.style = "background-color:#FC5242";
    const username = localStorage.getItem("pomosync-username");
    setState((state) => {
      return { ...state, username: username };
    });
  }, []);

  const handleChange = ({ currentTarget: input }) => {
    setState((state) => {
      return { ...state, [input.name]: input.value };
    });
  };
  const validateInput = (input) => {
    if (input.value.length > schema[input.name].maxLength.value)
      setErrors((errors) => {
        return {
          ...errors,
          [input.name]: schema[input.name].maxLength.message,
        };
      });
    else if (errors[input.name])
      setErrors((errors) => {
        return { ...errors, [input.name]: "" };
      });
  };

  const handleChange = ({ currentTarget: input }) => {
    validateInput(input);
    setState((state) => {
      return { ...state, [input.name]: input.value };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("pomosync-username", state.username);
    state.room ? history.push(`/room/${state.room}`) : createNewRoom();
  };

  return (
    <div className="Home">
      <h1 style={{ fontSize: "8rem", marginBottom: "2rem" }}>Pomosync</h1>
      <h2>Pomos are best with friends</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <div>
            <TextField
              className={`home-room-input`}
              name="username"
              error={errors.username ? true : false}
              helperText={errors.username}
              value={state.username}
              inputProps={{ style: { color: "white" } }}
              formHelperTextProps={{ style: { backgroundColor: "white" } }}
              placeholder="Username"
              onChange={handleChange}
              style={{ marginBottom: "1rem" }}
            />
          </div>
          <div>
            <TextField
              className={`home-room-input`}
              name="room"
              error={errors.room ? true : false}
              helperText={errors.room}
              value={state.room}
              inputProps={{ style: { color: "white" } }}
              formHelperTextProps={{ style: { color: "white" } }}
              placeholder="Room name"
              onChange={handleChange}
              style={{ marginBottom: "1rem" }}
            />
          </div>
        </div>

        <Button
          disabled={errors.room || errors.username}
          variant="contained"
          type="submit"
        >
          Join room
        </Button>
      </form>
    </div>
  );
};

export default Home;
