const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render('auth/login', { 
    error: null
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('auth/login', {
      error: 'Username and password required'
    });
  }

  try {
    const pendingUser = await PendingUser.findOne({ username });
    if (pendingUser) {
      return res.render('auth/login', {
        error: 'Akun Anda masih menunggu persetujuan administrator'
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.render('auth/login', {
        error: 'Invalid username or password'
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.render('auth/login', {
        error: 'Invalid username or password'
      });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      res.redirect('/home');
    });
  } catch (err) {
    res.render('auth/login', {
      error: 'Server error. Please try again.'
    });
  }
});

router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render('auth/register', {
    error: null,
    success: null
  });
});

router.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.render('auth/register', {
      error: 'All fields are required',
      success: null
    });
  }

  if (password.length < 6) {
    return res.render('auth/register', {
      error: 'Password must be at least 6 characters',
      success: null
    });
  }

  if (password !== confirmPassword) {
    return res.render('auth/register', {
      error: 'Passwords do not match',
      success: null
    });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('auth/register', {
        error: 'Username already exists',
        success: null
      });
    }

    const pendingUser = await PendingUser.findOne({ username });
    if (pendingUser) {
      return res.render('auth/register', {
        error: 'Username already registered and waiting for approval',
        success: null
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await PendingUser.create({
      username,
      passwordHash
    });

    res.render('auth/register', {
      error: null,
      success: 'Registration successful. Please wait for admin approval.'
    });
  } catch (err) {
    res.render('auth/register', {
      error: 'Server error. Please try again.',
      success: null
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.redirect('/login');
  });
});

module.exports = router;
