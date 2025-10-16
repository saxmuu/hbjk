const axios = require('axios');
const crypto = require('crypto');

// Configurazione per testing educativo
const CONFIG = {
    MAX_REQUESTS_PER_MINUTE: 5,
    ENABLE_RATE_LIMITING: true,
    SAFE_MODE: true,
    TEST_MODE: true
};

class NetlifyBypassSystem {
    constructor() {
        this.region = process.env.AWS_REGION || 'unknown';
        this.requestCount = 0;
        this.lastRequestTime = 0;
    }

    generateFingerprint() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ];

        return {
            userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
            accept: 'application/json, text/plain, */*',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br',
            xCsrfToken: crypto.randomBytes(32).toString('hex'),
            xRequestId: crypto.randomBytes(16).toString('hex')
        };
    }

    async safeDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        // Minimum 10 seconds between requests in safe mode
        if (timeSinceLastRequest < 10000) {
            await new Promise(resolve => setTimeout(resolve, 10000 - timeSinceLastRequest));
        }
        
        this.lastRequestTime = Date.now();
    }

    async executeRobloxRequest(gameId, serverId, attempt = 0) {
        // Safe mode check
        if (CONFIG.SAFE_MODE && this.requestCount >= CONFIG.MAX_REQUESTS_PER_MINUTE) {
            throw new Error('Safe mode: Rate limit raggiunto');
        }

        await this.safeDelay();
        this.requestCount++;

        const fingerprint = this.generateFingerprint();

        try {
            console.log(`🔄 Tentativo ${attempt + 1} per game ${gameId} da regione ${this.region}`);

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
                'Sec-Fetch-Site': 'same-site'
            };

            const requestData = {
                placeId: gameId,
                serverId: serverId || null,
                gameJoinType: 'ServerHop',
                _t: Date.now(),
                source: `Netlify-${this.region}`,
                attempt: attempt
            };

            // ⚠️ URL REALE ROBLOX - SOLO PER TEST EDUCATIVI
            const response = await axios({
                method: 'POST',
                url: 'https://gamejoin.roblox.com/v1/join-game',
                data: requestData,
                headers: headers,
                timeout: 10000,
                validateStatus: function (status) {
                    return status < 600; // Accetta tutti gli status codes
                }
            });

            console.log(`📡 Risposta Roblox - Status: ${response.status}`);

            return this.handleResponse(response);

        } catch (error) {
            console.error(`❌ Errore tentativo ${attempt + 1}:`, error.message);
            return this.handleError(error, attempt, gameId, serverId);
        }
    }

    handleResponse(response) {
        const result = {
            success: response.status >= 200 && response.status < 300,
            status: response.status,
            data: response.data,
            region: this.region,
            timestamp: new Date().toISOString(),
            requestId: crypto.randomBytes(8).toString('hex')
        };

        // Log dettagliato per analisi
        console.log('📊 Risultato richiesta:', {
            success: result.success,
            status: result.status,
            region: result.region,
            hasData: !!result.data
        });

        return result;
    }

    async handleError(error, attempt, gameId, serverId) {
        // Backoff esponenziale per retry
        if (attempt < 2) {
            const backoffTime = Math.pow(2, attempt) * 2000;
            console.log(`⏳ Retry in ${backoffTime}ms...`);
            
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
    console.log('🚀 Netlify Function avviata', {
        method: event.httpMethod,
        path: event.path,
        region: process.env.AWS_REGION,
        timestamp: new Date().toISOString()
    });

    // Configurazione headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    // Gestione preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Solo metodo POST permesso
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
        // Parsing del body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid JSON nel body della richiesta'
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
                    error: 'gameId valido (stringa) è richiesto'
                })
            };
        }

        // Validazione formato gameId (solo numeri)
        if (!/^\d+$/.test(gameId)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Game ID deve contenere solo numeri'
                })
            };
        }

        console.log('🎯 Processing request for game:', {
            gameId: gameId.substring(0, 8) + '...',
            serverId: serverId || 'auto',
            action: action,
            clientIP: event.headers['client-ip'] || event.headers['x-forwarded-for']
        });

        // Inizializza sistema e esegui richiesta
        const bypassSystem = new NetlifyBypassSystem();
        const result = await bypassSystem.executeRobloxRequest(gameId, serverId);

        // Log finale
        console.log('✅ Richiesta completata:', {
            gameId: gameId.substring(0, 8) + '...',
            success: result.success,
            status: result.status,
            region: result.region
        });

        return {
            statusCode: result.success ? 200 : (result.status || 500),
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('💥 Errore nella function:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Errore interno del server',
                region: process.env.AWS_REGION || 'unknown',
                timestamp: new Date().toISOString()
            })
        };
    }
};
