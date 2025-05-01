import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './index.css';

const socket = io('https://enteract.onrender.com');

function App() {
    const [alias, setAlias] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [waitingForMatch, setWaitingForMatch] = useState(false);
    const [showModal, setShowModal] = useState(true);  // State to control the modal visibility
    const inputRef = useRef(null);

    useEffect(() => {
        socket.on('chat_started', ({ roomId }) => {
            setRoomId(roomId);
            setWaitingForMatch(false);
        });
        socket.on('receive_message', ({ sender, message }) => {
            setMessages(prev => [...prev, { sender, message }]);
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
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const handleKeyPressAlias = (e) => {
        if (e.key === 'Enter') {
            startChat();
        }
    };

    const closeModal = () => {
        setShowModal(false);  // Close modal
    };

    const handleClickOutside = (e) => {
        if (e.target.id === 'modal-container') {
            closeModal();  // Close modal if clicked outside
        }
    };

    return (
        <div className="container" onClick={handleClickOutside}>
            {showModal && (
                <div id="modal-container" className="modal">
                    <div className="modal-content">
                        <button className="close-btn" onClick={closeModal}>×</button>
                        <h2>Welcome to the Chat!</h2>
                        <p>Here you can chat with a random person by entering your alias.</p>
                        <p>Once matched, you can send messages back and forth.</p>
                        <p>Refresh the page to start again🔄</p>
                    </div>
                </div>
            )}
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
                            onKeyDown={handleKeyPressAlias}
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
                                <strong>{msg.sender}:</strong> {msg.message}
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
                            ref={inputRef}
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
