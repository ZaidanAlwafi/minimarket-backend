/** Map DB role ke label frontend */
function mapRoleToApp(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'owner') return 'owner';
  if (r === 'employee') return 'admin';
  if (r === 'warehouse') return 'gudang';
  if (r === 'customer') return 'customer';
  return r;
}

/** Map status order DB ke status katalog FE */
function mapOrderStatusToFe(dbStatus) {
  const s = String(dbStatus || '').toLowerCase();
  const map = {
    pending: 'pending',
    paid: 'processing',
    processed: 'processing',
    shipped: 'shipped',
    completed: 'delivered',
    cancelled: 'cancelled',
  };
  return map[s] || s;
}

function mapOrderStatusToDb(feStatus) {
  const s = String(feStatus || '').toLowerCase();
  const map = {
    pending: 'pending',
    processing: 'processed',
    shipped: 'shipped',
    delivered: 'completed',
    cancelled: 'cancelled',
  };
  return map[s] || 'pending';
}

function mapUserToFe(user) {
  if (!user) return null;
  const plain = user.get ? user.get({ plain: true }) : user;
  return {
    id: plain.user_id,
    name: plain.username,
    email: plain.email,
    role: mapRoleToApp(plain.role),
    dbRole: plain.role,
    phone: plain.phone || '',
    address: plain.address || '',
  };
}

function mapProductToFe(product, categoryName, supplierName) {
  const p = product.get ? product.get({ plain: true }) : product;
  const cat =
    categoryName ||
    p.Category?.category_name ||
    p.category_name ||
    (p.category_id ? `Kategori ${p.category_id}` : '');
  const sup =
    supplierName ||
    p.Supplier?.supplier_name ||
    p.supplier_name ||
    '';
  return {
    id: p.product_id,
    name: p.product_name,
    price: Number(p.price) || 0,
    buyPrice: Number(p.harga_beli) || 0,
    hargaBeli: Number(p.harga_beli) || 0,
    stock: Number(p.stock) || 0,
    category: cat,
    categoryId: p.category_id,
    supplierId: p.supplier_id,
    supplierName: sup,
    minStock: Number(p.minimum_stock) || 10,
    image: p.image || '',
    description: p.description || '',
  };
}

function mapCategoryToFe(cat) {
  const c = cat.get ? cat.get({ plain: true }) : cat;
  return {
    id: c.category_id,
    name: c.category_name,
    description: c.description || '',
    status: 'aktif',
  };
}

function mapSupplierToFe(s) {
  const row = s.get ? s.get({ plain: true }) : s;
  return {
    id: row.supplier_id,
    name: row.supplier_name,
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    status: 'aktif',
  };
}

function mapOrderToFe(order, user, details) {
  const o = order.get ? order.get({ plain: true }) : order;
  const items = (details || []).map((d) => {
    const row = d.get ? d.get({ plain: true }) : d;
    const prod = d.Product || {};
    return {
      productId: row.product_id,
      name: prod.product_name || `Produk #${row.product_id}`,
      qty: row.quantity,
      price: Number(row.price) || 0,
    };
  });
  const u = user ? (user.get ? user.get({ plain: true }) : user) : null;
  return {
    id: o.order_id,
    orderId: `#ORD-${String(o.order_id).padStart(3, '0')}`,
    customerId: o.user_id,
    customer: u?.username || '',
    address: o.shipping_address || u?.address || '',
    phone: u?.phone || '',
    date: o.order_date ? new Date(o.order_date).toLocaleString('id-ID') : '',
    items,
    total: Number(o.total_price) || 0,
    status: mapOrderStatusToFe(o.status),
    dbStatus: o.status,
    channel: 'online',
    paymentMethod: o.payment_method || 'manual',
    paymentStatus: o.payment_status || 'pending',
    paymentLabel:
      o.payment_status === 'verified'
        ? 'Pembayaran terverifikasi'
        : o.payment_status === 'rejected'
          ? 'Pembayaran ditolak'
          : 'Menunggu verifikasi pembayaran',
  };
}

async function verifyPassword(plain, stored) {
  const bcrypt = require('bcryptjs');
  if (!stored) return false;
  if (String(stored).startsWith('$2')) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

async function hashPassword(plain) {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(plain, 10);
}

module.exports = {
  mapRoleToApp,
  mapOrderStatusToFe,
  mapOrderStatusToDb,
  mapUserToFe,
  mapProductToFe,
  mapCategoryToFe,
  mapSupplierToFe,
  mapOrderToFe,
  verifyPassword,
  hashPassword,
};
