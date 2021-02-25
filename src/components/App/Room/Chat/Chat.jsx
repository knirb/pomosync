import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import "styles/Room/Chat/Chat.scss";

const Chat = ({ messages, onSubmit }) => {
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    e.preventDefault();
    setMessage(e.currentTarget.value);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message) onSubmit(message);
    setMessage("");
  };

  return (
    <div className="Chat">
      <div className="message-window">
        {messages.map((message) => (
          <div key={message._id} className="message">
            {message.type === "message" && (
              <>
                <strong>{message.sender}: </strong>
                {message.content}
              </>
            )}
            {message.type === "notification" && <em>{message.content}</em>}
          </div>
        ))}
      </div>
      <div className="chat-form-container">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <TextField
            onChange={handleChange}
            value={message}
            placeholder="Message..."
            inputProps={{
              style: {
                color: "white",
              },
            }}
          />
          <Button type="submit" style={{ color: "white" }}>
            send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
