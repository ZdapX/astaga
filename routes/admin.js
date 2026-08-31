const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const Project = require('../models/Project');
const mongoose = require('mongoose');

const ADMIN_PATH = process.env.ADMIN_PATH || '/control-x7k9';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  } else if (file.fieldname === 'zipFile') {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  } else {
    cb(new Error('Invalid field'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.get('/', (req, res) => {
  if (req.session.admin) {
    return res.redirect(`${ADMIN_PATH}/dashboard`);
  }
  res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.render('admin/login', { error: 'Password required' });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.redirect(`${ADMIN_PATH}/dashboard`);
  }

  res.render('admin/login', { error: 'Invalid password' });
});

router.get('/dashboard', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect(ADMIN_PATH);
  }

  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    const pendingUsers = await PendingUser.find().sort({ createdAt: -1 });
    const users = await User.find().sort({ createdAt: -1 });

    res.render('admin/dashboard', {
      projects: projects,
      pendingUsers: pendingUsers,
      users: users,
      adminPath: ADMIN_PATH
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/projects', requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'zipFile', maxCount: 1 }
]), async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send('Title and description required');
  }

  if (!req.files['zipFile']) {
    return res.status(400).send('ZIP file required');
  }

  try {
    let imageData = '';
    let zipData = '';

    if (req.files['image']) {
      imageData = req.files['image'][0].buffer.toString('base64');
    }

    zipData = req.files['zipFile'][0].buffer.toString('base64');

    const project = new Project({
      title: title,
      description: description,
      image: imageData,
      zipFile: zipData
    });

    await project.save();
    console.log('Project saved:', project.title, project._id);
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Upload failed: ' + err.message);
  }
});

router.post('/projects/:id/edit', requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'zipFile', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid project ID');
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.updatedAt = new Date();

    if (req.files['image']) {
      project.image = req.files['image'][0].buffer.toString('base64');
    }

    if (req.files['zipFile']) {
      project.zipFile = req.files['zipFile'][0].buffer.toString('base64');
    }

    await project.save();
    console.log('Project updated:', project.title, project._id);
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    console.error('Edit error:', err);
    res.status(500).send('Edit failed: ' + err.message);
  }
});

router.post('/projects/:id/delete', requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid project ID');
  }

  try {
    await Project.deleteOne({ _id: id });
    console.log('Project deleted:', id);
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/users/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid user ID');
  }

  try {
    const pendingUser = await PendingUser.findById(id);
    if (!pendingUser) {
      return res.status(404).send('Pending user not found');
    }

    const existingUser = await User.findOne({ username: pendingUser.username });
    if (existingUser) {
      await PendingUser.deleteOne({ _id: id });
      return res.redirect(`${ADMIN_PATH}/dashboard`);
    }

    await User.create({
      username: pendingUser.username,
      passwordHash: pendingUser.passwordHash,
      role: 'user'
    });

    await PendingUser.deleteOne({ _id: id });
    console.log('User approved:', pendingUser.username);
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/users/:id/reject', requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid user ID');
  }

  try {
    const pendingUser = await PendingUser.findById(id);
    if (pendingUser) {
      console.log('User rejected:', pendingUser.username);
    }
    await PendingUser.deleteOne({ _id: id });
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
