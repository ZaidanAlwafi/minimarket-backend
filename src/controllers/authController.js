const User = require('../models/User');
const { mapUserToFe, verifyPassword, hashPassword } = require('../utils/mappers');

exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' });
    }
    const em = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: em } });
    if (existing) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }
    const hashed = await hashPassword(password);
    const user = await User.create({
      username: name.trim(),
      email: em,
      password: hashed,
      role: 'customer',
      phone: phone || '',
      address: address || '',
    });
    res.status(201).json({
      message: 'Registrasi customer berhasil.',
      user: mapUserToFe(user),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Password salah' });

    const jwt = require('jsonwebtoken');
    const feUser = mapUserToFe(user);
    const token = jwt.sign(
      {
        id: feUser.id,
        name: feUser.name,
        email: feUser.email,
        role: feUser.role,
        dbRole: feUser.dbRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login Berhasil',
      token,
      user: feUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json({ user: mapUserToFe(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
