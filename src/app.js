require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const passport = require('./config/passport');
const PrismaSessionStore = require('./config/sessionStore');

const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const shareRoutes = require('./routes/shareRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Session configuration using Prisma store
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'odin-drive-secret-2026',
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore({
      checkExpirationInterval: 15 * 60 * 1000
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global template variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/', folderRoutes);
app.use('/', fileRoutes);
app.use('/', shareRoutes);

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/drive');
  } else {
    res.redirect('/login');
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página No Encontrada',
    message: 'La página que buscas no existe o ha sido movida.',
    user: req.user || null
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).render('error', {
    title: 'Error del Servidor',
    message: err.message || 'Ocurrió un error inesperado en el servidor.',
    user: req.user || null
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
