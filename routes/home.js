const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).maxTimeMS(30000);
    res.render('home', {
      user: req.session.user || null,
      projects: projects
    });
  } catch (err) {
    console.error('Home error:', err.message);
    res.status(500).send('Database timeout');
  }
});

module.exports = router;
