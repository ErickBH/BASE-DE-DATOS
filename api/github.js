// api/github.js - Servidor intermedio para GitHub API
export default async function handler(req, res) {
    // ✅ Token seguro desde variable de entorno
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = 'ErickBH';
    const GITHUB_REPO = 'BASE-DE-DATOS';
    
    // Verificar que el token existe
    if (!GITHUB_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'Token de GitHub no configurado. Agrega GITHUB_TOKEN en las variables de entorno.'
        });
    }
    
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Responder a preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // Obtener datos del body
        const { action, path, content, message, sha } = req.body || {};
        
        // Construir URL de GitHub API
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
        
        // Configurar opciones de fetch
        const fetchOptions = {
            method: action === 'read' ? 'GET' : 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'Portafolio-BD-App'
            }
        };
        
        // Agregar body si no es lectura
        if (action !== 'read' && content) {
            const bodyData = {
                message: message || 'Actualización desde portafolio',
                content: content
            };
            
            // Agregar SHA si existe (para actualizar archivos existentes)
            if (sha) {
                bodyData.sha = sha;
            }
            
            fetchOptions.body = JSON.stringify(bodyData);
        }
        
        // Hacer petición a GitHub
        const response = await fetch(url, fetchOptions);
        const data = await response.json();
        
        // Verificar si hubo error
        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        // Retornar respuesta exitosa
        return res.status(200).json({
            success: true,
            data: data
        });
        
    } catch (error) {
        console.error('❌ Error en API:', error.message);
        
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}