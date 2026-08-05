function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function ensureGuest(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/drive');
  }
  return next();
}

module.exports = {
  ensureAuthenticated,
  ensureGuest
};
