import { io, Socket } from 'socket.io-client';
import './App.css';
import { useState, useEffect, useRef } from 'react';

interface Message {
  name: string;
  message: string;
}

function App() {
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    const name = prompt("Please state your name:");
    if (name) {
      setUsername(name);
      setConnected(true); // User is connected
      setMessages((prevMessages) => [...prevMessages, { name: 'System', message: "You joined" }]);
      socket.emit('User joined', name);
    }

    socket.on('chat-message', (data: Message) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('user-joined', ({ name }: { name: string }) => {
      setMessages((prevMessages) => [...prevMessages, { name: 'System', message: `${name} joined` }]);
    });

    socket.on('user-disconnected', ({ name }: { name: string }) => {
      setMessages((prevMessages) => [...prevMessages, { name: 'System', message: `${name} disconnected` }]);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.off('chat-message');
      socket.off('user-joined');
      socket.off('user-disconnected');
      socket.disconnect();
    };
  }, []);

  const handleMessageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserMessage(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username && connected) { // Only allow message submission if connected
      socketRef.current?.emit('send-chat-message', { name: username, message: userMessage });
    }
    setUserMessage('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type='text' value={userMessage} onChange={handleMessageInput} disabled={!connected} />
        <button type='submit' disabled={!connected}>Send</button>
      </form>
      <div className='message-container'>
        {messages.map((message, index) => (
          <div key={index}>
            <strong>{message.name}:</strong> {message.message}
          </div>
        ))}
      </div>
      <div>{connected ? 'Connected' : 'Disconnected'}</div>
    </div>
  );
}

export default App;
