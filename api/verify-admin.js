export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  // Check against the hidden Vercel environment variable
  if (token === process.env.ADMIN_DEVICE_ID) {
    return res.status(200).json({ authorized: true });
  } else {
    return res.status(401).json({ authorized: false });
  }
}