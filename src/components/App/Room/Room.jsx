import Button from "@material-ui/core/Button";
import VolumeOff from "@material-ui/icons/VolumeOff";
import VolumeUp from "@material-ui/icons/VolumeUp";
import Peer from "peerjs";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import alarm from "resources/sounds/alarm.mp3";
import click from "resources/sounds/click.mp3";
import io from "socket.io-client";
import uuid from "uuid";

import "styles/Room/Room.scss";
import useSound from "use-sound";
import Chat from "./Chat";

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
    name: localStorage.getItem("pomosync-username"),
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

  const [playClick] = useSound(click, { volume: 0.2 });
  const [playAlarm] = useSound(alarm, { volume: 0.2 });

  useEffect(() => {
    if (!currentUser.name)
      setCurrentUser((currentUser) => {
        return { ...currentUser, name: "Anonymous" };
      });
  }, [currentUser.name]);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_URL);
    setSocket(socket);
    const userPeer = new Peer(null);

    userPeer.on("open", (userId) => {
      setCurrentUser((currentUser) => {
        return { ...currentUser, id: userId };
      });
      socket.emit("join-room", roomId, userId, currentUser.name);
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
        return [...users, { id: userId, name: username }];
      });
      setConnections((connections) => [...connections, connection]);
      notifyChat(`${username} has arrived`);
    });

    socket.on("user-disconnected", (userId) => {
      setUsers((users) => {
        return users.filter((user) => user.id !== userId);
      });
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
      _id: uuid.v4(),
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
        connection.on("open", () => {
          sendUpdate(connection);
        });
      });
      return () => socket.off("update-user");
    }
  }, [timer, time, status, socket, connections, users, currentUser]);

  const sendToConnections = (data) => {
    connections.forEach((connection) => {
      connection.send(data);
    });
  };

  const handleConnectionMessage = (data) => {
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
        setTime({ minutes: 25, seconds: 0 });
      } else {
        setStatus("Short Break");
        setTime({ minutes: 5, seconds: 0 });
      }
      setPomoCount((pomoCount) => pomoCount + 1);
    } else {
      setStatus("Pomodoro");
      setTime({ minutes: 25, seconds: 0 });
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
    startTimer();
    if (connections.length > 0)
      sendToConnections({
        event: "start",
        time: time,
      });
  };

  const handleStop = () => {
    stopTimer();
    if (connections.length > 0)
      sendToConnections({
        event: "stop",
        time: time,
      });
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
      _id: uuid.v4(),
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
      <div className="spacing"></div>
      <div className="main-container">
        <div className="chat-container">
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

        <section>
          <p>CURRENTLY</p>
          <h3 style={{ fontSize: "3rem", marginTop: "1rem" }}>{status}</h3>
          <div>
            <Button
              size="large"
              className="color-white"
              onClick={handlePomodoro}
            >
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
            style={{
              fontSize: "7rem",
              marginTop: "20px",
              marginBottom: "3rem",
            }}
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
        </section>
        <div className="right-container">
          <div>
            <h2>Users</h2>

            <div>{currentUser.name}</div>
            {users.map((user) => (
              <div key={user.id}>{user.name}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
