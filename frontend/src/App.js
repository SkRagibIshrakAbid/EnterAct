import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://enteract.onrender.com'); // later change to Vercel URL

function App() {
    const [alias, setAlias] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    // Start the chat by emitting 'start_chat'
    const startChat = () => {
        socket.emit('start_chat', alias);
    };

    useEffect(() => {
        socket.on('chat_started', ({ roomId, users }) => {
            setRoomId(roomId);
        });

        socket.on('receive_message', ({ sender, message }) => {
            // Prevent adding duplicate messages to the state
            setMessages(prev => {
                if (prev.some(msg => msg.message === message)) {
                    return prev; // If the message already exists, do nothing
                }
                return [...prev, { sender, message }];
            });
        });

        // Clean up socket listeners on component unmount
        return () => {
            socket.off('chat_started');
            socket.off('receive_message');
        };
    }, []);

    const sendMessage = () => {
        if (input.trim() !== '') {
            socket.emit('send_message', { roomId, message: input });
            setInput(''); // Clear input after sending the message
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
