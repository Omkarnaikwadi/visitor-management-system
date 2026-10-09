const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Save base64 image from webcam capture
const saveBase64Image = (base64Data) => {
  if (!base64Data) return null;
  
  try {
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;

    const ext = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    const filename = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    return `/uploads/photos/${filename}`;
  } catch (error) {
    console.error('Error saving base64 image:', error);
    return null;
  }
};

module.exports = { upload, saveBase64Image };
