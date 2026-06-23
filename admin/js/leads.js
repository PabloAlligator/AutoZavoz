document.addEventListener('DOMContentLoaded', initLeadsPage);

async function initLeadsPage() {
  const tableBody = document.querySelector('#leadsTableBody');
  const countBox = document.querySelector('#leadsCount');
  const emptyBox = document.querySelector('#leadsEmpty');

  if (!tableBody) return;

  try {
    const data = await Admin.request('/api/admin/leads');
    const leads = data && Array.isArray(data.leads) ? data.leads : [];

    if (countBox) {
      countBox.textContent = `${leads.length} заявок`;
    }

    if (!leads.length) {
      tableBody.innerHTML = '';
      if (emptyBox) emptyBox.hidden = false;
      return;
    }

    if (emptyBox) emptyBox.hidden = true;

    tableBody.innerHTML = leads.map(createLeadRow).join('');

    bindLeadStatusSelects();
    bindLeadDeleteButtons();
  } catch (error) {
    console.error('Leads load error:', error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="7">Не удалось загрузить заявки</td>
      </tr>
    `;

    if (countBox) {
      countBox.textContent = 'Ошибка загрузки';
    }
  }
}

function createLeadRow(lead) {
  const carTitle = lead.car?.title || lead.carTitleSnapshot || '—';
  const carSlug = lead.car?.slug || lead.carSlugSnapshot || '';

  return `
    <tr>
      <td>
        <strong>${Admin.escapeHTML(lead.customerName || 'Без имени')}</strong>
        <small>${Admin.escapeHTML(lead.city || 'Город не указан')}</small>
      </td>

      <td>
        <strong>
          <a href="tel:${Admin.escapeHTML(lead.phone)}">
            ${Admin.escapeHTML(lead.phone)}
          </a>
        </strong>
        <small>${Admin.escapeHTML(lead.messenger || 'Мессенджер не указан')}</small>
      </td>

      <td>
        <strong>${Admin.escapeHTML(carTitle)}</strong>
        ${
          carSlug
            ? `<small><a href="/cars/${encodeURIComponent(carSlug)}" target="_blank">Открыть авто</a></small>`
            : '<small>Без привязки к авто</small>'
        }
      </td>

      <td>
        <small>${Admin.escapeHTML(lead.message || lead.budget || '—')}</small>
      </td>

      <td>
        <select class="admin-status-select" data-lead-status="${lead.id}">
          <option value="new" ${lead.status === 'new' ? 'selected' : ''}>
            Новая
          </option>

          <option value="in_work" ${lead.status === 'in_work' ? 'selected' : ''}>
            В работе
          </option>

          <option value="done" ${lead.status === 'done' ? 'selected' : ''}>
            Закрыта
          </option>

          <option value="cancelled" ${lead.status === 'cancelled' ? 'selected' : ''}>
            Отмена
          </option>
        </select>
      </td>

      <td>
        <small>${Admin.formatDate(lead.createdAt)}</small>
      </td>

      <td>
        <div class="admin-actions">
          <button
            class="admin-action admin-action--danger"
            type="button"
            data-lead-delete="${lead.id}"
          >
            Удалить
          </button>
        </div>
      </td>
    </tr>
  `;
}

function bindLeadStatusSelects() {
  const selects = document.querySelectorAll('[data-lead-status]');

  selects.forEach((select) => {
    select.addEventListener('change', async () => {
      const leadId = select.dataset.leadStatus;
      const status = select.value;

      if (!leadId) return;

      try {
        select.disabled = true;

        await Admin.request(`/api/admin/leads/${leadId}/status`, {
          method: 'PATCH',
          body: {
            status,
          },
        });
      } catch (error) {
        console.error('Lead status error:', error);
        alert(error.message || 'Не удалось изменить статус заявки');

        await initLeadsPage();
      } finally {
        select.disabled = false;
      }
    });
  });
}

function bindLeadDeleteButtons() {
  const buttons = document.querySelectorAll('[data-lead-delete]');

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const leadId = button.dataset.leadDelete;

      if (!leadId) return;

      const confirmed = confirm(
        'Удалить заявку? Это действие нельзя отменить.',
      );

      if (!confirmed) return;

      try {
        button.disabled = true;

        await Admin.request(`/api/admin/leads/${leadId}`, {
          method: 'DELETE',
        });

        await initLeadsPage();
      } catch (error) {
        console.error('Lead delete error:', error);
        alert(error.message || 'Не удалось удалить заявку');
      } finally {
        button.disabled = false;
      }
    });
  });
}
