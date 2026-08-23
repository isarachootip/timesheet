import express from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const router = express.Router();

// LINE OAuth Authentication
router.get('/api/auth/line', (req, res) => {
  const origin = req.query.origin || `${req.protocol}://${req.get('host')}`;
  const channelId = process.env.LINE_CHANNEL_ID;
  const callbackUrl = process.env.LINE_CALLBACK_URL;
  
  if (!channelId || !callbackUrl) {
    console.error('LINE configuration is missing in environment variables');
    return res.status(500).send('LINE configuration missing in server environment');
  }

  // Preserve the client origin in the state parameter
  const state = `state_${Math.random().toString(36).substring(2, 10)}__origin_${encodeURIComponent(origin)}`;
  const redirectUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=profile%20openid%20email`;
  res.redirect(redirectUrl);
});

router.get('/api/auth/line/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  // Extract client origin from state
  let clientOrigin = `${req.protocol}://${req.get('host')}`;
  if (state && state.includes('__origin_')) {
    try {
      const parts = state.split('__origin_');
      if (parts[1]) {
        clientOrigin = decodeURIComponent(parts[1]);
      }
    } catch (e) {
      console.error('Failed to parse origin from state:', e);
    }
  }

  if (error) {
    return res.redirect(`${clientOrigin}/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${clientOrigin}/?error=no_code_provided`);
  }
  
  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const callbackUrl = process.env.LINE_CALLBACK_URL;
  
  try {
    // 1. Exchange authorization code for token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: callbackUrl,
        client_id: channelId,
        client_secret: channelSecret
      })
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange token');
    }
    
    const idToken = tokenData.id_token;
    if (!idToken) {
      throw new Error('No ID Token returned from LINE');
    }
    
    // Decode JWT payload
    const payloadPart = idToken.split('.')[1];
    const payloadDecoded = Buffer.from(payloadPart, 'base64').toString('utf8');
    const payload = JSON.parse(payloadDecoded);
    
    const lineUserId = payload.sub; // LINE User ID (UUID)
    const lineName = payload.name;
    const linePicture = payload.picture;
    const lineEmail = payload.email; // may be undefined if not authorized
    
    if (!lineUserId) {
      throw new Error('No user ID found in LINE token');
    }
    
    // 2. Query database for user by line_user_id
    let userRes = await pool.query('SELECT * FROM users WHERE line_user_id = $1', [lineUserId]);
    let user = userRes.rows[0];
    
    // 3. Fallback: If new LINE login, check by corporate email
    if (!user && lineEmail) {
      userRes = await pool.query('SELECT * FROM users WHERE email = $1', [lineEmail]);
      user = userRes.rows[0];
      if (user) {
        // Automatically bind the LINE ID to pre-created profile
        await pool.query(
          'UPDATE users SET line_user_id = $1, avatar = COALESCE(avatar, $2) WHERE id = $3',
          [lineUserId, linePicture || `https://i.pravatar.cc/150?u=${user.id}`, user.id]
        );
        user.line_user_id = lineUserId;
        if (!user.avatar) user.avatar = linePicture;
      }
    }
    
    if (!user) {
      // User not pre-registered in database
      return res.redirect(`${clientOrigin}/?error=unauthorized&email=${encodeURIComponent(lineEmail || '')}`);
    }
    
    // Map DB columns to camelCase JS object
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      globalRole: user.global_role,
      department: user.department,
      gender: user.gender,
      birthday: user.birthday,
      skills: user.skills
    };
    
    // Redirect back to frontend success route
    res.redirect(`${clientOrigin}/login-success?user=${encodeURIComponent(JSON.stringify(userData))}`);
    
  } catch (err) {
    console.error('LINE Callback Error:', err.message);
    res.redirect(`${clientOrigin}/?error=${encodeURIComponent(err.message)}`);
  }
});


// Password Authentication Endpoint
router.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (user.password_hash && user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    if (!user.password_hash) {
      if (password === 'password123') {
        const defaultHash = crypto.createHash('sha256').update('password123').digest('hex');
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [defaultHash, user.id]);
      } else {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
      globalRole: user.global_role,
      department: user.department,
      gender: user.gender || '',
      birthday: user.birthday || '',
      skills: user.skills || []
    };

    res.json(userData);
  } catch (err) {
    console.error('Password login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});



export default router;
