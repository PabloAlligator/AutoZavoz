document.addEventListener('DOMContentLoaded', initCarEditPage);

const carForm = document.querySelector('#carForm');
const carEditTitle = document.querySelector('#carEditTitle');
const submitButton = document.querySelector('#carSubmitButton');
const existingGallery = document.querySelector('#existingGallery');
const existingGalleryGrid = document.querySelector('#existingGalleryGrid');

let currentCarId = null;
let slugTouched = false;

async function initCarEditPage() {
  if (!carForm) return;

  currentCarId = getCarIdFromUrl();

  bindSlugGeneration();
  bindImagePreview(
    'previewImageFile',
    'previewImagePreview',
    'previewImageName',
  );
  bindImagePreview('imageFile', 'imagePreview', 'imageName');
  bindImagePreview('mainImageFile', 'mainImagePreview', 'mainImageName');
  bindGalleryName();
  bindSubmit();

  if (currentCarId) {
    await loadCar(currentCarId);
  }
}

function getCarIdFromUrl() {
  const id = Number(new URLSearchParams(window.location.search).get('id'));

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

async function loadCar(carId) {
  try {
    const data = await Admin.request(`/api/admin/cars/${carId}`);

    if (!data || !data.car) {
      throw new Error('Автомобиль не найден');
    }

    fillForm(data.car);

    if (carEditTitle) {
      carEditTitle.textContent = 'Редактирование авто';
    }
  } catch (error) {
    console.error('Car load error:', error);
    alert(error.message || 'Не удалось загрузить автомобиль');
    window.location.href = '/admin/cars.html';
  }
}

function fillForm(car) {
  setValue('title', car.title);
  setValue('slug', car.slug);
  setValue('brand', car.brand);
  setValue('model', car.model);
  setValue('price', car.price);
  setValue('oldPrice', car.oldPrice);
  setValue('badge', car.badge);
  setValue('country', car.country);
  setValue('city', car.city);
  setValue('availability', car.availability);

  setValue('year', car.year);
  setValue('mileage', car.mileage);
  setValue('engine', car.engine);
  setValue('power', car.power);
  setValue('fuel', car.fuel);
  setValue('gearbox', car.gearbox);
  setValue('drive', car.drive);
  setValue('body', car.body);
  setValue('color', car.color);
  setValue('complectation', car.complectation);
  setValue('grade', car.grade);
  setValue('documents', car.documents);
  setValue('auctionUrl', car.auctionUrl);

  setValue('shortDescription', car.shortDescription);
  setValue('description', car.description);
  setValue('features', car.features);
  setValue('conditionText', car.conditionText);
  setValue('documentsText', car.documentsText);
  setValue('serviceText', car.serviceText);

  setValue('seoTitle', car.seoTitle);
  setValue('seoDescription', car.seoDescription);
  setValue('sortOrder', car.sortOrder);

  setChecked('isActive', car.isActive);
  setChecked('showOnHome', car.showOnHome);
  setChecked('isFeatured', car.isFeatured);

  showExistingImage('previewImagePreview', car.previewImage);
  showExistingImage('imagePreview', car.image);
  showExistingImage('mainImagePreview', car.mainImage || car.image);
  renderExistingGallery(car.images || []);

  slugTouched = true;
}

function setValue(name, value) {
  const field = carForm.elements[name];

  if (!field) return;

  field.value = value ?? '';
}

function setChecked(name, value) {
  const field = carForm.elements[name];

  if (!field) return;

  field.checked = Boolean(value);
}

function showExistingImage(previewId, imagePath) {
  if (!imagePath) return;

  const preview = document.querySelector(`#${previewId}`);
  const image = preview?.querySelector('img');

  if (!preview || !image) return;

  image.src = imagePath;
  preview.hidden = false;
}

function renderExistingGallery(images) {
  if (!existingGallery || !existingGalleryGrid) return;

  existingGallery.hidden = false;

  if (!Array.isArray(images) || !images.length) {
    existingGalleryGrid.innerHTML = `
      <p class="admin-gallery-existing__empty">
        У этого автомобиля пока нет фото в галерее.
      </p>
    `;
    return;
  }

  existingGalleryGrid.innerHTML = images
    .map(
      (image) => `
        <div class="admin-gallery-card" data-gallery-image-card="${image.id}">
          <img
            src="${escapeHtml(image.image)}"
            alt="${escapeHtml(image.alt || 'Фото автомобиля')}"
            loading="lazy"
          />

          <button
            type="button"
            class="admin-gallery-card__delete"
            data-delete-gallery-image="${image.id}"
            aria-label="Удалить фото"
          >
            ×
          </button>
        </div>
      `,
    )
    .join('');

  existingGalleryGrid
    .querySelectorAll('[data-delete-gallery-image]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        deleteGalleryImage(Number(button.dataset.deleteGalleryImage), button);
      });
    });
}

async function deleteGalleryImage(imageId, button) {
  if (!currentCarId || !imageId) return;

  const confirmed = confirm('Удалить эту фотографию?');

  if (!confirmed) return;

  try {
    button.disabled = true;

    const data = await Admin.request(
      `/api/admin/cars/${currentCarId}/images/${imageId}`,
      {
        method: 'DELETE',
      },
    );

    if (!data || !data.success) {
      throw new Error(data?.message || 'Не удалось удалить фотографию');
    }

    const card = button.closest('[data-gallery-image-card]');
    card?.remove();

    if (
      existingGalleryGrid &&
      !existingGalleryGrid.querySelector('[data-gallery-image-card]')
    ) {
      existingGalleryGrid.innerHTML = `
        <p class="admin-gallery-existing__empty">
          Все фото галереи удалены.
        </p>
      `;
    }
  } catch (error) {
    console.error('Gallery image delete error:', error);
    alert(error.message || 'Не удалось удалить фотографию');

    button.disabled = false;
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function bindSlugGeneration() {
  const titleInput = carForm.elements.title;
  const slugInput = carForm.elements.slug;

  if (!titleInput || !slugInput) return;

  slugInput.addEventListener('input', () => {
    slugTouched = true;
  });

  titleInput.addEventListener('input', () => {
    if (slugTouched || currentCarId) return;

    slugInput.value = createSlug(titleInput.value);
  });
}

function createSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'e')
    .replace(/й/g, 'i')
    .replace(/ц/g, 'c')
    .replace(/у/g, 'u')
    .replace(/к/g, 'k')
    .replace(/е/g, 'e')
    .replace(/н/g, 'n')
    .replace(/г/g, 'g')
    .replace(/ш/g, 'sh')
    .replace(/щ/g, 'sch')
    .replace(/з/g, 'z')
    .replace(/х/g, 'h')
    .replace(/ъ/g, '')
    .replace(/ф/g, 'f')
    .replace(/ы/g, 'y')
    .replace(/в/g, 'v')
    .replace(/а/g, 'a')
    .replace(/п/g, 'p')
    .replace(/р/g, 'r')
    .replace(/о/g, 'o')
    .replace(/л/g, 'l')
    .replace(/д/g, 'd')
    .replace(/ж/g, 'zh')
    .replace(/э/g, 'e')
    .replace(/я/g, 'ya')
    .replace(/ч/g, 'ch')
    .replace(/с/g, 's')
    .replace(/м/g, 'm')
    .replace(/и/g, 'i')
    .replace(/т/g, 't')
    .replace(/ь/g, '')
    .replace(/б/g, 'b')
    .replace(/ю/g, 'yu')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function bindImagePreview(inputId, previewId, nameId) {
  const input = document.querySelector(`#${inputId}`);
  const preview = document.querySelector(`#${previewId}`);
  const name = document.querySelector(`#${nameId}`);
  const image = preview?.querySelector('img');

  if (!input || !preview || !image) return;

  input.addEventListener('change', () => {
    const file = input.files?.[0];

    if (!file) return;

    if (name) {
      name.textContent = file.name;
    }

    const reader = new FileReader();

    reader.addEventListener('load', () => {
      image.src = reader.result;
      preview.hidden = false;
    });

    reader.readAsDataURL(file);
  });
}

function bindGalleryName() {
  const input = document.querySelector('#galleryImagesFile');
  const name = document.querySelector('#galleryImagesName');

  if (!input || !name) return;

  input.addEventListener('change', () => {
    const filesCount = input.files?.length || 0;

    if (!filesCount) {
      name.textContent = 'Можно выбрать несколько фото';
      return;
    }

    name.textContent = `${filesCount} фото выбрано`;
  });
}

function bindSubmit() {
  carForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(carForm);

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Сохраняем...';
      }

      const url = currentCarId
        ? `/api/admin/cars/${currentCarId}`
        : '/api/admin/cars';

      const method = currentCarId ? 'PUT' : 'POST';

      const data = await Admin.request(url, {
        method,
        body: formData,
      });

      if (!data || !data.car) {
        throw new Error('Сервер не вернул автомобиль');
      }

      window.location.href = '/admin/cars.html';
    } catch (error) {
      console.error('Car save error:', error);
      alert(error.message || 'Не удалось сохранить автомобиль');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Сохранить авто';
      }
    }
  });
}
