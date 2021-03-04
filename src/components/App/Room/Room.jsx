import Button from "@material-ui/core/Button";
import VolumeOff from "@material-ui/icons/VolumeOff";
import VolumeUp from "@material-ui/icons/VolumeUp";
import Peer from "peerjs";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import alarm from "resources/sounds/alarm.mp3";
import click from "resources/sounds/click.mp3";
import io from "socket.io-client";
import { calcEndTime, calcTimeLeft } from "../../../functions/timeFunctions";

import "styles/Room/Room.scss";
import useSound from "use-sound";
import uuid from "uuid";
import Chat from "./Chat";
import BackButton from "./BackButton/BackButton";
import StartButton from "./StartButtton/index";
import Fireworks from "./Fireworks/Fireworks";

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

  const history = useHistory();

  const [connections, setConnections] = useState([]);
  const [currentColor, setCurrentColor] = useState(colors.pomodoro);
  const [showFireworks, setShowFireworks] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: "",
    name: localStorage.getItem("pomosync-username"),
  });
  const [messages, setMessages] = useState([]);
  const [muted, setMuted] = useState(false);
  const [pomoCount, setPomoCount] = useState(0);
  const [pomosPerSession] = useState(4);
  const [showChat, setShowChat] = useState(true);
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("Pomodoro");
  const [time, setTime] = useState({
    minutes: 25,
    seconds: 0,
  });
  const [timer, setTimer] = useState();
  const [users, setUsers] = useState([]);
  const [pomoLength, setPomoSessionLength] = useState({
    minutes: 25,
    seconds: 0,
  });
  const [shortBreakLength, setShortBreakLength] = useState({
    minutes: 5,
    seconds: 0,
  });

  const [longBreakLength, setLongBreakLength] = useState({
    minutes: 25,
    seconds: 0,
  });

  const chatScrollHelper = useRef(null);

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
        pomoCount: pomoCount,
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
  }, [timer, time, status, socket, connections, users, currentUser, pomoCount]);

  useEffect(() => {
    chatScrollHelper.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }, [messages]);

  useEffect(() => {
    if (time.minutes <= 0 && time.seconds <= 0 && timer) {
      if (!muted) playAlarm();
      stopTimer();
      updateStatus();
    }
  }, [time, muted]);

  useEffect(() => {
    document.title = `${time.minutes < 10 ? "0" : ""}${time.minutes}:${
      time.seconds < 10 ? "0" : ""
    }${time.seconds} - ${status}`;
  }, [time, status]);

  const notifyChat = (message) => {
    const notification = {
      _id: uuid.v4(),
      content: message,
      type: "notification",
    };
    setMessages((messages) => [...messages, notification]);
  };

  const sendToConnections = (data) => {
    connections.forEach((connection) => {
      connection.send(data);
    });
  };

  const handleConnectionMessage = (data) => {
    switch (data.event) {
      case "start":
        if (!muted) playClick();
        setTime(data.time);
        startTimer(data.time);
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
        setUsers([...data.users]);
        setPomoCount(data.pomoCount);
        setStatus(data.status);
        setTime(data.time);
        if (data.timer) startTimer(data.time);
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
        setTime(longBreakLength);
        setShowFireworks(true);
      } else {
        setStatus("Short Break");
        setTime(shortBreakLength);
      }
      setPomoCount((pomoCount) => pomoCount + 1);
    } else {
      setStatus("Pomodoro");
      setTime(pomoLength);
    }
  };

  const timerTick = (endTime) => {
    setTime((time) => {
      return calcTimeLeft(endTime);
    });
  };

  const startTimer = (timeRemaining) => {
    const endTime = calcEndTime(timeRemaining);
    if (!timer) {
      setTimer(
        setInterval((endtime) => {
          timerTick(endTime);
        }, 1000)
      );
    }
  };

  const stopTimer = () => {
    clearInterval(timer);
    setTimer(null);
  };

  const handleStart = () => {
    console.log(time);
    startTimer(time);
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
      time: pomoLength,
      status: "Pomodoro",
    });
    stopTimer();
    setTime(pomoLength);
    setStatus("Pomodoro");
  };

  const handleShortBreak = () => {
    sendToConnections({
      event: "status",
      time: shortBreakLength,
      status: "Short Break",
    });
    stopTimer();
    setTime(shortBreakLength);
    setStatus("Short Break");
  };

  const handleLongBreak = () => {
    sendToConnections({
      event: "status",
      time: longBreakLength,
      status: "Long Break",
    });
    stopTimer();
    setTime(longBreakLength);
    setStatus("Long Break");
  };

  const handleBack = () => {
    socket.emit("user-disconnect", roomId, currentUser.id);
    history.push({
      pathname: "/",
      state: {
        room: roomId,
      },
    });
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
      {showFireworks && <Fireworks setShow={setShowFireworks} />}
      <div className="spacing"></div>
      <div className="main-container">
        <div className="left-container">
          <div className="top-left-button-container">
            <BackButton color={currentColor} onClick={handleBack}>
              Back
            </BackButton>
            <Button onClick={() => setMuted(!muted)}>
              {muted ? (
                <VolumeOff style={{ color: "white" }} />
              ) : (
                <VolumeUp style={{ color: "white" }} />
              )}
            </Button>
          </div>
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
              bottomRef={chatScrollHelper}
            />
          )}
        </div>
        <div className="middle-container">
          <p>CURRENTLY</p>
          <h3 style={{ fontSize: "3rem", marginTop: "1rem" }}>{status}</h3>
          <div>
            <Button size="large" color="pomodoro" onClick={handlePomodoro}>
              Pomodoro
            </Button>
            <Button size="large" onClick={handleShortBreak}>
              Short Break
            </Button>
            <Button size="large" onClick={handleLongBreak}>
              Long Break
            </Button>
          </div>
          <h2>
            {time.minutes < 10 && "0"}
            {time.minutes}:{time.seconds < 10 && "0"}
            {time.seconds}
          </h2>
          <StartButton onClick={toggleTimer} color={currentColor}>
            {!timer ? "START" : "STOP"}
          </StartButton>
        </div>
        <div className="right-container">
          <h2>Pomos</h2>
          <div className="pomocount">
            Current: {(pomoCount % pomosPerSession) + 1}/{pomosPerSession}
          </div>
          <div className="pomocount">Completed: {pomoCount}</div>
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
