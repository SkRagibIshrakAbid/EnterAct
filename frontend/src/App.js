import { useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://enteract.onrender.com'); // later change to Vercel URL

function App() {
    const [alias, setAlias] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const startChat = () => {
        socket.emit('start_chat', alias);
    };

    socket.on('chat_started', ({ roomId, users }) => {
        setRoomId(roomId);
    });

    socket.on('receive_message', ({ sender, message }) => {
        setMessages(prev => [...prev, { sender, message }]);
    });

    const sendMessage = () => {
        if (input.trim() !== '') {
            socket.emit('send_message', { roomId, message: input });
            setInput('');
        }
    };

    return (
        <div>
            {!roomId ? (
                <div>
                    <input value={alias} onChange={e => setAlias(e.target.value)} placeholder="Enter Alias" />
                    <button onClick={startChat}>Start Chat</button>
                </div>
            ) : (
                <div>
                    {messages.map((msg, idx) => (
                        <div key={idx}><b>{msg.sender}:</b> {msg.message}</div>
                    ))}
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="Message..." />
                    <button onClick={sendMessage}>Send</button>
                </div>
            )}
        </div>
    );
}

export default App;
