const User = require('../models/User');
const { mapUserToFe, hashPassword } = require('../utils/mappers');

const ROLE_MAP = {
  OWNER: 'owner',
  ADMIN: 'employee',
  KASIR: 'employee',
  EMPLOYEE: 'employee',
  GUDANG: 'warehouse',
  WAREHOUSE: 'warehouse',
  CUSTOMER: 'customer',
};

exports.getStaff = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: ['owner', 'employee', 'warehouse'] },
      order: [['user_id', 'ASC']],
    });
    res.json(
      users.map((u) => {
        const fe = mapUserToFe(u);
        return {
          id: fe.id,
          name: fe.name,
          email: fe.email,
          role: String(fe.dbRole || '').toUpperCase() === 'EMPLOYEE' ? 'ADMIN' : fe.dbRole?.toUpperCase(),
          status: 'aktif',
        };
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const dbRole = ROLE_MAP[String(role || 'ADMIN').toUpperCase()] || 'employee';
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'Nama dan email wajib diisi.' });
    }
    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) return res.status(400).json({ message: 'Email sudah dipakai.' });

    const user = await User.create({
      username: name.trim(),
      email: email.trim().toLowerCase(),
      password: await hashPassword(password || '12345'),
      role: dbRole,
      phone: '',
      address: '',
    });
    const fe = mapUserToFe(user);
    res.status(201).json({
      id: fe.id,
      name: fe.name,
      email: fe.email,
      role: dbRole === 'employee' ? 'ADMIN' : dbRole.toUpperCase(),
      status: 'aktif',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    const { name, phone, address } = req.body;
    await user.update({
      username: name?.trim() || user.username,
      phone: phone ?? user.phone,
      address: address ?? user.address,
    });
    res.json({ user: mapUserToFe(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
