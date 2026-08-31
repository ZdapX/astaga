const express = require('express');
const path = require('path');
const router = express.Router();
const Project = require('../models/Project');
const mongoose = require('mongoose');

router.get('/projects/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).render('404', { user: req.session.user || null });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).render('404', { user: req.session.user || null });
    }

    res.render('projects/detail', {
      user: req.session.user || null,
      project: project
    });
  } catch (err) {
    res.status(500).render('500', { user: req.session.user || null });
  }
});

router.get('/projects/:id/download', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send('Project not found');
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    const filePath = path.join(__dirname, '../public/uploads/projects', project.zipFile);
    res.download(filePath, `${project.title}.zip`, (err) => {
      if (err) {
        res.status(404).send('File not found');
      }
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
