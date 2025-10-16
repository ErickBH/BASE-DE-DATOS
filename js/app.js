// ============================================
// APLICACIÓN PRINCIPAL
// ============================================

let currentData = null;
let currentSemana = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando aplicación...');
    initApp();
});

async function initApp() {
    try {
        await loadData();
        renderSemanas();
        setupAdminPanel();
        setupPDFModal();
        console.log('✅ Aplicación cargada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
    }
}

// ============================================
// CARGAR DATOS DESDE GITHUB
// ============================================
async function loadData() {
    console.log('📥 Cargando datos desde GitHub...');
    
    try {
        // Cargar desde GitHub
        currentData = await GITHUB_API.getData();
        console.log('✅ Datos cargados desde GitHub');
    } catch (error) {
        console.error('❌ Error al cargar desde GitHub:', error);
        // Usar datos por defecto si falla
        currentData = GITHUB_API.getDefaultData();
        console.log('⚠️ Usando datos por defecto');
    }
    
    console.log('📊 Datos actuales:', currentData);
}

// ============================================
// RENDERIZAR SEMANAS
// ============================================
function renderSemanas() {
    console.log('🎨 Renderizando semanas...');
    
    const container = document.getElementById('semanasContainer');
    
    if (!container) {
        console.error('❌ No se encontró el contenedor de semanas');
        return;
    }
    
    container.innerHTML = '';
    
    if (!currentData || !currentData.semanas) {
        console.error('❌ No hay datos de semanas');
        return;
    }
    
    currentData.semanas.forEach(semana => {
        const card = createSemanaCard(semana);
        container.appendChild(card);
    });
    
    console.log(`✅ ${currentData.semanas.length} semanas renderizadas`);
}

function createSemanaCard(semana) {
    const card = document.createElement('div');
    card.className = 'semana-card';
    
    const isEmpty = !semana.titulo && semana.actividades.length === 0;
    
    card.innerHTML = `
        <div class="semana-header">
            <span class="semana-numero">SEMANA ${semana.numero}</span>
            <h3 class="semana-titulo">${semana.titulo || 'Sin título'}</h3>
        </div>
        
        ${!isEmpty ? `
            <p class="semana-descripcion">${semana.descripcion || 'Sin descripción'}</p>
            
            ${semana.actividades.length > 0 ? `
                <div class="actividades-list">
                    ${semana.actividades.map((act, index) => `
                        <div class="actividad-item">
                            <span class="actividad-nombre" onclick="openPDF('${act.url}', '${act.nombre}')">
                                📄 ${act.nombre}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <a href="https://github.com/ErickBH/BASE-DE-DATOS/tree/main/semana-${semana.numero}" 
               target="_blank" 
               class="btn-github">
                🔗 Ver en GitHub
            </a>
        ` : `
            <div class="semana-empty">
                📝 Esta semana aún no tiene contenido
            </div>
        `}
    `;
    
    return card;
}

// ============================================
// PANEL DE ADMINISTRACIÓN
// ============================================
function setupAdminPanel() {
    console.log('⚙️ Configurando panel de administración...');
    
    const semanaSelect = document.getElementById('semanaSelect');
    const tituloInput = document.getElementById('tituloInput');
    const descripcionInput = document.getElementById('descripcionInput');
    const pdfUpload = document.getElementById('pdfUpload');
    const fileName = document.getElementById('fileName');
    const guardarBtn = document.getElementById('guardarBtn');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    
    if (!semanaSelect) {
        console.error('❌ No se encontró el panel de administración');
        return;
    }
    
    // Llenar el select de semanas
    currentData.semanas.forEach(semana => {
        const option = document.createElement('option');
        option.value = semana.numero;
        option.textContent = `Semana ${semana.numero}`;
        semanaSelect.appendChild(option);
    });
    
    // Cambiar de semana
    semanaSelect.addEventListener('change', (e) => {
        const semanaNum = parseInt(e.target.value);
        if (semanaNum) {
            currentSemana = currentData.semanas.find(s => s.numero === semanaNum);
            tituloInput.value = currentSemana.titulo || '';
            descripcionInput.value = currentSemana.descripcion || '';
            renderActividadesAdmin();
            console.log(`📌 Semana ${semanaNum} seleccionada`);
        }
    });
    
    // Mostrar nombre del archivo seleccionado
    pdfUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileName.textContent = e.target.files[0].name;
        }
    });
    
    // Guardar cambios
    guardarBtn.addEventListener('click', async () => {
        if (!currentSemana) {
            alert('⚠️ Selecciona una semana primero');
            return;
        }
        
        console.log('💾 Guardando cambios en GitHub...');
        
        guardarBtn.textContent = '⏳ Guardando...';
        guardarBtn.disabled = true;
        
        try {
            // Actualizar título y descripción
            currentSemana.titulo = tituloInput.value.trim();
            currentSemana.descripcion = descripcionInput.value.trim();
            
            // Subir PDF si hay uno seleccionado
            const file = pdfUpload.files[0];
            if (file) {
                if (file.type !== 'application/pdf') {
                    alert('⚠️ Solo se permiten archivos PDF');
                    guardarBtn.textContent = '💾 Guardar Cambios';
                    guardarBtn.disabled = false;
                    return;
                }
                
                console.log(`📤 Subiendo PDF: ${file.name}`);
                
                // Subir PDF a GitHub
                const uploadResult = await GITHUB_API.uploadPDF(
                    currentSemana.numero,
                    file.name,
                    file
                );
                
                if (!uploadResult.success) {
                    throw new Error('Error al subir el PDF a GitHub');
                }
                
                // Agregar actividad con URL de GitHub
                const actividadNombre = file.name.replace('.pdf', '');
                currentSemana.actividades.push({
                    nombre: actividadNombre,
                    archivo: file.name,
                    url: uploadResult.url
                });
                
                // Resetear input
                pdfUpload.value = '';
                fileName.textContent = '';
                
                console.log(`✅ PDF subido correctamente: ${uploadResult.url}`);
            }
            
            // Guardar datos en GitHub
            const success = await GITHUB_API.saveData(currentData);
            
            if (!success) {
                throw new Error('Error al guardar en GitHub');
            }
            
            // Actualizar vista
            renderSemanas();
            renderActividadesAdmin();
            
            alert('✅ Cambios guardados correctamente en GitHub');
            console.log('✅ Datos guardados en GitHub');
            
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            alert('❌ Error al guardar: ' + error.message);
        } finally {
            guardarBtn.textContent = '💾 Guardar Cambios';
            guardarBtn.disabled = false;
        }
    });
    
    // Cerrar panel admin
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            document.getElementById('adminPanel').style.display = 'none';
        });
    }
    
    console.log('✅ Panel de administración configurado');
}

function renderActividadesAdmin() {
    const container = document.getElementById('listaActividadesAdmin');
    
    if (!container) return;
    
    if (!currentSemana || currentSemana.actividades.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 2rem;">📭 No hay actividades</p>';
        return;
    }
    
    container.innerHTML = currentSemana.actividades.map((act, index) => `
        <div class="actividad-item">
            <span class="actividad-nombre">📄 ${act.nombre}</span>
            <button class="btn-delete" onclick="deleteActividad(${index})">🗑️ Eliminar</button>
        </div>
    `).join('');
}

async function deleteActividad(index) {
    if (!currentSemana) return;
    
    if (confirm('¿Eliminar esta actividad?')) {
        console.log('🗑️ Eliminando actividad...');
        
        currentSemana.actividades.splice(index, 1);
        
        // Guardar en GitHub
        const success = await GITHUB_API.saveData(currentData);
        
        if (success) {
            renderSemanas();
            renderActividadesAdmin();
            console.log('✅ Actividad eliminada');
        } else {
            alert('❌ Error al eliminar de GitHub');
        }
    }
}

// ============================================
// VISOR DE PDF
// ============================================
function openPDF(url, nombre) {
    console.log(`📄 Abriendo PDF: ${nombre}`);
    
    const modal = document.getElementById('pdfModal');
    const viewer = document.getElementById('pdfViewer');
    const title = document.getElementById('pdfTitle');
    
    if (modal && viewer && title) {
        title.textContent = nombre;
        
        // Usar visor de Google Docs para PDFs de GitHub
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        viewer.src = viewerUrl;
        
        modal.style.display = 'block';
    }
}

function openPDF(url, nombre) {
    console.log(`📄 Abriendo PDF: ${nombre}`);
    
    const modal = document.getElementById('pdfModal');
    const viewer = document.getElementById('pdfViewer');
    const title = document.getElementById('pdfTitle');
    
    if (modal && viewer && title) {
        title.textContent = nombre;
        viewer.src = url;
        modal.style.display = 'block';
    }
}

// Hacer funciones globales
window.openPDF = openPDF;
window.deleteActividad = deleteActividad;