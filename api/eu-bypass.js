const VercelBypassSystem = require('./bypass');

class EUBypass extends VercelBypassSystem {
  constructor() {
    super();
    this.region = 'eu-west-1';
    // Configurazioni specifiche per Europa
    this.preferredEndpoints = [
      'https://gamejoin.roblox.com',
      'https://www.roblox.com'
    ];
  }

  getRobloxEndpoint() {
    return this.preferredEndpoints[
      Math.floor(Math.random() * this.preferredEndpoints.length)
    ];
  }
}

module.exports = async (req, res) => {
  const bypass = new EUBypass();
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { gameId, serverId } = body;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }

    const result = await bypass.executeRobloxRequest(gameId, serverId);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(result);
  } catch (error) {
    console.error('EU Bypass error:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      region: 'eu-west-1'
    });
  }
};