const Admin = (() => {
  function redirectToLogin() {
    window.location.href = '/admin/login.html';
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function request(url, options = {}) {
    const headers = {
      ...(options.headers || {}),
    };

    const config = {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers,
    };

    if (options.body !== undefined) {
      const isFormData = options.body instanceof FormData;

      if (isFormData) {
        config.body = options.body;
      } else {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      redirectToLogin();
      return null;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка запроса');
    }

    return data;
  }

  async function checkAuth() {
    return request('/api/admin/me');
  }

  function setActiveNav() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('[data-admin-nav]');

    links.forEach((link) => {
      const href = link.getAttribute('href');

      if (href === currentPath) {
        link.classList.add('active');
      }
    });
  }

  function bindLogout() {
    const logoutButtons = document.querySelectorAll('[data-admin-logout]');

    logoutButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          button.disabled = true;
          button.textContent = 'Выходим...';

          await request('/api/admin/logout', {
            method: 'POST',
          });

          redirectToLogin();
        } catch (error) {
          console.error('Logout error:', error);
          alert('Не удалось выйти из админки');
        } finally {
          button.disabled = false;
          button.textContent = 'Выйти';
        }
      });
    });
  }

  async function init() {
    try {
      await checkAuth();
      setActiveNav();
      bindLogout();
    } catch (error) {
      console.error('Admin init error:', error);
    }
  }

  return {
    init,
    request,
    escapeHTML,
    formatDate,
  };
})();

document.addEventListener('DOMContentLoaded', Admin.init);
