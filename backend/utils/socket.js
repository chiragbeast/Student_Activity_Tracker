const socketIO = require('socket.io');

let io;
const userSockets = new Map(); // userId -> [socketId1, socketId2, ...]

const init = (server) => {
    io = socketIO(server, {
        cors: {
            origin: '*', // In production, replace with your frontend URL
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('register', (userId) => {
            if (userId) {
                console.log(`User ${userId} registered with socket ${socket.id}`);
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId).add(socket.id);
                socket.userId = userId;
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            if (socket.userId && userSockets.has(socket.userId)) {
                userSockets.get(socket.userId).delete(socket.id);
                if (userSockets.get(socket.userId).size === 0) {
                    userSockets.delete(socket.userId);
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const sendNotification = (userId, notification) => {
    if (!io) return;
    
    const userIdStr = userId.toString();
    if (userSockets.has(userIdStr)) {
        const socketIds = userSockets.get(userIdStr);
        socketIds.forEach(socketId => {
            io.to(socketId).emit('new_notification', notification);
        });
        console.log(`Live notification sent to user ${userIdStr}`);
    } else {
        console.log(`User ${userIdStr} not connected via socket, skipping live update`);
    }
};

module.exports = {
    init,
    getIO,
    sendNotification
};
