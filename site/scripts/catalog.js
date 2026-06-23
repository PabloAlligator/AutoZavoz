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

const brandFilter = document.getElementById('catalogBrandFilter');
const countryFilter = document.getElementById('catalogCountryFilter');
const bodyFilter = document.getElementById('catalogBodyFilter');
const gearboxFilter = document.getElementById('catalogGearboxFilter');
const driveFilter = document.getElementById('catalogDriveFilter');
const resetFiltersButton = document.getElementById('catalogResetFilters');
const filteredCount = document.getElementById('catalogFilteredCount');

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

    fillFilters(cars);
    applyFilters();
    bindFilters();
  } catch (error) {
    console.error('Catalog load error:', error);

    catalogGrid.innerHTML =
      '<div class="catalog-empty">Не удалось загрузить каталог. Попробуйте позже.</div>';
  }
}

function bindFilters() {
  [
    catalogSearch,
    brandFilter,
    countryFilter,
    bodyFilter,
    gearboxFilter,
    driveFilter,
  ].forEach((element) => {
    element?.addEventListener('input', applyFilters);
    element?.addEventListener('change', applyFilters);
  });

  resetFiltersButton?.addEventListener('click', () => {
    if (catalogSearch) catalogSearch.value = '';
    if (brandFilter) brandFilter.value = '';
    if (countryFilter) countryFilter.value = '';
    if (bodyFilter) bodyFilter.value = '';
    if (gearboxFilter) gearboxFilter.value = '';
    if (driveFilter) driveFilter.value = '';

    applyFilters();
  });
}

function fillFilters(items) {
  fillSelect(brandFilter, items, 'brand');
  fillSelect(countryFilter, items, 'country');
  fillSelect(bodyFilter, items, 'body');
  fillSelect(gearboxFilter, items, 'gearbox');
  fillSelect(driveFilter, items, 'drive');
}

function fillSelect(select, items, field) {
  if (!select) return;

  const firstOption = select.querySelector('option');
  const firstOptionText = firstOption ? firstOption.textContent : 'Все';

  const values = [
    ...new Set(
      items.map((car) => String(car[field] || '').trim()).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'ru'));

  select.innerHTML = `<option value="">${escapeHtml(firstOptionText)}</option>`;

  values.forEach((value) => {
    select.insertAdjacentHTML(
      'beforeend',
      `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`,
    );
  });
}

function applyFilters() {
  const searchValue = normalize(catalogSearch?.value);
  const brandValue = normalize(brandFilter?.value);
  const countryValue = normalize(countryFilter?.value);
  const bodyValue = normalize(bodyFilter?.value);
  const gearboxValue = normalize(gearboxFilter?.value);
  const driveValue = normalize(driveFilter?.value);

  const filteredCars = cars.filter((car) => {
    const searchable = normalize(
      [
        car.title,
        car.brand,
        car.model,
        car.year,
        car.engine,
        car.drive,
        car.gearbox,
        car.body,
        car.country,
        car.city,
        car.complectation,
        car.badge,
        car.price,
      ]
        .filter(Boolean)
        .join(' '),
    );

    const matchesSearch = !searchValue || searchable.includes(searchValue);
    const matchesBrand = !brandValue || normalize(car.brand) === brandValue;
    const matchesCountry =
      !countryValue || normalize(car.country) === countryValue;
    const matchesBody = !bodyValue || normalize(car.body) === bodyValue;
    const matchesGearbox =
      !gearboxValue || normalize(car.gearbox) === gearboxValue;
    const matchesDrive = !driveValue || normalize(car.drive) === driveValue;

    return (
      matchesSearch &&
      matchesBrand &&
      matchesCountry &&
      matchesBody &&
      matchesGearbox &&
      matchesDrive
    );
  });

  if (filteredCount) {
    filteredCount.textContent = filteredCars.length;
  }

  renderCars(filteredCars);
}

function renderCars(items) {
  if (!items.length) {
    catalogGrid.innerHTML =
      '<div class="catalog-empty">По выбранным фильтрам автомобилей нет.</div>';
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
    car.previewImage || car.mainImage || car.image || '/site/img/logoIcon.png';

  const title = car.title || 'Автомобиль';
  const slug = car.slug || '';

  const url = slug ? `/cars/${encodeURIComponent(slug)}` : '/catalog.html';

  const meta = [car.year, car.mileage, car.city].filter(Boolean).join(' • ');

  const tags = [
    car.body,
    car.engine,
    car.gearbox,
    car.drive,
    car.documents,
    car.availability,
  ].filter(Boolean);

  return `
    <article
      class="cars-card cars-card--row"
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

        <span class="cars-card__photos">
          ${Array.isArray(car.images) && car.images.length ? `${car.images.length + 1} фото` : 'Фото'}
        </span>
      </div>

      <div class="cars-card__main">
        <div class="cars-card__info">
          <div class="cars-card__head">
  <h3 class="cars-card__title">${escapeHtml(title)}</h3>

  <p class="cars-card__meta-line">
    ${escapeHtml(meta || 'Характеристики уточняются')}
  </p>

  <p class="cars-card__city">
    ${escapeHtml(car.city || car.country || 'Город уточняется')}
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

          <div class="cars-card__tags">
            ${tags
              .slice(0, 6)
              .map((tag) => `<span>${escapeHtml(tag)}</span>`)
              .join('')}
          </div>

          <p class="cars-card__description">
            ${escapeHtml(car.shortDescription || car.description || 'Автомобиль доступен для расчёта и подбора под ваши требования.')}
          </p>
        </div>

        <div class="cars-card__side">
          ${
            car.badge
              ? `<span class="cars-card__badge">${escapeHtml(car.badge)}</span>`
              : ''
          }

          ${
            car.grade
              ? `<span class="cars-card__grade">${escapeHtml(car.grade)}</span>`
              : ''
          }

          <div class="cars-card__price">
            ${escapeHtml(car.price || 'Цена уточняется')}
          </div>

          ${
            car.oldPrice
              ? `<div class="cars-card__old-price">${escapeHtml(car.oldPrice)}</div>`
              : ''
          }

          <a
            class="cars-card__button"
            href="${escapeHtml(url)}"
            aria-label="Подробнее об автомобиле ${escapeHtml(title)}"
          >
            Подробнее
          </a>
        </div>
      </div>
    </article>
  `;
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
