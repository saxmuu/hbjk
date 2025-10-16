const VercelBypassSystem = require('./bypass');

class AsiaBypass extends VercelBypassSystem {
  constructor() {
    super();
    this.region = 'ap-south-1';
    // Configurazioni specifiche per Asia
    this.requestLimit = 25; // Richieste per minuto
    this.asiaEndpoints = [
      'https://gamejoin.roblox.com',
      'https://www.roblox.com',
      'https://games.roblox.com'
    ];
  }

  getRobloxEndpoint() {
    return this.asiaEndpoints[
      Math.floor(Math.random() * this.asiaEndpoints.length)
    ];
  }

  calculateIntelligentDelay(region, gameId) {
    // Implementazione specifica per Asia con delay più corti
    const key = `${region}:${gameId}`;
    const now = Date.now();
    const regionRequests = this.requestHistory.get(key) || [];
    
    const recentRequests = regionRequests.filter(time => now - time < 60000);
    
    let delay = 0;
    
    // Strategia più aggressiva per Asia
    if (recentRequests.length >= 20) {
      delay = Math.random() * 8000 + 4000; // 4-12 secondi
    } else if (recentRequests.length >= 15) {
      delay = Math.random() * 4000 + 2000;  // 2-6 secondi
    } else if (recentRequests.length >= 10) {
      delay = Math.random() * 3000 + 1000;  // 1-4 secondi
    } else if (recentRequests.length >= 5) {
      delay = Math.random() * 2000 + 500;   // 0.5-2.5 secondi
    } else {
      delay = Math.random() * 1500;         // 0-1.5 secondi
    }
    
    recentRequests.push(now);
    this.requestHistory.set(key, recentRequests);
    
    return delay;
  }

  generateAdvancedFingerprint() {
    const fingerprint = super.generateAdvancedFingerprint();
    
    // Aggiungi headers specifici per regione Asia
    fingerprint.userAgent = this.getAsiaSpecificUserAgent();
    
    return fingerprint;
  }

  getAsiaSpecificUserAgent() {
    const asiaUserAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];
    
    return asiaUserAgents[Math.floor(Math.random() * asiaUserAgents.length)];
  }
}

module.exports = async (req, res) => {
  const bypass = new AsiaBypass();
  
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

    // Validazione aggiuntiva per input specifici
    if (gameId && !/^\d+$/.test(gameId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Game ID must contain only numbers' 
      });
    }

    const result = await bypass.executeRobloxRequest(gameId, serverId);
    
    // Log specifico per Asia
    console.log('Asia Bypass Execution:', {
      gameId: gameId.substring(0, 8) + '...',
      success: result.success,
      region: 'ap-south-1',
      timestamp: new Date().toISOString()
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(result);
  } catch (error) {
    console.error('Asia Bypass error:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      region: 'ap-south-1',
      timestamp: new Date().toISOString()
    });
  }
};
