import React, { useState, useEffect } from "react";
import { Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import http from "services/httpService";
import "styles/Home/Home.scss";

const Home = () => {
  const history = useHistory();
  const [room, setRoom] = useState("public");
  const createNewRoom = async () => {
    const { data: res } = await http.get("/newroom");
    history.push(`/room/${res.room}`);
  };
  useEffect(() => {
    document.body.style = "background-color:#FC5242";
  }, []);
  return (
    <div className="Home">
      <h1 style={{ fontSize: "8rem", marginBottom: "2rem" }}>Pomosync</h1>
      <h2>Pomos are best with friends</h2>
      <Button variant="contained" onClick={createNewRoom}>
        New Room
      </Button>
      <Button variant="contained" onClick={() => history.push(`/room/${room}`)}>
        Join room
      </Button>
    </div>
  );
};

export default Home;
