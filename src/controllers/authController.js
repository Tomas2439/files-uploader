const bcrypt = require('bcryptjs');
const passport = require('passport');
const prisma = require('../config/prisma');

async function getRegister(req, res) {
  res.render('auth/register', { title: 'Registrarse - Odin Drive', error: null });
}

async function postRegister(req, res, next) {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password) {
    return res.render('auth/register', { title: 'Registrarse - Odin Drive', error: 'Por favor complete todos los campos.' });
  }

  if (password !== confirmPassword) {
    return res.render('auth/register', { title: 'Registrarse - Odin Drive', error: 'Las contraseñas no coinciden.' });
  }

  if (password.length < 6) {
    return res.render('auth/register', { title: 'Registrarse - Odin Drive', error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (existingUser) {
      return res.render('auth/register', { title: 'Registrarse - Odin Drive', error: 'El nombre de usuario ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword
      }
    });

    req.login(newUser, (err) => {
      if (err) return next(err);
      res.redirect('/drive');
    });
  } catch (err) {
    next(err);
  }
}

async function getLogin(req, res) {
  res.render('auth/login', { title: 'Iniciar Sesión - Odin Drive', error: null });
}

function postLogin(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render('auth/login', {
        title: 'Iniciar Sesión - Odin Drive',
        error: info ? info.message : 'Credenciales inválidas'
      });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      res.redirect('/drive');
    });
  })(req, res, next);
}

function postLogout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect('/login');
    });
  });
}

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  postLogout
};
