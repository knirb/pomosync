import React, { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import { Button } from "@material-ui/core";
import { withStyles } from "@material-ui/core";

import "styles/Room/Room.scss";

const Room = ({
  match: {
    params: { roomId },
  },
}) => {
  const colors = {
    pomodoro: "#FC5242",
    shortBreak: "#5495F0",
    longBreak: "#444345",
  };
  const [time, setTime] = useState({
    minutes: 25,
    seconds: 0,
  });
  const [user, setUser] = useState();
  const [users, setUsers] = useState();
  const [connections, setConnections] = useState([]);
  const [currentColor, setCurrentColor] = useState(colors.pomodoro);
  const [timer, setTimer] = useState();
  const [status, setStatus] = useState("Pomodoro");
  const [pomoCount, setPomoCount] = useState(0);
  const [pomosPerSession, setPomosPerSession] = useState(4);
  const [socket, setSocket] = useState();

  useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_URL);
    const userPeer = new Peer(null, {
      host: "/",
      port: 3001,
    });
    userPeer.on("open", (userId) => {
      setUser(userId);
      socket.emit("join-room", roomId, userId);
      window.addEventListener("beforeunload", (ev) => {
        socket.emit("user-disconnect", roomId, userId);
      });
    });
    userPeer.on("connection", (incomingConnection) => {
      setConnections((connections) => [...connections, incomingConnection]);
    });

    socket.on("user-connected", async (userId) => {
      const connection = userPeer.connect(userId);
      console.log("Connectiong to user", connection.peer);
      setConnections((connections) => [...connections, connection]);
    });

    socket.on("user-disconnected", async (userId) => {
      setConnections((connections) => {
        const newConnections = connections.filter(
          (connection) => connection.peer !== userId
        );
        if (!connections) return [];
        else return newConnections;
      });
    });
  }, [roomId]);

  useEffect(() => {
    if (status === "Pomodoro") {
      document.body.style = `transition: 2s; background-color:${colors.pomodoro}`;
      setCurrentColor(colors.pomodoro);
    } else if (status === "Short Break") {
      document.body.style = `transition: 2s; background-color:${colors.shortBreak}`;
      setCurrentColor(colors.shortBreak);
    } else {
      document.body.style = `transition: 2s; background-color:${colors.longBreak}`;
      setCurrentColor(colors.longBreak);
    }
  }, [status]);

  useEffect(() => {
    setUsers(() => {
      let tmpUsers = [];
      connections.forEach((connection) => {
        tmpUsers = [...tmpUsers, connection.peer];
      });
      return tmpUsers;
    });
  }, [connections]);

  useEffect(() => {
    console.log("Did connections update", connections);
    if (connections.length > 0) {
      connections.forEach((connection) => {
        connection.on("data", (data) => {
          handleConnectionMessage(data);
        });
      });
    }
    return () =>
      connections.forEach((connection) => {
        connection.off("data");
      });
  }, [connections, timer]);

  const handleConnectionMessage = (data) => {
    console.log("Got some data");
    switch (data.event) {
      case "start":
        setTime(data.time);
        startTimer();
        return;
      case "stop":
        stopTimer();
        setTime(data.time);
        return;
      case "status":
        stopTimer();
        setStatus(data.status);
        setTime(data.time);
        return;
      default:
        return;
    }
  };
  const sendToConnections = (data) => {
    console.log("connections to send to:", connections);
    connections.forEach((connection) => {
      console.log("sending ", data, "to", connection);
      connection.send(data);
    });
  };

  const updateStatus = () => {
    if (status === "Pomodoro") {
      if ((pomoCount + 1) % pomosPerSession === 0) {
        setStatus("Long Break");
        setTime({ minutes: 0, seconds: 2 });
      } else {
        setStatus("Short Break");
        setTime({ minutes: 0, seconds: 1 });
      }
      setPomoCount((pomoCount) => pomoCount + 1);
    } else {
      setStatus("Pomodoro");
      setTime({ minutes: 0, seconds: 2 });
    }
  };

  useEffect(() => {
    if (time.minutes === 0 && time.seconds === 0 && timer) {
      clearInterval(timer);
      setTimer(null);
      updateStatus();
    }
    document.title = `Pomosync - ${time.minutes < 10 ? "0" : ""}${
      time.minutes
    }:${time.seconds < 10 ? "0" : ""}${time.seconds}`;
  }, [time]);

  const timerTick = () => {
    setTime((time) => {
      if (time.seconds === 0) {
        return { minutes: time.minutes - 1, seconds: 59 };
      } else {
        return { ...time, seconds: time.seconds - 1 };
      }
    });
  };

  const startTimer = () => {
    if (!timer) {
      setTimer(
        setInterval(() => {
          timerTick();
        }, 1000)
      );
    }
  };

  const stopTimer = () => {
    clearInterval(timer);
    setTimer(null);
  };

  const handleStart = () => {
    if (connections.length > 0)
      sendToConnections({
        event: "start",
        time: time,
      });
    startTimer();
  };

  const handleStop = () => {
    if (connections.length > 0)
      sendToConnections({
        event: "stop",
        time: time,
      });
    stopTimer();
  };

  const toggleTimer = () => {
    if (!timer) handleStart();
    else handleStop();
  };
  const handlePomodoro = () => {
    sendToConnections({
      event: "status",
      time: { minutes: 25, seconds: 0 },
      status: "Pomodoro",
    });
    stopTimer();
    setTime({ minutes: 25, seconds: 0 });
    setStatus("Pomodoro");
  };

  const handleShortBreak = () => {
    const newTime = { minutes: 5, seconds: 0 };
    sendToConnections({
      event: "status",
      time: newTime,
      status: "Short Break",
    });
    stopTimer();
    setTime(newTime);
    setStatus("Short Break");
  };

  const handleLongBreak = () => {
    const newTime = { minutes: 25, seconds: 0 };
    sendToConnections({
      event: "status",
      time: newTime,
      status: "Long Break",
    });
    stopTimer();
    setTime(newTime);
    setStatus("Long Break");
  };

  return (
    <div className="Room">
      <div className="spacing"></div>
      <p>CURRENTLY</p>
      <h3 style={{ fontSize: "3rem", marginTop: "1rem" }}>{status}</h3>
      <div>
        <Button size="large" className="color-white" onClick={handlePomodoro}>
          Pomodoro
        </Button>
        <Button size="large" className="color-white" onClick={handleShortBreak}>
          Short Break
        </Button>
        <Button size="large" className="color-white" onClick={handleLongBreak}>
          Long Break
        </Button>
      </div>
      <h2 style={{ fontSize: "7rem", marginTop: "20px", marginBottom: "3rem" }}>
        {time.minutes < 10 && "0"}
        {time.minutes}:{time.seconds < 10 && "0"}
        {time.seconds}
      </h2>

      <Button
        style={{
          backgroundColor: "white",
          color: `${currentColor}`,
          fontSize: "1.2rem",
          width: "10ch",
        }}
        size="large"
        onClick={toggleTimer}
      >
        {!timer ? "START" : "STOP"}
      </Button>
      <p>me: {user}</p>
      <p>{users && users.map((user) => `${user}, `)}</p>
    </div>
  );
};

export default Room;
