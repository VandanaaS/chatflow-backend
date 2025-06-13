
const { Message } = require('./models');

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('join', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('sendMessage', async (data) => {
      const msg = new Message(data);
      await msg.save();
      io.to(data.conversationId).emit('newMessage', msg);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

module.exports = initSocket;
