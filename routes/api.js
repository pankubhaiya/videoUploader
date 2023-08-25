const express = require('express');
const router = express.Router();
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const ffmpegPath = path.join(__dirname, '../ffmpeg-master-latest-win64-gpl-shared/bin/ffmpeg.exe'); 
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const AWS = require('aws-sdk');

const multer = require('multer');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  const upload = multer({ storage });

// AWS S3 setup
AWS.config.update({
  accessKeyId:process.env.accessKeyId,
  secretAccessKey:process.env.secretAccessKey,
  region:process.env.region 
});
const s3 = new AWS.S3();

// POST /api/upload
router.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', 'compressed', req.file.filename);

  // Video compression using ffmpeg
  ffmpeg(inputPath)
    .outputOptions(['-c:v libx264', '-crf 20'])
    .output(outputPath)
    .on('end', () => {
      // Upload compressed video to AWS S3
      const params = {
        Bucket:process.env.Bucket,
        Key: req.file.filename,
        Body: fs.createReadStream(outputPath)
      };
      s3.upload(params, (err, data) => {
        if (err) {
          console.error('Error uploading to S3:', err);
          return res.status(500).json({ message: 'Error uploading to S3' });
        }
        
        // Clean up local files
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.json({ message: 'File uploaded and compressed successfully.' });
      });
    })
  
    .on('error', (err) => {
      console.error('Error compressing video:', err);
      res.status(500).json({ message: 'Error compressing video' });
    })
    .run();
});

// GET /api/download/:filename
router.get('/download/:filename', (req, res) => {
  const params = {
    Bucket:process.env.Bucket,
    Key: req.params.filename
  };
  const fileStream = s3.getObject(params).createReadStream();
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
  fileStream.pipe(res);
});

module.exports = router;
