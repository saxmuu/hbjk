const NetlifyBypassSystem = require('./netlify-bypass');

class USBypass extends NetlifyBypassSystem {
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

exports.handler = async (event, context) => {
  const bypass = new USBypass();
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { gameId, serverId } = body;

    if (!gameId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'gameId is required' })
      };
    }

    const result = await bypass.executeRobloxRequest(gameId, serverId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('US Bypass error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        region: 'us-east-1'
      })
    };
  }
};