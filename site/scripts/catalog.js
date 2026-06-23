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

    catalogGrid.innerHTML = `
      <div class="catalog-empty">
        Не удалось загрузить каталог. Попробуйте позже.
      </div>
    `;
  }
}

function renderCars(items) {
  if (!catalogGrid) return;

  if (!items.length) {
    catalogGrid.innerHTML = `
      <div class="catalog-empty">
        Автомобили скоро появятся в каталоге.
      </div>
    `;
    return;
  }

  catalogGrid.innerHTML = items.map(createCarCard).join('');

  document.querySelectorAll('.cars-card[data-url]').forEach((card) => {
    card.addEventListener('click', (event) => {
      const interactiveElement = event.target.closest('a, button');

      if (interactiveElement) return;

      window.location.href = card.dataset.url;
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        window.location.href = card.dataset.url;
      }
    });
  });
}

function createCarCard(car) {
  const image = car.previewImage || car.mainImage || car.image || '/site/img/logoIcon.png';
  const title = car.title || 'Автомобиль';
  const slug = car.slug || '';
  const carUrl = slug ? `/cars/${encodeURIComponent(slug)}` : '/catalog.html';

  const meta = [
    car.year,
    car.mileage,
    car.engine,
    car.drive,
    car.gearbox,
  ]
    .filter(Boolean)
    .join(' • ');

  const tags = [
    car.gearbox,
    car.drive,
    car.country,
    car.city,
    car.availability,
  ]
    .filter(Boolean)
    .slice(0, 5);

  return `
    <article
      class="cars-card"
      role="listitem"
      tabindex="0"
      data-url="${escapeHtml(carUrl)}"
    >
      <div class="cars-card__image">
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(title)}"
          loading="lazy"
          decoding="async"
        >

        <span class="cars-card__badge">
          ${escapeHtml(car.badge || car.availability || 'Под заказ')}
        </span>

        ${
          car.grade
            ? `
              <span class="cars-card__grade">
                ${escapeHtml(car.grade)}
              </span>
            `
            : ''
        }
      </div>

      <div class="cars-card__content">
        <h3 class="cars-card__title">
          ${escapeHtml(title)}
        </h3>

        ${
          meta
            ? `
              <div class="cars-card__meta">
                ${meta
                  .split(' • ')
                  .map((item) => {
                    return `
                      <div class="cars-card__meta-item">
                        <span class="cars-card__dot" aria-hidden="true"></span>
                        <span>${escapeHtml(item)}</span>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
            : ''
        }

        ${
          tags.length
            ? `
              <div class="cars-card__tags">
                ${tags
                  .map((tag) => {
                    return `<span>${escapeHtml(tag)}</span>`;
                  })
                  .join('')}
              </div>
            `
            : ''
        }

        ${
          car.shortDescription
            ? `
              <p class="cars-card__description">
                ${escapeHtml(car.shortDescription)}
              </p>
            `
            : ''
        }

        <div class="cars-card__bottom">
          <div class="cars-card__price">
            ${escapeHtml(car.price || 'Цена уточняется')}
          </div>

          <a
            class="cars-card__arrow"
            href="${escapeHtml(carUrl)}"
            aria-label="Подробнее об автомобиле ${escapeHtml(title)}"
          >
            ›
          </a>
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
      car.power,
      car.fuel,
      car.mileage,
      car.drive,
      car.gearbox,
      car.body,
      car.color,
      car.complectation,
      car.country,
      car.city,
      car.badge,
      car.availability,
      car.price,
      car.shortDescription,
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
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
