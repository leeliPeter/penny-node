import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

const router = express.Router();

// MongoDB connection
const uri = 'mongodb+srv://manager:12345678a@cluster0.63awn.mongodb.net/penny?retryWrites=true&w=majority&appName=Cluster0';
const conn = mongoose.createConnection(uri);

let gfs: GridFSBucket; // Declare gfs outside

conn.once('open', () => {
  // Ensure conn.db is available before creating gfs
  if (!conn.db) {
    throw new Error('Database connection not established');
  }
  gfs = new GridFSBucket(conn.db as mongoose.mongo.Db, { bucketName: 'uploads' });
});

// Route to get an image by filename
router.get('/:filename', async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Internal server error.');
  }
});

export default router;
