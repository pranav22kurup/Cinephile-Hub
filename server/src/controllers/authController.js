const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { sub: user._id.toString(), role: user.role, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};