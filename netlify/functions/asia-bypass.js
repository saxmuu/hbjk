const NetlifyBypassSystem = require('./netlify-bypass');

class AsiaBypass extends NetlifyBypassSystem {
    constructor() {
        super();
        this.region = 'ap-south-1';
    }
}

exports.handler = async (event, context) => {
    const bypass = new AsiaBypass();
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
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
        console.error('Asia Bypass error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                region: 'ap-south-1'
            })
        };
    }
};
