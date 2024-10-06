"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("./routes/user")); // Assuming user routes exist
const upload_1 = __importDefault(require("./routes/upload")); // Importing the upload router
const image_1 = __importDefault(require("./routes/image")); // Importing the image router
const app = (0, express_1.default)();
const port = 3000;
// CORS setup for allowing frontend requests from specific origins
const allowedOrigins = ['http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('CORS error: Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// MongoDB connection
const uri = "mongodb+srv://manager:12345678a@cluster0.63awn.mongodb.net/penny?retryWrites=true&w=majority&appName=Cluster0";
mongoose_1.default.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => {
    console.error('Error connecting to MongoDB:', error);
    setTimeout(() => mongoose_1.default.connect(uri), 5000);
});
// Middleware
app.use(body_parser_1.default.json({ limit: '10mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '10mb', extended: true }));
app.use((0, express_session_1.default)({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({ mongoUrl: uri, collectionName: 'sessions' }),
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600 * 1000 * 12 * 30, // ~30 days
    }
}));
// Routes
app.use('/user', user_1.default); // Assuming there's a user route
app.use('/upload', upload_1.default); // Upload route handled by the upload router
app.use('/image', image_1.default); // Image route handled by the image router
// Server setup
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
