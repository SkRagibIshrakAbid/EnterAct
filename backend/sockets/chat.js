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
                user1.join(roomId);
                user2.join(roomId);

                io.to(roomId).emit('chat_started', { roomId, users: [user1.alias, user2.alias] });
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
            queue = queue.filter(s => s.id !== socket.id);
        });
    });
};
