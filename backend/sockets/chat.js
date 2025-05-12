const Ad = require('../models/Ad'); // Import the Ad model
let queue = [];
let activeRooms = new Set(); // Track active chat rooms

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('start_chat', (alias) => {
            socket.alias = alias;
            queue.push(socket);

            if (queue.length >= 2) {
                const user1 = queue.shift();
                const user2 = queue.shift();

                const roomId = `${user1.id}#${user2.id}`;
                user1.roomId = roomId;
                user2.roomId = roomId;
                user1.join(roomId);
                user2.join(roomId);

                activeRooms.add(roomId); // Add room to active rooms

                user1.emit('chat_started', { roomId, otherAlias: user2.alias });
                user2.emit('chat_started', { roomId, otherAlias: user1.alias });
            }
        });

        socket.on('send_message', ({ roomId, message }) => {
            if (message.trim() === '!next') {
                // Handle the !next command
                if (socket.roomId) {
                    io.to(socket.roomId).emit('receive_message', {
                        sender: 'System',
                        message: `${socket.alias} has left the chat to find a new match.`,
                    });

                    activeRooms.delete(socket.roomId); // Remove the room from active rooms
                    socket.leave(socket.roomId); // Leave the current room
                    socket.roomId = null; // Reset the roomId
                }

                // Add the user back to the queue
                queue.push(socket);

                // Try to match users again
                if (queue.length >= 2) {
                    const user1 = queue.shift();
                    const user2 = queue.shift();

                    const newRoomId = `${user1.id}#${user2.id}`;
                    user1.roomId = newRoomId;
                    user2.roomId = newRoomId;
                    user1.join(newRoomId);
                    user2.join(newRoomId);

                    activeRooms.add(newRoomId); // Add the new room to active rooms

                    user1.emit('chat_started', { roomId: newRoomId, otherAlias: user2.alias });
                    user2.emit('chat_started', { roomId: newRoomId, otherAlias: user1.alias });
                }
                return;
            }

            // Regular message handling
            if (/(http:\/\/|https:\/\/)/gi.test(message)) {
                return; // Block links
            }
            io.to(roomId).emit('receive_message', { sender: socket.alias, message });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);

            queue = queue.filter(s => s.id !== socket.id);

            if (socket.roomId) {
                io.to(socket.roomId).emit('receive_message', {
                    sender: 'System',
                    message: `${socket.alias} has left the chat. Refresh to start a new chat.`,
                });

                activeRooms.delete(socket.roomId); // Remove room from active rooms
            }
        });
    });

    // Broadcast ads to active rooms every 2 minutes
    setInterval(async () => {
        try {
            const ad = await Ad.findOne(); // Fetch one ad from the database
            if (!ad) return;

            const adMessage = `Ad: ${ad.name} by ${ad.madeBy}\n${ad.description}\nCheck it out: ${ad.link}`;

            activeRooms.forEach((roomId) => {
                io.to(roomId).emit('receive_message', {
                    sender: 'Ad',
                    message: adMessage
                });
            });
        } catch (err) {
            console.error('Error fetching ads:', err);
        }
    }, 120000); // 2 minutes in milliseconds
};
