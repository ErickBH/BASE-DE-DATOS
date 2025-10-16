// ============================================
// GITHUB API - USANDO SERVIDOR INTERMEDIO
// ============================================

const GITHUB_CONFIG = {
    owner: 'ErickBH',
    repo: 'BASE-DE-DATOS',
    branch: 'main',
    // Usar API local en desarrollo, Vercel en producción
    apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api/github'
        : '/api/github'
};

const GITHUB_API = {
    
    // Subir un archivo PDF a GitHub a través de nuestra API
    async uploadPDF(semanaNum, fileName, fileContent) {
        try {
            console.log(`📤 Subiendo ${fileName} a semana ${semanaNum}...`);
            
            const path = `semanas/semana-${semanaNum}/${fileName}`;
            
            // Convertir el archivo a base64
            const base64Content = await this.fileToBase64(fileContent);
            
            // Llamar a nuestra API en lugar de GitHub directamente
            const response = await fetch(GITHUB_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'upload',
                    path: path,
                    content: base64Content,
                    message: `Agregar ${fileName} a semana ${semanaNum}`
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Archivo subido correctamente');
                return {
                    success: true,
                    url: result.data.content?.download_url || '',
                    htmlUrl: result.data.content?.html_url || ''
                };
            } else {
                throw new Error(result.error || 'Error al subir el archivo');
            }
            
        } catch (error) {
            console.error('❌ Error en uploadPDF:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    },
    
    // Convertir archivo a base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remover el prefijo data:application/pdf;base64,
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    // Leer datos desde GitHub
    async getData() {
        try {
            console.log('📥 Leyendo datos desde GitHub...');
            
            const response = await fetch(GITHUB_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'read',
                    path: 'data/semanas.json'
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.data.content) {
                const content = atob(result.data.content);
                console.log('✅ Datos leídos correctamente');
                return JSON.parse(content);
            }
            
            console.log('⚠️ No se encontraron datos, usando datos por defecto');
            return this.getDefaultData();
            
        } catch (error) {
            console.error('❌ Error al leer datos:', error);
            return this.getDefaultData();
        }
    },
    
    // Guardar datos en GitHub
    async saveData(data) {
        try {
            console.log('💾 Guardando datos en GitHub...');
            
            // Primero intentar leer el archivo actual para obtener el SHA
            const currentFile = await fetch(GITHUB_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'read',
                    path: 'data/semanas.json'
                })
            });
            
            let sha = null;
            if (currentFile.ok) {
                const fileData = await currentFile.json();
                sha = fileData.data?.sha;
            }
            
            // Convertir datos a base64
            const content = btoa(JSON.stringify(data, null, 2));
            
            // Guardar archivo
            const response = await fetch(GITHUB_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save',
                    path: 'data/semanas.json',
                    content: content,
                    message: 'Actualizar datos de semanas',
                    sha: sha
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Datos guardados correctamente');
                return true;
            }
            
            throw new Error(result.error || 'Error al guardar datos');
            
        } catch (error) {
            console.error('❌ Error al guardar datos:', error);
            return false;
        }
    },
    
    // Datos por defecto (16 semanas vacías)
    getDefaultData() {
        const semanas = [];
        for (let i = 1; i <= 16; i++) {
            semanas.push({
                numero: i,
                titulo: '',
                descripcion: '',
                actividades: []
            });
        }
        return { semanas };
    }
};

// ============================================
// ALMACENAMIENTO LOCAL (FALLBACK)
// ============================================

const LOCAL_STORAGE = {
    key: 'portafolio_bd_data',
    
    // Obtener datos del localStorage
    getData() {
        const data = localStorage.getItem(this.key);
        if (data) {
            return JSON.parse(data);
        }
        return GITHUB_API.getDefaultData();
    },
    
    // Guardar datos en localStorage
    saveData(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
        return true;
    }
};