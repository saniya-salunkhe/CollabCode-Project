import { useState, useEffect, useRef } from 'react';
import { formatTime, getInitials } from '../utils/constants';

export default function ChatPanel({ messages, onSend, typingUsers }) {
  const [input, setInput] = useState('');
  const messagesEnd = useRef(null);
  const currentUserName = JSON.parse(localStorage.getItem('collabcode_user') || '{}')?.name;

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '0 0 12px 0' }}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg._id || i}
              className={`chat-message ${msg.senderName === currentUserName ? 'own' : ''}`}
            >
              {msg.senderName !== currentUserName && (
                <div className="sender">{msg.senderName}</div>
              )}
              <div className="text">{msg.text}</div>
              <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>
                {formatTime(msg.createdAt)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEnd} />
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-sm">Send</button>
      </form>
    </div>
  );
}
