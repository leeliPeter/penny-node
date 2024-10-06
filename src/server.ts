import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import user from './routes/user'; // Assuming user routes exist
import upload from './routes/upload'; // Importing the upload router
import image from './routes/image'; // Importing the image router

const app = express();
const port = 3000;

// CORS setup for allowing frontend requests from specific origins
const allowedOrigins = ['http://3.144.125.59', 'https://3.144.125.59', 'http://localhost:5173'];
// const allowedOrigins = ['http://localhost:5173'];
app.use(cors({
    origin: function (origin, callback) {
        console.log('Origin:', origin);  // Log the incoming origin
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS error: Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// MongoDB connection
const uri = "mongodb+srv://manager:12345678a@cluster0.63awn.mongodb.net/penny?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        setTimeout(() => mongoose.connect(uri), 5000);
    });

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: uri, collectionName: 'sessions' }),
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600 * 1000 * 12 * 30, // ~30 days
    }
}));

// Routes
app.use('/user', user); // Assuming there's a user route
app.use('/upload', upload); // Upload route handled by the upload router
app.use('/image', image); // Image route handled by the image router

// Serve static files from react-dist
app.use(express.static(path.join(__dirname, '/public/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../react-dist/index.html'));
});


// Server setup
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


server.setTimeout(500000); 