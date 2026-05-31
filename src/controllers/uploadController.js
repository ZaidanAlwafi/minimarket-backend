const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/products');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

exports.uploadProductImage = async (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ message: 'Data gambar tidak valid.' });
    }

    const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ message: 'Format gambar harus JPEG, PNG, atau WebP.' });
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');

    if (buffer.length > 3 * 1024 * 1024) {
      return res.status(400).json({ message: 'Ukuran gambar maksimal 3 MB.' });
    }

    ensureUploadDir();
    const base =
      String(filename || 'produk')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 40) || 'produk';
    const storedName = `${Date.now()}-${base}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, storedName);
    fs.writeFileSync(filePath, buffer);

    res.status(201).json({
      message: 'Gambar berhasil diunggah',
      image: storedName,
      url: `/uploads/products/${storedName}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
