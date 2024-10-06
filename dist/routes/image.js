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
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const router = express_1.default.Router();
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
// Route to get an image by filename
router.get('/:filename', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filename } = req.params;
    // Check if gfs is initialized
    if (!gfs) {
        res.status(500).send('GridFSBucket is not initialized.');
        return;
    }
    try {
        // Create a read stream from GridFS
        const downloadStream = gfs.openDownloadStreamByName(filename);
        downloadStream.on('error', () => {
            res.status(404).send('No file exists with that name.');
        });
        // Set the correct content type for the response based on the file extension
        const fileExtension = filename.split('.').pop();
        const contentType = fileExtension === 'png' ? 'image/png' : fileExtension === 'jpg' ? 'image/jpeg' : 'image/jpeg';
        res.set('Content-Type', contentType);
        downloadStream.pipe(res); // Pipe the download stream to the response
    }
    catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Internal server error.');
    }
}));
exports.default = router;
