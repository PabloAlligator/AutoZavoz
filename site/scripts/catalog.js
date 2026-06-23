const burger = document.querySelector('.header__burger');
const mobileMenu = document.querySelector('.mobile-menu');
const overlay = document.querySelector('.mobile-menu-overlay');
const mobileLinks = document.querySelectorAll('.mobile-menu a');
const header = document.querySelector('.header');

if (burger && mobileMenu && overlay) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  });

  overlay.addEventListener('click', closeMenu);
  mobileLinks.forEach((link) => link.addEventListener('click', closeMenu));
}

function closeMenu() {
  burger?.classList.remove('active');
  mobileMenu?.classList.remove('active');
  overlay?.classList.remove('active');
  document.body.classList.remove('menu-open');
}

if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  });
}

const catalogGrid = document.getElementById('catalogGrid');
const catalogSearch = document.getElementById('catalogSearch');

let cars = [];

document.addEventListener('DOMContentLoaded', loadCars);

async function loadCars() {
  if (!catalogGrid) return;

  try {
    const response = await fetch('/api/cars');
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Ошибка загрузки каталога');
    }

    cars = Array.isArray(data.cars) ? data.cars : [];

    const catalogHeroCount = document.getElementById('catalogHeroCount');

    if (catalogHeroCount) {
      catalogHeroCount.textContent = cars.length;
    }

    renderCars(cars);
  } catch (error) {
    console.error('Catalog load error:', error);

    catalogGrid.innerHTML =
      '<div class="catalog-empty">Не удалось загрузить каталог. Попробуйте позже.</div>';
  }
}

function renderCars(items) {
  if (!items.length) {
    catalogGrid.innerHTML =
      '<div class="catalog-empty">Автомобили скоро появятся в каталоге.</div>';
    return;
  }

  catalogGrid.innerHTML = items.map(createCarCard).join('');

  document.querySelectorAll('.cars-card').forEach((card) => {
    card.addEventListener('click', () => {
      const url = card.dataset.url;

      if (!url) return;

      window.location.href = url;
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;

      const url = card.dataset.url;

      if (!url) return;

      window.location.href = url;
    });
  });
}

function createCarCard(car) {
  const image =
    car.previewImage ||
    car.mainImage ||
    car.image ||
    '/site/img/logoIcon.png';

  const title = car.title || 'Автомобиль';
  const slug = car.slug || '';

  const url = slug ? `/cars/${encodeURIComponent(slug)}` : '/catalog.html';

  return `
    <article
      class="cars-card"
      role="listitem"
      tabindex="0"
      data-url="${escapeHtml(url)}"
    >
      <div class="cars-card__image">
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(title)}"
          loading="lazy"
          decoding="async"
        >

        <span class="cars-card__badge">
          ${escapeHtml(car.badge || 'Под заказ')}
        </span>

        <span class="cars-card__grade">
          ${escapeHtml(car.grade || '—')}
        </span>
      </div>

      <div class="cars-card__content">
        <div class="cars-card__head">
          <h3 class="cars-card__title">${escapeHtml(title)}</h3>

          <p class="cars-card__complectation">
            ${escapeHtml(car.complectation || 'Комплектация уточняется')}
          </p>
        </div>

        <div class="cars-card__specs">
          <div>
            <span>Год</span>
            <strong>${escapeHtml(car.year || '—')}</strong>
          </div>

          <div>
            <span>Пробег</span>
            <strong>${escapeHtml(car.mileage || '—')}</strong>
          </div>

          <div>
            <span>Двигатель</span>
            <strong>${escapeHtml(car.engine || '—')}</strong>
          </div>

          <div>
            <span>Привод</span>
            <strong>${escapeHtml(car.drive || '—')}</strong>
          </div>
        </div>

        <div class="cars-card__bottom">
          <div>
            <span class="cars-card__price-label">Стоимость под ключ</span>

            <div class="cars-card__price">
              ${escapeHtml(car.price || 'Цена уточняется')}
            </div>
          </div>

          <button
            type="button"
            class="cars-card__arrow"
            aria-label="Подробнее об автомобиле ${escapeHtml(title)}"
          >
            ›
          </button>
        </div>
      </div>
    </article>
  `;
}

catalogSearch?.addEventListener('input', () => {
  const value = catalogSearch.value.trim().toLowerCase();

  const filteredCars = cars.filter((car) => {
    const searchable = [
      car.title,
      car.brand,
      car.model,
      car.year,
      car.engine,
      car.drive,
      car.gearbox,
      car.complectation,
      car.badge,
      car.price,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(value);
  });

  renderCars(filteredCars);
});

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
