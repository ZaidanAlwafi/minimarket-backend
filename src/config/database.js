const path = require('path');
const { Sequelize } = require('sequelize');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function trim(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function resolveDbConfig() {
  const url = trim(
    process.env.DATABASE_URL ||
      process.env.MYSQL_URL ||
      process.env.MYSQL_PUBLIC_URL
  );

  if (url) {
    return { url, useUrl: true };
  }

  const database = trim(
    process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.DB_DATABASE
  );
  const username = trim(
    process.env.DB_USER || process.env.MYSQLUSER || process.env.DB_USERNAME
  );
  const password =
    process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? process.env.DB_PASS ?? '';
  const host = trim(
    process.env.DB_HOST || process.env.MYSQLHOST || process.env.DB_HOSTNAME
  );
  const port = Number(trim(process.env.DB_PORT || process.env.MYSQLPORT || 3306));

  return { database, username, password, host, port, useUrl: false };
}

function validateConfig(cfg) {
  if (cfg.useUrl) {
    return;
  }

  const missing = [];
  if (!cfg.database) missing.push('DB_NAME / MYSQLDATABASE');
  if (!cfg.username) missing.push('DB_USER / MYSQLUSER');
  if (!cfg.host) missing.push('DB_HOST / MYSQLHOST');
  if (!cfg.port || Number.isNaN(cfg.port)) missing.push('DB_PORT / MYSQLPORT');

  if (missing.length > 0) {
    throw new Error(
      `Variabel database belum lengkap: ${missing.join(', ')}. ` +
        'Di Railway, buka service MySQL → Variables → gunakan "Add Reference" ke service API.'
    );
  }
}

const cfg = resolveDbConfig();
validateConfig(cfg);

const isProduction = process.env.NODE_ENV === 'production';
const host = cfg.useUrl ? '' : cfg.host;
const useSsl =
  !cfg.useUrl &&
  host &&
  (host.includes('.rlwy.net') || host.includes('proxy.railway'));

const sequelizeOptions = {
  dialect: 'mysql',
  logging: isProduction ? false : console.log,
  dialectOptions: useSsl
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {},
};

const sequelize = cfg.useUrl
  ? new Sequelize(cfg.url, sequelizeOptions)
  : new Sequelize(cfg.database, cfg.username, cfg.password, {
      ...sequelizeOptions,
      host,
      port: cfg.port,
    });

module.exports = sequelize;
