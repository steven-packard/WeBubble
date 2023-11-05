const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Filter = require('./Filter/badwords');
const mongoose = require('mongoose');
const { words: lang } = require('./Filter/lang.json'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initializing the word filter
const filter = new Filter();
filter.addWords(...lang); 


// Connect to MongoDB
const dbUrl = 'mongodb+srv://stevenpackard:hacknjit@cluster0.bn4ruzv.mongodb.net/message-database';
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema and model for the messages
const messageSchema = new mongoose.Schema({ text: String, createdAt: Date });
const Message = mongoose.model('Message', messageSchema);

// Serve static files from the current directory
app.use(express.static('.'));

// Serve the HTML file on the root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', async (socket) => {
    // Send the 9 most recent messages to the client immediately after connection
    const messages = await Message.find().sort({ createdAt: -1 }).limit(9);
    socket.emit('display messages', messages.reverse());

    // When a new message is received
    socket.on('new message', async (text) => {
        if (text.trim()) { // Check if the message is not just whitespace
            // Filter the message for bad words before saving
            const filteredText = filter.clean(text);
            // Create a new message document
            const message = new Message({ text: filteredText, createdAt: new Date() });
            // Save the message to the database
            await message.save();
            // Fetch the 9 most recent messages
            const messages = await Message.find().sort({ createdAt: -1 }).limit(9);
            // Emit the messages to the client to display
            io.emit('display messages', messages.reverse());
        }
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});
