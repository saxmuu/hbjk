const axios = require('axios');
const crypto = require('crypto');

// Database di fingerprints avanzati
const FINGERPRINT_DATABASE = {
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  ],
  
  acceptHeaders: [
    'application/json, text/plain, */*',
    'application/json, text/javascript, */*',
    'application/json, */*'
  ],
  
  languages: [
    'en-US,en;q=0.9',
    'en-GB,en;q=0.8,en-US;q=0.7',
    'es-ES,es;q=0.8,en;q=0.6',
    'fr-FR,fr;q=0.9,en;q=0.8'
  ],
  
  encodings: [
    'gzip, deflate, br',
    'gzip, deflate',
    'br, gzip, deflate'
  ]
};

class NetlifyBypassSystem {
  constructor() {
    this.region = process.env.AWS_REGION || 'unknown';
    this.requestHistory = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldRequests();
    }, 60000);
  }

  generateAdvancedFingerprint() {
    const timestamp = Date.now();
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    return {
      userAgent: FINGERPRINT_DATABASE.userAgents[
        Math.floor(Math.random() * FINGERPRINT_DATABASE.userAgents.length)
      ],
      accept: FINGERPRINT_DATABASE.acceptHeaders[
        Math.floor(Math.random() * FINGERPRINT_DATABASE.acceptHeaders.length)
      ],
      acceptLanguage: FINGERPRINT_DATABASE.languages[
        Math.floor(Math.random() * FINGERPRINT_DATABASE.languages.length)
      ],
      acceptEncoding: FINGERPRINT_DATABASE.encodings[
        Math.floor(Math.random() * FINGERPRINT_DATABASE.encodings.length)
      ],
      xCsrfToken: crypto.randomBytes(32).toString('hex'),
      xRequestId: crypto.randomBytes(16).toString('hex'),
      sessionId: sessionId,
      timestamp: timestamp
    };
  }

  calculateIntelligentDelay(region, gameId) {
    const key = `${region}:${gameId}`;
    const now = Date.now();
    const regionRequests = this.requestHistory.get(key) || [];
    
    // Filtra richieste negli ultimi 60 secondi
    const recentRequests = regionRequests.filter(time => now - time < 60000);
    
    let delay = 0;
    
    // Strategia di delay basata sul carico
    if (recentRequests.length >= 15) {
      delay = Math.random() * 10000 + 5000; // 5-15 secondi
    } else if (recentRequests.length >= 10) {
      delay = Math.random() * 5000 + 2000;  // 2-7 secondi
    } else if (recentRequests.length >= 5) {
      delay = Math.random() * 3000 + 1000;  // 1-4 secondi
    } else {
      delay = Math.random() * 2000;         // 0-2 secondi
    }
    
    recentRequests.push(now);
    this.requestHistory.set(key, recentRequests);
    
    return delay;
  }

  cleanupOldRequests() {
    const now = Date.now();
    for (const [key, requests] of this.requestHistory.entries()) {
      const recent = requests.filter(time => now - time < 120000); // 2 minuti
      if (recent.length === 0) {
        this.requestHistory.delete(key);
      } else {
        this.requestHistory.set(key, recent);
      }
    }
  }

  async executeRobloxRequest(gameId, serverId, attempt = 0) {
    const fingerprint = this.generateAdvancedFingerprint();
    
    // Delay intelligente basato sul carico
    const delay = this.calculateIntelligentDelay(this.region, gameId);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const headers = {
        'User-Agent': fingerprint.userAgent,
        'Accept': fingerprint.accept,
        'Accept-Language': fingerprint.acceptLanguage,
        'Accept-Encoding': fingerprint.acceptEncoding,
        'Content-Type': 'application/json',
        'X-CSRF-Token': fingerprint.xCsrfToken,
        'X-Request-ID': fingerprint.xRequestId,
        'Origin': 'https://www.roblox.com',
        'Referer': `https://www.roblox.com/games/${gameId}/`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      const requestData = {
        placeId: gameId,
        serverId: serverId || null,
        gameJoinType: 'ServerHop',
        _t: Date.now(),
        bypassSession: fingerprint.sessionId,
        source: `Netlify-${this.region}`,
        attempt: attempt
      };

      const response = await axios({
        method: 'POST',
        url: 'https://gamejoin.roblox.com/v1/join-game',
        data: requestData,
        headers: headers,
        timeout: 15000,
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        },
        // Rotazione degli endpoint Roblox
        baseURL: this.getRobloxEndpoint()
      });

      return this.handleResponse(response, fingerprint);

    } catch (error) {
      return this.handleError(error, attempt, gameId, serverId);
    }
  }

  getRobloxEndpoint() {
    const endpoints = [
      'https://gamejoin.roblox.com',
      'https://games.roblox.com',
      'https://www.roblox.com'
    ];
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  handleResponse(response, fingerprint) {
    const result = {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      region: this.region,
      fingerprint: {
        userAgent: fingerprint.userAgent,
        sessionId: fingerprint.sessionId
      },
      timestamp: new Date().toISOString()
    };

    // Analytics logging
    console.log('Netlify Bypass Result:', {
      success: result.success,
      status: result.status,
      region: result.region,
      sessionId: fingerprint.sessionId
    });

    return result;
  }

  async handleError(error, attempt, gameId, serverId) {
    console.error(`Netlify ${this.region} attempt ${attempt} failed:`, {
      error: error.message,
      gameId: gameId,
      serverId: serverId
    });

    // Strategia di retry con backoff esponenziale
    if (attempt < 3) {
      const backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      return this.executeRobloxRequest(gameId, serverId, attempt + 1);
    }

    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
      region: this.region,
      attempt: attempt
    };
  }
}

// Handler principale Netlify Function
exports.handler = async (event, context) => {
  // Configurazione CORS completa
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed. Use POST.' 
      })
    };
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        })
      };
    }

    const { gameId, serverId, action = 'join' } = body;

    // Validazione input
    if (!gameId || typeof gameId !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Valid gameId (string) is required'
        })
      };
    }

    if (serverId && typeof serverId !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'serverId must be a string if provided'
        })
      };
    }

    // Inizializza sistema bypass
    const bypassSystem = new NetlifyBypassSystem();
    
    // Esegui la richiesta
    const result = await bypassSystem.executeRobloxRequest(gameId, serverId);

    // Log di sicurezza
    console.log('Netlify Bypass Execution:', {
      gameId: gameId.substring(0, 8) + '...',
      success: result.success,
      region: result.region,
      status: result.status,
      timestamp: new Date().toISOString(),
      clientIP: event.headers['client-ip'] || event.headers['x-forwarded-for']
    });

    // Risposta al client
    return {
      statusCode: result.success ? 200 : (result.status || 500),
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Netlify function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        region: process.env.AWS_REGION || 'unknown',
        timestamp: new Date().toISOString()
      })
    };
  }
};