const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const { Server } = require('socket.io');
const exp = require('constants');
const { Socket } = require('dgram');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

//enable_cors_and_json_body_parsing
app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

//setup_socket.io
const io = new Server(server, {
    cors: {origin: '*'}
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

//attach_socket.io_instance_to_each_request
app.use((req, res, next) => {
    req.io = io;
    next();
});

//define_api_routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));