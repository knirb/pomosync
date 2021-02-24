import React from "react";
import "styles/Room/Chat/Chat.scss";

const Chat = ({ users, messages }) => {
  return (
    <div className="Chat">
      <div className="chat-top">
        <div className="message-window">
          {messages.map((message) => (
            <div class="message">
              <em>{message.sender}: </em>
              {message.message}
            </div>
          ))}
        </div>
        <div className="user-list">
          <div>Users</div>
          {users.map((user) => (
            <div>{user.name}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chat;
