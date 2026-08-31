const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

app.use('/', authRoutes);
app.use('/', projectRoutes);
app.use(process.env.ADMIN_PATH || '/control-x7k9', adminRoutes);

app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get('/home', async (req, res) => {
  try {
    const Project = require('./models/Project');
    const projects = await Project.find().sort({ createdAt: -1 });
    res.render('home', {
      user: req.session.user || null,
      projects: projects
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.use((req, res) => {
  res.status(404).render('404', { user: req.session.user || null });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { user: req.session.user || null });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ProjectLab running on port ${PORT}`);
  });
}
