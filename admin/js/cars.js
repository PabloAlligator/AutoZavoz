document.addEventListener('DOMContentLoaded', initCarsPage);

async function initCarsPage() {
  const tableBody = document.querySelector('#carsTableBody');
  const countBox = document.querySelector('#carsCount');
  const emptyBox = document.querySelector('#carsEmpty');

  if (!tableBody) return;

  try {
    const data = await Admin.request('/api/admin/cars');
    const cars = data && Array.isArray(data.cars) ? data.cars : [];

    if (countBox) {
      countBox.textContent = `${cars.length} авто`;
    }

    if (!cars.length) {
      tableBody.innerHTML = '';
      if (emptyBox) emptyBox.hidden = false;
      return;
    }

    if (emptyBox) emptyBox.hidden = true;

    tableBody.innerHTML = cars.map(createCarRow).join('');

    bindCarStatusButtons();
    bindCarDeleteButtons();
  } catch (error) {
    console.error('Cars load error:', error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="6">Не удалось загрузить автомобили</td>
      </tr>
    `;

    if (countBox) {
      countBox.textContent = 'Ошибка загрузки';
    }
  }
}

function createCarRow(car) {
  const statusBadge = car.isActive
    ? '<span class="admin-badge admin-badge--active">Активен</span>'
    : '<span class="admin-badge admin-badge--muted">Скрыт</span>';

  const homeBadge = car.showOnHome
    ? '<span class="admin-badge admin-badge--accent">Да</span>'
    : '<span class="admin-badge admin-badge--muted">Нет</span>';

  const image =
    car.previewImage || car.mainImage || car.image || '/site/img/logoIcon.png';

  const specs = [car.year, car.mileage, car.engine, car.gearbox, car.drive]
    .filter(Boolean)
    .join(' • ');

  return `
    <tr>
      <td>
        <div class="admin-product-cell">
          <img src="${Admin.escapeHTML(image)}" alt="${Admin.escapeHTML(car.title)}" />

          <div>
            <strong>${Admin.escapeHTML(car.title)}</strong>
            <small>${Admin.escapeHTML(car.slug)}</small>
          </div>
        </div>
      </td>

      <td>
        <strong>${Admin.escapeHTML(car.price || 'Цена уточняется')}</strong>
        ${
          car.oldPrice
            ? `<small>Старая: ${Admin.escapeHTML(car.oldPrice)}</small>`
            : '<small>Без старой цены</small>'
        }
      </td>

      <td>
        <small>${Admin.escapeHTML(specs || '—')}</small>
      </td>

      <td>${statusBadge}</td>

      <td>${homeBadge}</td>

      <td>
        <div class="admin-actions">
          <a class="admin-action" href="/cars/${encodeURIComponent(car.slug)}" target="_blank">
            Открыть
          </a>

          <a class="admin-action" href="/admin/car-edit.html?id=${car.id}">
            Изменить
          </a>

          <button
            class="admin-action"
            type="button"
            data-car-status="${car.id}"
          >
            ${car.isActive ? 'Скрыть' : 'Опубликовать'}
          </button>

          <button
            class="admin-action admin-action--danger"
            type="button"
            data-car-delete="${car.id}"
          >
            Удалить
          </button>
        </div>
      </td>
    </tr>
  `;
}

function bindCarStatusButtons() {
  const buttons = document.querySelectorAll('[data-car-status]');

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const carId = button.dataset.carStatus;

      if (!carId) return;

      try {
        button.disabled = true;

        await Admin.request(`/api/admin/cars/${carId}/status`, {
          method: 'PATCH',
        });

        await initCarsPage();
      } catch (error) {
        console.error('Car status error:', error);
        alert(error.message || 'Не удалось изменить статус');
      } finally {
        button.disabled = false;
      }
    });
  });
}

function bindCarDeleteButtons() {
  const buttons = document.querySelectorAll('[data-car-delete]');

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const carId = button.dataset.carDelete;

      if (!carId) return;

      const confirmed = confirm(
        'Удалить автомобиль? Это действие нельзя отменить.',
      );

      if (!confirmed) return;

      try {
        button.disabled = true;

        await Admin.request(`/api/admin/cars/${carId}`, {
          method: 'DELETE',
        });

        await initCarsPage();
      } catch (error) {
        console.error('Car delete error:', error);
        alert(error.message || 'Не удалось удалить автомобиль');
      } finally {
        button.disabled = false;
      }
    });
  });
}
