const express = require('express');
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
    console.error('Project detail error:', err);
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

    if (!project.zipFile) {
      return res.status(404).send('Zip file not found');
    }

    const buffer = Buffer.from(project.zipFile, 'base64');
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="${project.title}.zip"`);
    res.send(buffer);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
