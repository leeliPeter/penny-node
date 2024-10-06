// import express, { Request, Response } from 'express';
// import multer from 'multer';
// import fs from 'fs';
// import path from 'path';
// import mongoose, { Connection } from 'mongoose';
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
//     cb(null, `${Date.now()}`);
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
//     // Use type assertion to let TypeScript know that req.file exists
//     const file = req.file as Express.Multer.File | undefined;
  
//     // Check if file exists
//     if (!file) {
//       res.status(400).send('No file uploaded.');
//       return;
//     }
  
//     try {
//       // Read the file from the uploads directory
//       const filePath = path.join(uploadsDir, file.filename);
//       const readStream = fs.createReadStream(filePath);
  
//       // Ensure gfs is initialized
//       if (!gfs) {
//         res.status(500).send('GridFSBucket is not initialized.');
//         return;
//       }
  
//       // Upload to GridFS
//       const uploadStream = gfs.openUploadStream(file.filename, {
//         contentType: file.mimetype,
//       });
  
//       readStream.pipe(uploadStream);
  
//       uploadStream.on('finish', async () => {
//         // Remove the local file after uploading to GridFS
//         try {
//           await fs.promises.unlink(filePath);
//           console.log(`${file.filename} deleted from local storage.`);
//         } catch (err) {
//           console.error('Error deleting local file:', err);
//           res.status(500).send('File uploaded but failed to delete local file.');
//           return;
//         }
  
//         res.status(200).send("File uploaded successfully to GridFS!");
//       });
  
//       uploadStream.on('error', (error) => {
//         console.error('Error uploading to GridFS:', error);
//         res.status(500).send('Error uploading file to database.');
//       });
//     } catch (error) {
//       console.error('Error processing upload:', error);
//       res.status(500).send('Internal server error.');
//     }
//   });
  

  

// export default router;
