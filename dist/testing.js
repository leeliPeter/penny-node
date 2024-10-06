"use strict";
// import express, { Request, Response } from 'express';
// import multer from 'multer';
// import fs from 'fs';
// import path from 'path';
// import mongoose, { Connection } from 'mongoose';
// import imageUrl from '../type/constant';
// import User from '../schema/userSchema'; // Adjust the import path as needed
// import { GridFSBucket } from 'mongodb';
// const router = express.Router();
// // Define the path for the uploads directory
// const uploadsDir = path.join(__dirname, 'uploads');
// // Create uploads directory if it doesn't exist
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }
// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir); // Use the uploads directory
//   },
//   filename: function (req, file, cb) {
//     const fileExtension = path.extname(file.originalname); // Get the file extension
//     cb(null, `${Date.now()}${fileExtension}`); // Save with unique filename
//   }
// });
// // Initialize the multer upload with the storage configuration
// const upload = multer({ storage });
// // MongoDB connection
// const uri = 'mongodb+srv://manager:12345678a@cluster0.63awn.mongodb.net/penny?retryWrites=true&w=majority&appName=Cluster0';
// const conn: Connection = mongoose.createConnection(uri);
// let gfs: GridFSBucket; // Declare gfs outside
// conn.once('open', () => {
//   // Ensure conn.db is available before creating gfs
//   if (!conn.db) {
//     throw new Error('Database connection not established');
//   }
//   gfs = new GridFSBucket(conn.db as mongoose.mongo.Db, { bucketName: 'uploads' });
// });
// router.post('/profile', upload.single('uploaded_file'), async (req: Request, res: Response): Promise<void> => {
//   const file = req.file as Express.Multer.File | undefined;
//   // Check if file exists
//   if (!file) {
//     res.status(400).send('No file uploaded.');
//     return;
//   }
//   try {
//     const uniqueFileName = file.filename; // Get the generated filename
//     const filePath = path.join(uploadsDir, uniqueFileName);
//     console.log('Uploads Directory:', uploadsDir);
//     console.log('Expected File Path:', filePath);
//     // Check if the file actually exists before trying to read it
//     if (!fs.existsSync(filePath)) {
//       console.error(`File does not exist: ${filePath}`);
//        res.status(404).send('File not found.');
//        return;
//     }
//     const readStream = fs.createReadStream(filePath);
//     // Ensure gfs is initialized
//     if (!gfs) {
//       res.status(500).send('GridFSBucket is not initialized.');
//       return;
//     }
//     // Upload to GridFS using the unique filename
//     const uploadStream = gfs.openUploadStream(uniqueFileName, {
//       contentType: file.mimetype,
//     });
//     readStream.pipe(uploadStream);
//     uploadStream.on('finish', async () => {
//       // Remove the local file after uploading to GridFS
//       try {
//         await fs.promises.unlink(filePath);
//         console.log(`${uniqueFileName} deleted from local storage.`);
//       } catch (err) {
//         console.error('Error deleting local file:', err);
//         res.status(500).send('File uploaded but failed to delete local file.');
//         return;
//       }
//       // Update user icon in database using the uploaded file's ID
//       const userId = req.body.userId; // Get userId from request body
//       await User.updateOne({ id: userId }, { icon: `${imageUrl}${uniqueFileName}` }); // Assuming User is your model
//       // Respond with the image name
//       res.status(200).json({ imageName: uniqueFileName });
//     });
//     uploadStream.on('error', (error) => {
//       console.error('Error uploading to GridFS:', error);
//       res.status(500).send('Error uploading file to database.');
//     });
//   } catch (error) {
//     console.error('Error processing upload:', error);
//     res.status(500).send('Internal server error.');
//   }
// });
// export default router;
