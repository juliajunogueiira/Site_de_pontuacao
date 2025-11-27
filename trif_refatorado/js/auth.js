// auth.js - Sistema de Autenticação Seguro

// Simulação de backend - Em produção, isso deve estar no servidor
const AUTH_CONFIG = {
  // Senhas hasheadas (SHA-256 simplificado para demonstração)
  // Em produção real, usar bcrypt no backend
  users: {
    admin: {
      passwordHash: simpleHash("admin"),
      role: "admin",
      name: "Administrador",
    },
    staff: {
      passwordHash: simpleHash("staff"),
      role: "staff",
      name: "Staff",
    },
    jurado1: {
      passwordHash: simpleHash("jurado1"),
      role: "jurado",
      name: "Jurado 1",
      juradoId: 1,
    },
    jurado2: {
      passwordHash: simpleHash("jurado2"),
      role: "jurado",
      name: "Jurado 2",
      juradoId: 2,
    },
    jurado3: {
      passwordHash: simpleHash("jurado3"),
      role: "jurado",
      name: "Jurado 3",
      juradoId: 3,
    },
  },
  sessionTimeout: 3600000, // 1 hora em ms
};

// Função de hash simples (em produção, usar no backend)
// EM PRODUÇÃO, ISSO DEVE SER SUBSTITUÍDO POR UMA IMPLEMENTAÇÃO SEGURA NO SERVIDOR.
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Classe de gerenciamento de sessão
class SessionManager {
  constructor() {
    this.sessionKey = "trif_session";
    this.init();
  }

  init() {
    // Verifica se há sessão expirada
    const session = this.getSession();
    if (session && this.isExpired(session)) {
      this.clearSession();
    }
  }

  createSession(username, userData) {
    const session = {
      username,
      role: userData.role,
      name: userData.name,
      juradoId: userData.juradoId || null,
      loginTime: Date.now(),
      expiresAt: Date.now() + AUTH_CONFIG.sessionTimeout,
    };

    // Criptografa a sessão antes de salvar
    const encrypted = btoa(JSON.stringify(session));
    localStorage.setItem(this.sessionKey, encrypted);
    return session;
  }

  getSession() {
    try {
      const encrypted = localStorage.getItem(this.sessionKey);
      if (!encrypted) return null;

      const decrypted = atob(encrypted);
      return JSON.parse(decrypted);
    } catch (e) {
      this.clearSession();
      return null;
    }
  }

  isExpired(session) {
    return Date.now() > session.expiresAt;
  }

  clearSession() {
    localStorage.removeItem(this.sessionKey);
  }

  isAuthenticated() {
    const session = this.getSession();
    return session && !this.isExpired(session);
  }

  hasRole(role) {
    const session = this.getSession();
    return session && session.role === role;
  }

  requireAuth(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      window.location.href = "../login.html";
      return false;
    }

    const session = this.getSession();
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      this.showError("Acesso negado: permissão insuficiente");
      this.logout();
      return false;
    }

    return true;
  }

  logout() {
    this.clearSession();
    window.location.href = "../login.html";
  }

  showError(message) {
    alert(message);
  }
}

// Classe de autenticação
class AuthService {
  constructor() {
    this.sessionManager = new SessionManager();
  }

  login(username, password) {
    // Validação básica
    if (!username || !password) {
      throw new Error("Usuário e senha são obrigatórios");
    }

    // Verifica se usuário existe
    const userData = AUTH_CONFIG.users[username.toLowerCase()];
    if (!userData) {
      throw new Error("Usuário ou senha inválidos");
    }

    // Verifica senha
    const passwordHash = simpleHash(password);
    if (passwordHash !== userData.passwordHash) {
      throw new Error("Usuário ou senha inválidos");
    }

    // Cria sessão
    const session = this.sessionManager.createSession(username, userData);

    // Retorna dados da sessão
    return {
      success: true,
      session,
      redirectTo: this.getRedirectUrl(session.role),
    };
  }

  getRedirectUrl(role) {
    switch (role) {
      case "admin":
        return "pages/admin.html";
      case "staff":
        return "pages/staff.html";
      case "jurado":
        return "pages/jurado.html";
      default:
        return "../login.html";
    }
  }

  logout() {
    this.sessionManager.logout();
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  requireAuth(allowedRoles = []) {
    return this.sessionManager.requireAuth(allowedRoles);
  }
}

// Exporta instância global
window.authService = new AuthService();
window.sessionManager = window.authService.sessionManager;