require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

connectDB();

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
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

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.admin = req.session.admin || null;
  next();
});

app.use('/', authRoutes);
app.use('/', projectRoutes);
app.use(process.env.ADMIN_PATH || '/control-x7k9', adminRoutes);

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.redirect('/login');
});

app.get('/home', async (req, res) => {
  try {
    await connectDB();
    const Project = require('./models/Project');
    const projects = await Project.find().sort({ createdAt: -1 }).maxTimeMS(15000);
    res.render('home', {
      user: req.session.user || null,
      projects: projects
    });
  } catch (err) {
    console.error('Home error:', err.message);
    if (err.message && err.message.includes('buffering timed out')) {
      res.status(500).send('Database connection timeout. Please refresh the page.');
    } else {
      res.status(500).send('Server error: ' + err.message);
    }
  }
});

app.get('/test-db', async (req, res) => {
  try {
    await connectDB();
    const Project = require('./models/Project');
    const count = await Project.countDocuments().maxTimeMS(15000);
    const projects = await Project.find().limit(5).maxTimeMS(15000);
    res.json({
      status: 'connected',
      count: count,
      projects: projects.map(p => ({
        title: p.title,
        id: p._id
      }))
    });
  } catch (err) {
    console.error('Test DB error:', err.message);
    res.status(500).json({ 
      status: 'error',
      error: err.message 
    });
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
