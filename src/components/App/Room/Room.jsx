import { Button } from "@material-ui/core";
import Peer from "peerjs";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import io from "socket.io-client";
import { Container } from "@material-ui/core";
import Chat from "./Chat";

import "styles/Room/Room.scss";

const Room = ({
  match: {
    params: { roomId },
  },
  location: { state },
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
  const history = useHistory();
  const [currentUser, setCurrentUser] = useState({
    id: "",
    name: state ? state.username : "Anonymous",
  });
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [currentColor, setCurrentColor] = useState(colors.pomodoro);
  const [timer, setTimer] = useState();
  const [status, setStatus] = useState("Pomodoro");
  const [pomoCount, setPomoCount] = useState(0);
  const [pomosPerSession] = useState(4);
  const [socket, setSocket] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState([]);
  const [muted, setMuted] = useState(false);

  const [playClick] = useSound(click, { volume: 0.1 });
  const [playAlarm] = useSound(alarm, { volume: 0.1 });

  useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_URL);
    setSocket(socket);
    const userPeer = new Peer(null, {
      host: "/",
      port: 3001,
    });
    userPeer.on("open", (userId) => {
      setCurrentUser((currentUser) => {
        return { ...currentUser, id: userId };
      });
      socket.emit(
        "join-room",
        roomId,
        userId,
        state ? state.username : "Anonymous"
      );
      window.addEventListener("beforeunload", (ev) => {
        socket.emit("user-disconnect", roomId, userId);
      });
    });

    userPeer.on("connection", (incomingConnection) => {
      setConnections((connections) => [...connections, incomingConnection]);
    });

    socket.on("user-connected", (userId, username) => {
      const connection = userPeer.connect(userId);
      setUsers((users) => {
        console.log(users);
        return [...users, { id: userId, name: username }];
      });
      setConnections((connections) => [...connections, connection]);
      notifyChat(`${username} has arrived`);
    });

    socket.on("user-disconnected", (userId) => {
      setConnections((connections) => {
        const newConnections = connections.filter(
          (connection) => connection.peer !== userId
        );
        if (!connections) {
          return [];
        } else return newConnections;
      });
    });
  }, [roomId]);

  const notifyChat = (message) => {
    const notification = {
      content: message,
      type: "notification",
    };
    setMessages((messages) => [...messages, notification]);
  };

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

  useEffect(() => {
    const sendUpdate = (connection) => {
      console.log("sending update");
      console.log(timer, time, status);
      const tmpUsers = users.filter((user) => user.id !== connection.peer);
      connection.send({
        event: "update",
        time: time,
        timer: timer,
        status: status,
        users: [currentUser, ...tmpUsers],
      });
    };
    if (socket) {
      socket.on("update-user", (user) => {
        const connection = connections.find(
          (connection) => connection.peer === user
        );
        console.log("Connection", connection);
        connection.on("open", () => {
          sendUpdate(connection);
        });
      });
      return () => socket.off("update-user");
    }
  }, [timer, time, status, socket, connections, users]);

  const sendToConnections = (data) => {
    connections.forEach((connection) => {
      connection.send(data);
    });
  };

  const handleConnectionMessage = (data) => {
    console.log("Got some data");
    switch (data.event) {
      case "start":
        setTime(data.time);
        if (!muted) playClick();
        startTimer();
        return;
      case "stop":
        stopTimer();
        if (!muted) playClick();

        setTime(data.time);
        return;
      case "status":
        stopTimer();
        setStatus(data.status);
        setTime(data.time);
        return;
      case "update":
        console.log("recieved update:", data);
        setTime(data.time);
        if (data.timer) startTimer();
        setStatus(data.status);
        setUsers([...data.users]);
        return;
      case "message":
        setMessages((messages) => [...messages, data.message]);
        return;
      default:
        return;
    }
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
      if (!muted) playAlarm();
      clearInterval(timer);
      setTimer(null);
      updateStatus();
    }
    document.title = `${time.minutes < 10 ? "0" : ""}${time.minutes}:${
      time.seconds < 10 ? "0" : ""
    }${time.seconds} - ${status}`;
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
    if (!muted) playClick();
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

  const sendMessage = (text) => {
    const message = {
      sender: currentUser.name,
      content: text,
      type: "message",
    };
    sendToConnections({
      event: "message",
      message: message,
    });
    setMessages((messages) => [...messages, message]);
  };

  return (
    <div className="Room">
      <Container>
        <div className="spacing"></div>
          <div className="top-left-button-container">
            <Button
              style={{
                backgroundColor: "white",
                color: `${currentColor}`,
                fontSize: "1rem",
                width: "10ch",
                transition: "2s",
              }}
              onClick={() =>
                history.push({
                  pathname: "/",
                  state: {
                    username: currentUser.name,
                    room: roomId,
                  },
                })
              }
            >
              Back
            </Button>
            <Button onClick={() => setMuted(!muted)}>
              {muted ? (
                <VolumeOff style={{ color: "white" }} />
              ) : (
                <VolumeUp style={{ color: "white" }} />
              )}
            </Button>
          </div>
          <h2>Chat</h2>
          <Button
            onClick={() => setShowChat(!showChat)}
            style={{ color: "white" }}
          >
            Toggle Chat
          </Button>
          {showChat && (
            <Chat
              users={[currentUser, ...users]}
              messages={messages}
              onSubmit={sendMessage}
            />
          )}
        </div>
        <p>CURRENTLY</p>
        <h3 style={{ fontSize: "3rem", marginTop: "1rem" }}>{status}</h3>
        <div>
          <Button size="large" className="color-white" onClick={handlePomodoro}>
            Pomodoro
          </Button>
          <Button
            size="large"
            className="color-white"
            onClick={handleShortBreak}
          >
            Short Break
          </Button>
          <Button
            size="large"
            className="color-white"
            onClick={handleLongBreak}
          >
            Long Break
          </Button>
        </div>
        <h2
          style={{ fontSize: "7rem", marginTop: "20px", marginBottom: "3rem" }}
        >
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
            transition: "2s",
          }}
          size="large"
          onClick={toggleTimer}
        >
          {!timer ? "START" : "STOP"}
        </Button>
        <p>me: {username}</p>
        <p>{users && users.map((user) => user.name && `${user.name}, `)}</p>
        <Chat
          users={[{ id: user, name: username }, ...users]}
          messages={messages}
        />
      </Container>
    </div>
  );
};

export default Room;
