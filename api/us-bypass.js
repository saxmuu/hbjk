const VercelBypassSystem = require('./bypass');

class USBypass extends VercelBypassSystem {
  constructor() {
    super();
    this.region = 'us-east-1';
    // Configurazioni specifiche per Nord America
    this.requestLimit = 20; // Richieste per minuto
  }

  calculateIntelligentDelay(region, gameId) {
    // Implementazione più aggressiva per US
    const baseDelay = super.calculateIntelligentDelay(region, gameId);
    return baseDelay * 0.7; // 30% più veloce
  }
}

module.exports = async (req, res) => {
  const bypass = new USBypass();
  
  // Stesso handler di eu-bypass.js ma con USBypass
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
    console.error('US Bypass error:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      region: 'us-east-1'
    });
  }
};