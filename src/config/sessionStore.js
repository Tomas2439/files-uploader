const session = require('express-session');
const prisma = require('./prisma');

class PrismaSessionStore extends session.Store {
  constructor(options = {}) {
    super(options);
    this.checkExpirationInterval = options.checkExpirationInterval || 15 * 60 * 1000; // 15 mins
    this.startCleanupInterval();
  }

  async get(sid, callback) {
    try {
      const record = await prisma.session.findUnique({
        where: { sid }
      });
      if (!record) {
        return callback(null, null);
      }
      if (record.expiresAt < new Date()) {
        await this.destroy(sid, () => {});
        return callback(null, null);
      }
      const sessionData = JSON.parse(record.data);
      return callback(null, sessionData);
    } catch (err) {
      return callback(err);
    }
  }

  async set(sid, sessionData, callback) {
    try {
      const expiresAt = sessionData.cookie && sessionData.cookie.expires
        ? new Date(sessionData.cookie.expires)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day default

      const dataStr = JSON.stringify(sessionData);

      await prisma.session.upsert({
        where: { sid },
        update: {
          data: dataStr,
          expiresAt
        },
        create: {
          id: sid,
          sid,
          data: dataStr,
          expiresAt
        }
      });
      return callback && callback(null);
    } catch (err) {
      return callback && callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await prisma.session.delete({
        where: { sid }
      }).catch(() => {});
      return callback && callback(null);
    } catch (err) {
      return callback && callback(err);
    }
  }

  async touch(sid, sessionData, callback) {
    try {
      const expiresAt = sessionData.cookie && sessionData.cookie.expires
        ? new Date(sessionData.cookie.expires)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.session.update({
        where: { sid },
        data: { expiresAt }
      }).catch(() => {});
      return callback && callback(null);
    } catch (err) {
      return callback && callback(err);
    }
  }

  startCleanupInterval() {
    setInterval(async () => {
      try {
        await prisma.session.deleteMany({
          where: { expiresAt: { lt: new Date() } }
        });
      } catch (e) {
        // ignore periodic cleanup error
      }
    }, this.checkExpirationInterval);
  }
}

module.exports = PrismaSessionStore;
