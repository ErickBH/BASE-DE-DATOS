// ============================================
// SISTEMA DE AUTENTICACIÓN
// ============================================

const AUTH = {
    // Credenciales de admin (puedes cambiarlas)
    credentials: {
        username: 'admin',
        password: 'erick2024'
    },
    
    // Verificar si está autenticado
    isAuthenticated() {
        return localStorage.getItem('isAdmin') === 'true';
    },
    
    // Iniciar sesión
    login(username, password) {
        if (username === this.credentials.username && password === this.credentials.password) {
            localStorage.setItem('isAdmin', 'true');
            return true;
        }
        return false;
    },
    
    // Cerrar sesión
    logout() {
        localStorage.removeItem('isAdmin');
        window.location.reload();
    }
};

// ============================================
// MANEJO DEL MODAL DE LOGIN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const closeModal = loginModal.querySelector('.modal-close');
    const loginError = document.getElementById('loginError');
    
    // Verificar estado de autenticación al cargar
    if (AUTH.isAuthenticated()) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        showAdminFeatures();
    }
    
    // Abrir modal de login
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
        loginError.textContent = '';
    });
    
    // Cerrar modal
    closeModal.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
    
    // Procesar login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (AUTH.login(username, password)) {
            loginModal.style.display = 'none';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            showAdminFeatures();
            window.location.reload();
        } else {
            loginError.textContent = '❌ Usuario o contraseña incorrectos';
        }
    });
    
    // Cerrar sesión
    logoutBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            AUTH.logout();
        }
    });
});

// Mostrar características de admin
function showAdminFeatures() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'block';
    }
}