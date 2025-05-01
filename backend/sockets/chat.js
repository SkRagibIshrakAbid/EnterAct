let queue = [];

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
                user1.roomId = roomId; // Store roomId for user1
                user2.roomId = roomId; // Store roomId for user2
                user1.join(roomId);
                user2.join(roomId);

                // Notify both users that the chat has started
                user1.emit('chat_started', { roomId, otherAlias: user2.alias });
                user2.emit('chat_started', { roomId, otherAlias: user1.alias });
            }
        });

        socket.on('send_message', ({ roomId, message }) => {
            if (/(http:\/\/|https:\/\/)/gi.test(message)) {
                return; // Block links
            }
            io.to(roomId).emit('receive_message', { sender: socket.alias, message });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);

            // Remove the user from the queue if they were waiting
            queue = queue.filter(s => s.id !== socket.id);

            // Notify the room that the user has left
            if (socket.roomId) {
                io.to(socket.roomId).emit('receive_message', {
                    sender: 'System',
                    message: `${socket.alias} has left the chat. Refresh to start a new chat.`,
                });
            }
        });
    });
};
