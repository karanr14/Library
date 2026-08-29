export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password } = req.body;
  const SECRET_PASSWORD = process.env.ADMIN_PASSWORD;

  // Check if the environment variable is actually set on Vercel
  if (!SECRET_PASSWORD) {
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  if (password && password === SECRET_PASSWORD) {
    return res.status(200).json({ success: true, message: 'Access granted' });
  } else {
    return res.status(401).json({ success: false, message: 'Incorrect password' });
  }
}