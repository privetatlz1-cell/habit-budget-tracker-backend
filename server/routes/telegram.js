const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRES_IN = '7d';

function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Telegram WebApp validation: secret key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return hmac === hash;
}

// POST /api/telegram/auth
router.post('/auth', async (req, res, next) => {
  try {
    const { initData } = req.body;
    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Server missing TELEGRAM_BOT_TOKEN' });
    }

    if (!verifyInitData(initData, botToken)) {
      return res.status(401).json({ error: 'Invalid Telegram initData' });
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');
    if (!userRaw) {
      return res.status(400).json({ error: 'Telegram user data missing' });
    }

    const telegramUser = JSON.parse(userRaw);
    const telegramUserId = String(telegramUser.id);

    const [user] = await User.findOrCreate({
      where: { telegramUserId },
      defaults: {
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        photoUrl: telegramUser.photo_url || null,
        lastLoginAt: new Date()
      }
    });

    user.username = telegramUser.username || user.username;
    user.firstName = telegramUser.first_name || user.firstName;
    user.lastName = telegramUser.last_name || user.lastName;
    user.photoUrl = telegramUser.photo_url || user.photoUrl;
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user.id, telegramUserId: user.telegramUserId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        telegramUserId: user.telegramUserId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
