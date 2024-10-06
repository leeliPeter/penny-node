import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import mongoose, { Connection } from 'mongoose';
import imageUrl from '../type/constant';
import User from '../schema/userSchema'; // Adjust the import path as needed
import { GridFSBucket } from 'mongodb';

const router = express.Router();

// Define the path for the uploads directory
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Use the uploads directory
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname); // Get the file extension
    cb(null, `${Date.now()}${fileExtension}`); // Save with unique filename
  }
});

// Initialize the multer upload with the storage configuration
const upload = multer({ storage });

// MongoDB connection
const uri = 'mongodb+srv://manager:12345678a@cluster0.63awn.mongodb.net/penny?retryWrites=true&w=majority&appName=Cluster0';
const conn: Connection = mongoose.createConnection(uri);

let gfs: GridFSBucket; // Declare gfs outside

conn.once('open', () => {
  // Ensure conn.db is available before creating gfs
  if (!conn.db) {
    throw new Error('Database connection not established');
  }
  gfs = new GridFSBucket(conn.db as mongoose.mongo.Db, { bucketName: 'uploads' });
});

// Common file upload logic
const handleFileUpload = async (file: Express.Multer.File, userId: string) => {
  const uniqueFileName = file.filename; // Get the generated filename
  const filePath = path.join(uploadsDir, uniqueFileName);

  // Check if the file actually exists before trying to read it
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const readStream = fs.createReadStream(filePath);
  const uploadStream = gfs.openUploadStream(uniqueFileName, {
    contentType: file.mimetype,
  });

  readStream.pipe(uploadStream);

  return new Promise<string>((resolve, reject) => {
    uploadStream.on('finish', async () => {
      // Remove the local file after uploading to GridFS
      try {
        await fs.promises.unlink(filePath);
        console.log(`${uniqueFileName} deleted from local storage.`);
        // Return the image URL
        resolve(`${imageUrl}${uniqueFileName}`);
      } catch (err) {
        console.error('Error deleting local file:', err);
        reject('Failed to delete local file.');
      }
    });

    uploadStream.on('error', (error) => {
      console.error('Error uploading to GridFS:', error);
      reject('Error uploading file to database.');
    });
  });
};

// Single file upload route
router.post('/profile', upload.single('uploaded_file'), async (req: Request, res: Response): Promise<void> => {
  const file = req.file as Express.Multer.File | undefined;

  // Check if file exists
  if (!file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  try {
    const userId = req.body.userId; // Get userId from request body
    const imageUrl = await handleFileUpload(file, userId);
    await User.updateOne({ id: userId }, { icon: imageUrl }); // Update user icon

    // Respond with the image name
    res.status(200).json({ imageName: file.filename });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).send('Internal server error.');
  }
});

// Multiple files upload route
router.post('/multiple', upload.array('uploaded_files', 10), async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;

  // Check if files exist
  if (!files || files.length === 0) {
    res.status(400).send('No files uploaded.');
    return;
  }

  try {
    const userId = req.body.userId; // Get userId from request body
    const uploadedImages: string[] = [];

    for (const file of files) {
      const imageUrl = await handleFileUpload(file, userId);
      uploadedImages.push(imageUrl);
    }

    // Update user image array in database
    await User.updateOne(
      { id: userId },
      { $addToSet: { image: { $each: uploadedImages } } } // Adding each image path to the array
    );

    // Respond with the uploaded image names
    res.status(200).json({ images: uploadedImages });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).send('Internal server error.');
  }
});

export default router;
