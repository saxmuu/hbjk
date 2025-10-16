const NetlifyBypassSystem = require('./netlify-bypass');

class EUBypass extends NetlifyBypassSystem {
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

exports.handler = async (event, context) => {
  const bypass = new EUBypass();
  
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
    console.error('EU Bypass error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        region: 'eu-west-1'
      })
    };
  }
};