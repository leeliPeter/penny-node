"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const constant_1 = __importDefault(require("../type/constant"));
const userSchema_1 = __importDefault(require("../schema/userSchema")); // Adjust the import path as needed
const mongodb_1 = require("mongodb");
const router = express_1.default.Router();
// Define the path for the uploads directory
const uploadsDir = path_1.default.join(__dirname, 'uploads');
// Create uploads directory if it doesn't exist
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Multer storage configuration
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Use the uploads directory
    },
    filename: function (req, file, cb) {
        const fileExtension = path_1.default.extname(file.originalname); // Get the file extension
        cb(null, `${Date.now()}${fileExtension}`); // Save with unique filename
    }
});
// Initialize the multer upload with the storage configuration
const upload = (0, multer_1.default)({ storage });
// MongoDB connection
const uri = 'mongodb+srv://manager:12345678a@cluster0.63awn.mongodb.net/penny?retryWrites=true&w=majority&appName=Cluster0';
const conn = mongoose_1.default.createConnection(uri);
let gfs; // Declare gfs outside
conn.once('open', () => {
    // Ensure conn.db is available before creating gfs
    if (!conn.db) {
        throw new Error('Database connection not established');
    }
    gfs = new mongodb_1.GridFSBucket(conn.db, { bucketName: 'uploads' });
});
// Common file upload logic
const handleFileUpload = (file, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const uniqueFileName = file.filename; // Get the generated filename
    const filePath = path_1.default.join(uploadsDir, uniqueFileName);
    // Check if the file actually exists before trying to read it
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }
    const readStream = fs_1.default.createReadStream(filePath);
    const uploadStream = gfs.openUploadStream(uniqueFileName, {
        contentType: file.mimetype,
    });
    readStream.pipe(uploadStream);
    return new Promise((resolve, reject) => {
        uploadStream.on('finish', () => __awaiter(void 0, void 0, void 0, function* () {
            // Remove the local file after uploading to GridFS
            try {
                yield fs_1.default.promises.unlink(filePath);
                console.log(`${uniqueFileName} deleted from local storage.`);
                // Return the image URL
                resolve(`${constant_1.default}${uniqueFileName}`);
            }
            catch (err) {
                console.error('Error deleting local file:', err);
                reject('Failed to delete local file.');
            }
        }));
        uploadStream.on('error', (error) => {
            console.error('Error uploading to GridFS:', error);
            reject('Error uploading file to database.');
        });
    });
});
// Single file upload route
router.post('/profile', upload.single('uploaded_file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    // Check if file exists
    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }
    try {
        const userId = req.body.userId; // Get userId from request body
        const imageUrl = yield handleFileUpload(file, userId);
        yield userSchema_1.default.updateOne({ id: userId }, { icon: imageUrl }); // Update user icon
        // Respond with the image name
        res.status(200).json({ imageName: file.filename });
    }
    catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).send('Internal server error.');
    }
}));
// Multiple files upload route
router.post('/multiple', upload.array('uploaded_files', 10), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    // Check if files exist
    if (!files || files.length === 0) {
        res.status(400).send('No files uploaded.');
        return;
    }
    try {
        const userId = req.body.userId; // Get userId from request body
        const uploadedImages = [];
        for (const file of files) {
            const imageUrl = yield handleFileUpload(file, userId);
            uploadedImages.push(imageUrl);
        }
        // Update user image array in database
        yield userSchema_1.default.updateOne({ id: userId }, { $addToSet: { image: { $each: uploadedImages } } } // Adding each image path to the array
        );
        // Respond with the uploaded image names
        res.status(200).json({ images: uploadedImages });
    }
    catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).send('Internal server error.');
    }
}));
exports.default = router;
