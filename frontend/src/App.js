import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './index.css';

const socket = io('https://enteract.onrender.com');

function App() {
    const [alias, setAlias] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [waitingForMatch, setWaitingForMatch] = useState(false);

    useEffect(() => {
        socket.on('chat_started', ({ roomId }) => {
            setRoomId(roomId);
            setWaitingForMatch(false);  // Stop waiting when the chat starts
        });
        socket.on('receive_message', ({ sender, message }) => {
            setMessages(prev =>
                prev.some(msg => msg.message === message)
                    ? prev
                    : [...prev, { sender, message }]
            );
        });
        return () => {
            socket.off('chat_started');
            socket.off('receive_message');
        };
    }, []);

    const startChat = () => {
        if (!alias.trim()) return;
        setWaitingForMatch(true);
        socket.emit('start_chat', alias);
    };

    const sendMessage = () => {
        if (input.trim()) {
            socket.emit('send_message', { roomId, message: input });
            setInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="container">
            {!roomId && waitingForMatch ? (
                <div className="waiting-container">
                    <p className="waiting-message">Waiting for a match...</p>
                </div>
            ) : !roomId ? (
                <>
                    <h1>Enter your alias to start</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            value={alias}
                            onChange={e => setAlias(e.target.value)}
                            placeholder="Enter alias"
                        />
                        <button onClick={startChat}>Start Chat</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="messages">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`message ${msg.sender === alias ? 'self' : 'other'}`}
                            >
                                {msg.message}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type a message..."
                            onKeyDown={handleKeyPress}
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
