const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { put } = require('@vercel/blob');
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
    fileSize: 50 * 1024 * 1024
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
    let imageUrl = '';
    let zipUrl = '';

    if (req.files['image']) {
      const imageFile = req.files['image'][0];
      const blob = await put(`images/${Date.now()}-${imageFile.originalname}`, imageFile.buffer, {
        access: 'public'
      });
      imageUrl = blob.url;
    }

    const zipFile = req.files['zipFile'][0];
    const zipBlob = await put(`projects/${Date.now()}-${zipFile.originalname}`, zipFile.buffer, {
      access: 'public'
    });
    zipUrl = zipBlob.url;

    const project = new Project({
      title: title,
      description: description,
      image: imageUrl,
      zipFile: zipUrl
    });

    await project.save();
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    console.error(err);
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
      const imageFile = req.files['image'][0];
      const blob = await put(`images/${Date.now()}-${imageFile.originalname}`, imageFile.buffer, {
        access: 'public'
      });
      project.image = blob.url;
    }

    if (req.files['zipFile']) {
      const zipFile = req.files['zipFile'][0];
      const zipBlob = await put(`projects/${Date.now()}-${zipFile.originalname}`, zipFile.buffer, {
        access: 'public'
      });
      project.zipFile = zipBlob.url;
    }

    await project.save();
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Edit failed: ' + err.message);
  }
});

router.post('/projects/:id/delete', requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid project ID');
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    await Project.deleteOne({ _id: id });
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
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
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/users/:id/reject', requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid user ID');
  }

  try {
    await PendingUser.deleteOne({ _id: id });
    res.redirect(`${ADMIN_PATH}/dashboard`);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
