const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid atau kadaluwarsa' });
    req.user = decoded;
    next();
  });
};

exports.isOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') return next();
  return res.status(403).json({ message: 'Akses ditolak! Hanya untuk Owner.' });
};

exports.isStaff = (req, res, next) => {
  const role = req.user?.role;
  if (role === 'owner' || role === 'admin' || role === 'gudang') return next();
  return res.status(403).json({ message: 'Akses ditolak! Hanya untuk staff.' });
};

/** Owner + admin (kasir) — verifikasi pembayaran manual */
exports.isAdminOrOwner = (req, res, next) => {
  const role = req.user?.role;
  if (role === 'owner' || role === 'admin') return next();
  return res.status(403).json({ message: 'Hanya Owner atau Admin yang dapat memverifikasi pembayaran.' });
};

exports.isCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') return next();
  return res.status(403).json({ message: 'Akses ditolak! Hanya untuk customer.' });
};
