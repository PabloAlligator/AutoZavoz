const burger = document.querySelector('.header__burger');
const mobileMenu = document.querySelector('.mobile-menu');
const overlay = document.querySelector('.mobile-menu-overlay');
const mobileLinks = document.querySelectorAll('.mobile-menu a');
const header = document.querySelector('.header');
const carDetail = document.querySelector('#carDetail');

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

document.addEventListener('DOMContentLoaded', loadCar);

function getCarSlug() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  if (pathParts[0] === 'cars' && pathParts[1]) {
    return decodeURIComponent(pathParts[1]);
  }

  return '';
}

async function loadCar() {
  if (!carDetail) return;

  const slug = getCarSlug();

  if (!slug) {
    renderError('Автомобиль не найден', 'Ссылка некорректна.');
    return;
  }

  try {
    const response = await fetch(`/api/cars/${encodeURIComponent(slug)}`);
    const data = await response.json();

    if (!response.ok || !data.success || !data.car) {
      throw new Error(data.message || 'Автомобиль не найден');
    }

    renderCar(data.car, data.similarCars || []);
  } catch (error) {
    console.error('Car page loading error:', error);
    renderError('Автомобиль не найден', 'Возможно, он был скрыт или удалён.');
  }
}

function renderCar(car, similarCars = []) {
  const title = escapeHtml(car.title || 'Автомобиль');
  const price = escapeHtml(car.price || 'Цена уточняется');
  const galleryImages = getGalleryImages(car);
  const mainImage = galleryImages[0]?.image || '/site/img/logoIcon.png';

  document.title = car.seoTitle || `${car.title || 'Автомобиль'} — АвтоZавоз`;

  const seoDescription =
    car.seoDescription ||
    car.shortDescription ||
    car.description ||
    'Автомобиль под заказ от АвтоZавоз.';

  setMetaDescription(seoDescription);

  carDetail.innerHTML = `
    <div class="car-detail__container">
      <nav class="car-breadcrumbs" aria-label="Хлебные крошки">
        <a href="/">Главная</a>
        <span>/</span>
        <a href="/catalog.html">Каталог</a>
        <span>/</span>
        <span>${title}</span>
      </nav>

      <div class="car-detail__top">
        <div>
          <h1 class="car-detail__title">${title}</h1>

          <div class="car-detail__meta">
            ${createMetaItem(car.city)}
            ${createMetaItem(car.mileage)}
            ${createMetaItem(car.engine)}
            ${createMetaItem(car.gearbox)}
            ${createMetaItem(car.drive)}
            ${createMetaItem(car.documents)}
          </div>
        </div>
      </div>

      <div class="car-detail__layout">
        <div class="car-detail__content">
          <section class="car-gallery">
            <div class="car-gallery__main">
              <img
                id="carGalleryMainImage"
                src="${escapeHtml(mainImage)}"
                alt="${title}"
              />

              ${
                car.badge
                  ? `<span class="car-gallery__badge">${escapeHtml(car.badge)}</span>`
                  : ''
              }

              ${
                galleryImages.length
                  ? `<span class="car-gallery__count">${galleryImages.length} фото</span>`
                  : ''
              }
            </div>

            ${createGalleryThumbs(galleryImages)}
          </section>

          <section class="car-card">
            <h2>Характеристики</h2>

            <div class="car-specs">
              ${createSpec('Марка', car.brand)}
              ${createSpec('Модель', car.model)}
              ${createSpec('Год выпуска', car.year)}
              ${createSpec('Пробег', car.mileage)}
              ${createSpec('Двигатель', car.engine)}
              ${createSpec('Мощность', car.power)}
              ${createSpec('Топливо', car.fuel)}
              ${createSpec('Коробка передач', car.gearbox)}
              ${createSpec('Привод', car.drive)}
              ${createSpec('Кузов', car.body)}
              ${createSpec('Цвет', car.color)}
              ${createSpec('Комплектация', car.complectation)}
              ${createSpec('Оценка аукциона', car.grade)}
              ${createSpec('Документы', car.documents)}
              ${createSpec('Наличие', car.availability)}
            </div>
          </section>

          ${
            car.description || car.shortDescription
              ? `
                <section class="car-card">
                  <h2>Описание</h2>
                  <p>${escapeHtml(car.description || car.shortDescription)}</p>
                </section>
              `
              : ''
          }

          ${
            car.features
              ? `
                <section class="car-card">
                  <h2>Особенности</h2>
                  ${createTextList(car.features)}
                </section>
              `
              : ''
          }
        </div>

        <aside class="car-detail__aside">
          <div class="car-price-card">
            <strong>${price}</strong>
            <span>цена под ключ</span>

            <form class="car-lead-form" id="carLeadForm">
  <input type="hidden" name="leadType" value="car_page" />
  <input type="hidden" name="source" value="car_page" />
  <input type="hidden" name="carId" value="${car.id}" />
  <input type="hidden" name="carTitle" value="${escapeHtml(car.title)}" />
  <input type="hidden" name="carSlug" value="${escapeHtml(car.slug)}" />

  <label>
    <span>Ваше имя</span>
    <input
      type="text"
      name="customerName"
      placeholder="Например, Павел"
      minlength="2"
      maxlength="80"
      required
    />
  </label>

  <label>
    <span>Телефон</span>
    <input
      type="tel"
      name="phone"
      placeholder="+7 ___ ___-__-__"
      inputmode="tel"
      maxlength="18"
      required
    />
  </label>

  <label>
    <span>Мессенджер</span>
    <select name="messenger">
      <option value="Телефон">Телефон</option>
      <option value="WhatsApp">WhatsApp</option>
      <option value="Telegram">Telegram</option>
      <option value="MAX">MAX</option>
    </select>
  </label>

  <label>
    <span>Комментарий</span>
    <textarea
      name="message"
      placeholder="Хочу расчёт по этому автомобилю"
      maxlength="500"
    ></textarea>
  </label>

  <label class="car-lead-form__agreement">
    <input type="checkbox" required />
    <span>Согласен на обработку персональных данных</span>
  </label>

  <button class="car-price-card__button" type="submit">
    Получить расчёт
  </button>

  <p class="car-lead-form__message" id="carLeadFormMessage"></p>
</form>

            <div class="car-price-card__messengers">
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>

              <a href="https://t.me/" target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </div>

            <div class="car-price-card__trust">
              <p>Проверим технику и документы</p>
              <p>Безопасная сделка</p>
              <p>Доставка и растаможка под ключ</p>
            </div>
          </div>

          ${
            car.conditionText
              ? `
                <div class="car-side-card">
                  <h2>Состояние коротко</h2>
                  ${createTextList(car.conditionText)}
                </div>
              `
              : ''
          }

          ${
            car.documentsText
              ? `
                <div class="car-side-card">
                  <h2>Документы и сервис</h2>
                  ${createTextList(car.documentsText)}
                </div>
              `
              : ''
          }

          ${
            car.serviceText
              ? `
                <div class="car-side-card">
                  <h2>Сопровождение</h2>
                  ${createTextList(car.serviceText)}
                </div>
              `
              : ''
          }
        </aside>
      </div>

      <section class="car-cta">
        <div>
          <h2>Хотите похожий автомобиль под заказ?</h2>
          <p>
            Подберём, проверим и привезём автомобиль под ваши требования
            из Японии, Кореи, Китая или ОАЭ.
          </p>
        </div>

        <a href="/#form">Оставить заявку</a>
      </section>

      ${createSimilarCars(similarCars)}
    </div>
  `;

  bindGalleryThumbs();
  bindCarLeadForm();
}

function getGalleryImages(car) {
  const images = [];

  [
    {
      image: car.mainImage,
      alt: car.title,
    },
    {
      image: car.image,
      alt: car.title,
    },
    {
      image: car.previewImage,
      alt: car.title,
    },
  ].forEach((item) => {
    if (item.image) {
      images.push(item);
    }
  });

  if (Array.isArray(car.images)) {
    car.images.forEach((item) => {
      if (item.image) {
        images.push({
          image: item.image,
          alt: item.alt || car.title,
        });
      }
    });
  }

  const uniqueImages = [];
  const usedPaths = new Set();

  images.forEach((item) => {
    if (usedPaths.has(item.image)) return;

    usedPaths.add(item.image);
    uniqueImages.push(item);
  });

  return uniqueImages;
}

function createGalleryThumbs(images) {
  if (images.length <= 1) return '';

  return `
    <div class="car-gallery__thumbs">
      ${images
        .map((item, index) => {
          return `
            <button
              class="car-gallery__thumb ${index === 0 ? 'active' : ''}"
              type="button"
              data-gallery-image="${escapeHtml(item.image)}"
              aria-label="Показать фото ${index + 1}"
            >
              <img
                src="${escapeHtml(item.image)}"
                alt="${escapeHtml(item.alt || `Фото ${index + 1}`)}"
              />
            </button>
          `;
        })
        .join('')}
    </div>
  `;
}

function bindGalleryThumbs() {
  const mainImage = document.querySelector('#carGalleryMainImage');
  const thumbs = document.querySelectorAll('[data-gallery-image]');

  if (!mainImage || !thumbs.length) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const image = thumb.dataset.galleryImage;

      if (!image) return;

      mainImage.src = image;

      thumbs.forEach((item) => {
        item.classList.remove('active');
      });

      thumb.classList.add('active');
    });
  });
}

function createMetaItem(value) {
  if (!value) return '';

  return `<span>${escapeHtml(value)}</span>`;
}

function createSpec(label, value) {
  if (!value) return '';

  return `
    <div class="car-specs__item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function createTextList(value) {
  const items = String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!items.length) return '';

  if (items.length === 1) {
    return `<p>${escapeHtml(items[0])}</p>`;
  }

  return `
    <ul class="car-text-list">
      ${items
        .map((item) => {
          return `<li>${escapeHtml(item)}</li>`;
        })
        .join('')}
    </ul>
  `;
}

function createSimilarCars(cars) {
  if (!cars.length) return '';

  return `
    <section class="car-similar">
      <div class="car-similar__head">
        <h2>Похожие автомобили</h2>
        <a href="/catalog.html">Смотреть все</a>
      </div>

      <div class="car-similar__grid">
        ${cars
          .map((car) => {
            const image =
              car.previewImage ||
              car.mainImage ||
              car.image ||
              '/site/img/logoIcon.png';

            return `
              <article class="car-similar-card">
                <a
                  class="car-similar-card__link"
                  href="/cars/${encodeURIComponent(car.slug)}"
                  aria-label="Подробнее: ${escapeHtml(car.title)}"
                ></a>

                <img src="${escapeHtml(image)}" alt="${escapeHtml(car.title)}" />

                <div>
                  <h3>${escapeHtml(car.title)}</h3>
                  <p>${escapeHtml(car.year || '')} ${escapeHtml(car.mileage || '')}</p>
                  <strong>${escapeHtml(car.price || 'Цена уточняется')}</strong>
                </div>
              </article>
            `;
          })
          .join('')}
      </div>
    </section>
  `;
}

function renderError(title, text) {
  carDetail.innerHTML = `
    <div class="car-detail__container">
      <div class="car-detail__error">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(text)}</p>
        <a href="/catalog.html">Вернуться в каталог</a>
      </div>
    </div>
  `;
}

function setMetaDescription(content) {
  let meta = document.querySelector('meta[name="description"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', String(content || '').slice(0, 160));
}

function bindCarLeadForm() {
  const form = document.querySelector('#carLeadForm');
  const messageBox = document.querySelector('#carLeadFormMessage');
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const payload = {
      leadType: String(formData.get('leadType') || 'car_page'),
      source: String(formData.get('source') || 'car_page'),
      carId: Number(formData.get('carId')),
      carTitle: String(formData.get('carTitle') || ''),
      carSlug: String(formData.get('carSlug') || ''),
      customerName: String(formData.get('customerName') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      messenger: String(formData.get('messenger') || '').trim(),
      message: String(formData.get('message') || '').trim(),
    };

    if (payload.customerName.length < 2) {
      messageBox.textContent = 'Введите имя.';
      messageBox.classList.add('is-error');
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Отправляем...';
      }

      messageBox.textContent = '';
      messageBox.classList.remove('is-error', 'is-success');

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Не удалось отправить заявку');
      }

      form.reset();

      messageBox.textContent = 'Заявка отправлена. Скоро свяжемся с вами.';
      messageBox.classList.add('is-success');
    } catch (error) {
      console.error('Car lead form error:', error);

      messageBox.textContent = error.message || 'Ошибка отправки заявки.';
      messageBox.classList.add('is-error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Получить расчёт';
      }
    }
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
