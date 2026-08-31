const User = require('../models/User');

async function requireUser(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

async function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.redirect(process.env.ADMIN_PATH || '/control-x7k9');
  }
  next();
}

module.exports = {
  requireUser,
  requireAdmin
};
