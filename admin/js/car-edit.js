document.addEventListener('DOMContentLoaded', initCarEditPage);

const MAX_GALLERY_IMAGES = 15;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const carForm = document.querySelector('#carForm');
const carEditTitle = document.querySelector('#carEditTitle');
const submitButton = document.querySelector('#carSubmitButton');
const formMessage = document.querySelector('#carFormMessage');
const existingGallery = document.querySelector('#existingGallery');
const existingGalleryGrid = document.querySelector('#existingGalleryGrid');
const existingGalleryCount = document.querySelector('#existingGalleryCount');
const selectedGallery = document.querySelector('#selectedGallery');
const selectedGalleryGrid = document.querySelector('#selectedGalleryGrid');
const selectedGalleryCount = document.querySelector('#selectedGalleryCount');

let currentCarId = null;
let slugTouched = false;
let existingGalleryImages = [];
let selectedGalleryImages = [];
let selectedGallerySequence = 0;

const singleImageState = {
  previewImage: {
    inputId: 'previewImageFile',
    previewId: 'previewImagePreview',
    nameId: 'previewImageName',
    existingPath: null,
    removed: false,
  },
  mainImage: {
    inputId: 'mainImageFile',
    previewId: 'mainImagePreview',
    nameId: 'mainImageName',
    existingPath: null,
    removed: false,
  },
};

async function initCarEditPage() {
  if (!carForm) return;

  currentCarId = getCarIdFromUrl();
  bindSlugGeneration();
  bindSingleImageInputs();
  bindGalleryInput();
  bindSubmit();

  if (currentCarId) {
    await loadCar(currentCarId);
  }
}

function getCarIdFromUrl() {
  const id = Number(new URLSearchParams(window.location.search).get('id'));

  return Number.isInteger(id) && id > 0 ? id : null;
}

async function loadCar(carId) {
  try {
    const data = await Admin.request(`/api/admin/cars/${carId}`);

    if (!data?.car) {
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
  const values = {
    title: car.title,
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    price: car.price,
    oldPrice: car.oldPrice,
    badge: car.badge,
    country: car.country,
    city: car.city,
    availability: car.availability,
    year: car.year,
    mileage: car.mileage,
    engine: car.engine,
    power: car.power,
    fuel: car.fuel,
    gearbox: car.gearbox,
    drive: car.drive,
    body: car.body,
    color: car.color,
    complectation: car.complectation,
    grade: car.grade,
    documents: car.documents,
    auctionUrl: car.auctionUrl,
    shortDescription: car.shortDescription,
    description: car.description,
    features: car.features,
    conditionText: car.conditionText,
    documentsText: car.documentsText,
    serviceText: car.serviceText,
    seoTitle: car.seoTitle,
    seoDescription: car.seoDescription,
    sortOrder: car.sortOrder,
  };

  Object.entries(values).forEach(([name, value]) => setValue(name, value));
  setChecked('isActive', car.isActive);
  setChecked('showOnHome', car.showOnHome);
  setChecked('isFeatured', car.isFeatured);

  showExistingSingleImage('previewImage', car.previewImage);
  showExistingSingleImage('mainImage', car.mainImage || car.image);
  renderExistingGallery(car.images || []);
  slugTouched = true;
}

function setValue(name, value) {
  const field = carForm.elements[name];

  if (field) field.value = value ?? '';
}

function setChecked(name, value) {
  const field = carForm.elements[name];

  if (field) field.checked = Boolean(value);
}

function showExistingSingleImage(fieldName, imagePath) {
  const state = singleImageState[fieldName];
  const preview = document.querySelector(`#${state.previewId}`);
  const image = preview?.querySelector('img');

  state.existingPath = imagePath || null;
  state.removed = false;

  if (!preview || !image || !imagePath) return;

  image.src = imagePath;
  preview.hidden = false;
}

function bindSingleImageInputs() {
  Object.entries(singleImageState).forEach(([fieldName, state]) => {
    const input = document.querySelector(`#${state.inputId}`);
    const preview = document.querySelector(`#${state.previewId}`);
    const name = document.querySelector(`#${state.nameId}`);
    const image = preview?.querySelector('img');
    const removeButton = preview?.querySelector('[data-remove-single-image]');

    if (!input || !preview || !image) return;

    input.addEventListener('change', () => {
      clearFieldError(fieldName);
      const file = input.files?.[0];

      if (!file) return;

      const fileError = validateImageFile(file);

      if (fileError) {
        input.value = '';
        showFieldError(fieldName, fileError);
        showFormMessage('Не удалось добавить фотографию', [fileError]);
        return;
      }

      state.removed = false;
      image.src = URL.createObjectURL(file);
      preview.hidden = false;

      if (name) {
        name.textContent = `${file.name} · ${formatFileSize(file.size)}`;
      }
    });

    removeButton?.addEventListener('click', () => {
      input.value = '';
      state.removed = Boolean(state.existingPath);
      image.removeAttribute('src');
      preview.hidden = true;
      clearFieldError(fieldName);

      if (name) {
        name.textContent = state.removed
          ? 'Фотография будет удалена после сохранения'
          : 'Файл не выбран';
      }
    });
  });
}

function renderExistingGallery(images) {
  if (!existingGallery || !existingGalleryGrid) return;

  existingGalleryImages = Array.isArray(images) ? [...images] : [];
  existingGallery.hidden = existingGalleryImages.length === 0;
  existingGalleryGrid.innerHTML = existingGalleryImages
    .map(
      (image) => `
        <div class="admin-gallery-card" data-gallery-image-card="${image.id}">
          <img src="${escapeHtml(image.image)}" alt="${escapeHtml(
            image.alt || 'Фото автомобиля',
          )}" loading="lazy" />
          <button type="button" class="admin-gallery-card__delete"
            data-delete-gallery-image="${image.id}"
            aria-label="Удалить фотографию">×</button>
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

  updateGalleryCounters();
}

async function deleteGalleryImage(imageId, button) {
  if (!currentCarId || !imageId) return;

  const confirmed = confirm(
    'Удалить эту фотографию? Отменить это действие нельзя.',
  );

  if (!confirmed) return;

  try {
    button.disabled = true;
    const data = await Admin.request(
      `/api/admin/cars/${currentCarId}/images/${imageId}`,
      { method: 'DELETE' },
    );

    if (!data?.success) {
      throw new Error(data?.message || 'Не удалось удалить фотографию');
    }

    existingGalleryImages = existingGalleryImages.filter(
      (image) => image.id !== imageId,
    );
    renderExistingGallery(existingGalleryImages);
    showFormMessage('Фотография удалена', [], 'success');
  } catch (error) {
    console.error('Gallery image delete error:', error);
    showFormMessage(error.message || 'Не удалось удалить фотографию');
    button.disabled = false;
  }
}

function bindGalleryInput() {
  const input = document.querySelector('#galleryImagesFile');

  if (!input) return;

  input.addEventListener('change', () => {
    clearFieldError('galleryImages');
    const files = Array.from(input.files || []);
    const errors = [];

    files.forEach((file) => {
      const fileError = validateImageFile(file);
      const duplicate = selectedGalleryImages.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified,
      );

      if (fileError) {
        errors.push(`${file.name}: ${fileError}`);
        return;
      }

      if (duplicate) {
        errors.push(`${file.name}: фотография уже выбрана`);
        return;
      }

      if (
        existingGalleryImages.length + selectedGalleryImages.length >=
        MAX_GALLERY_IMAGES
      ) {
        errors.push(
          `В галерее может быть не больше ${MAX_GALLERY_IMAGES} фотографий`,
        );
        return;
      }

      selectedGallerySequence += 1;
      selectedGalleryImages.push({
        id: selectedGallerySequence,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    input.value = '';
    renderSelectedGallery();

    if (errors.length) {
      const uniqueErrors = [...new Set(errors)];
      showFieldError('galleryImages', uniqueErrors[0]);
      showFormMessage('Некоторые фотографии не добавлены', uniqueErrors);
    } else {
      hideFormMessage();
    }
  });
}

function renderSelectedGallery() {
  if (!selectedGallery || !selectedGalleryGrid) return;

  selectedGallery.hidden = selectedGalleryImages.length === 0;
  selectedGalleryGrid.innerHTML = selectedGalleryImages
    .map(
      (item) => `
        <div class="admin-gallery-card" data-selected-gallery-card="${item.id}">
          <img src="${item.previewUrl}" alt="${escapeHtml(item.file.name)}" />
          <button type="button" class="admin-gallery-card__delete"
            data-remove-selected-gallery="${item.id}"
            aria-label="Убрать фотографию">×</button>
          <small>${escapeHtml(item.file.name)}</small>
        </div>
      `,
    )
    .join('');

  selectedGalleryGrid
    .querySelectorAll('[data-remove-selected-gallery]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.removeSelectedGallery);
        const item = selectedGalleryImages.find((image) => image.id === id);

        if (item) URL.revokeObjectURL(item.previewUrl);

        selectedGalleryImages = selectedGalleryImages.filter(
          (image) => image.id !== id,
        );
        clearFieldError('galleryImages');
        renderSelectedGallery();
      });
    });

  updateGalleryCounters();
}

function updateGalleryCounters() {
  const total = existingGalleryImages.length + selectedGalleryImages.length;
  const galleryName = document.querySelector('#galleryImagesName');

  if (galleryName) {
    galleryName.textContent = `Выбрано ${total} из ${MAX_GALLERY_IMAGES}`;
  }

  if (selectedGalleryCount) {
    selectedGalleryCount.textContent = `${selectedGalleryImages.length} новых · всего ${total} из ${MAX_GALLERY_IMAGES}`;
  }

  if (existingGalleryCount) {
    existingGalleryCount.textContent = `${existingGalleryImages.length} из ${MAX_GALLERY_IMAGES}`;
  }
}

function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'разрешены только JPG, PNG и WEBP';
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return `размер больше 15 МБ (${formatFileSize(file.size)})`;
  }

  return null;
}

function formatFileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function bindSlugGeneration() {
  const titleInput = carForm.elements.title;
  const slugInput = carForm.elements.slug;

  if (!titleInput || !slugInput) return;

  slugInput.addEventListener('input', () => {
    slugTouched = true;
    clearFieldError('slug');
  });

  titleInput.addEventListener('input', () => {
    clearFieldError('title');

    if (!slugTouched && !currentCarId) {
      slugInput.value = createSlug(titleInput.value);
    }
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

function validateForm() {
  clearFormErrors();
  const errors = {};
  const title = String(carForm.elements.title?.value || '').trim();
  const slug = String(carForm.elements.slug?.value || '').trim().toLowerCase();
  const auctionUrl = carForm.elements.auctionUrl;
  const sortOrder = carForm.elements.sortOrder;

  if (title.length < 2) {
    errors.title = 'Укажите название автомобиля — минимум 2 символа';
  }

  if (!slug) {
    errors.slug = 'Укажите slug автомобиля';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = 'Slug должен содержать только латинские буквы, цифры и дефисы';
  }

  if (auctionUrl?.value && !auctionUrl.validity.valid) {
    errors.auctionUrl = 'Введите полную ссылку, например https://example.com';
  }

  if (sortOrder?.value && Number(sortOrder.value) < 0) {
    errors.sortOrder = 'Порядок сортировки не может быть отрицательным';
  }

  if (
    existingGalleryImages.length + selectedGalleryImages.length >
    MAX_GALLERY_IMAGES
  ) {
    errors.galleryImages = `В галерее может быть не больше ${MAX_GALLERY_IMAGES} фотографий`;
  }

  Object.values(singleImageState).forEach((state) => {
    const input = document.querySelector(`#${state.inputId}`);
    const file = input?.files?.[0];
    const fileError = file ? validateImageFile(file) : null;

    if (fileError) errors[input.name] = fileError;
  });

  Object.entries(errors).forEach(([fieldName, message]) => {
    showFieldError(fieldName, message);
  });

  if (Object.keys(errors).length) {
    showFormMessage(
      `Не удалось сохранить: исправьте ${formatErrorsCount(
        Object.keys(errors).length,
      )}`,
      Object.values(errors),
    );
    focusFirstInvalidField(errors);
    return false;
  }

  return true;
}

function formatErrorsCount(count) {
  if (count === 1) return '1 ошибку';
  if (count >= 2 && count <= 4) return `${count} ошибки`;
  return `${count} ошибок`;
}

function showFieldError(fieldName, message) {
  const field = carForm.elements[fieldName];
  const container = field?.closest('.admin-field');

  if (!field || !container) return;

  container.classList.add('admin-field--invalid');
  field.setAttribute('aria-invalid', 'true');

  let error = container.querySelector('.admin-field__error');

  if (!error) {
    error = document.createElement('small');
    error.className = 'admin-field__error';
    container.append(error);
  }

  error.textContent = message;
}

function clearFieldError(fieldName) {
  const field = carForm.elements[fieldName];
  const container = field?.closest('.admin-field');

  if (!field || !container) return;

  container.classList.remove('admin-field--invalid');
  field.removeAttribute('aria-invalid');
  container.querySelector('.admin-field__error')?.remove();
}

function clearFormErrors() {
  carForm.querySelectorAll('.admin-field--invalid').forEach((container) => {
    container.classList.remove('admin-field--invalid');
  });
  carForm.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute('aria-invalid');
  });
  carForm.querySelectorAll('.admin-field__error').forEach((error) => {
    error.remove();
  });
  hideFormMessage();
}

function focusFirstInvalidField(errors) {
  const firstField = carForm.elements[Object.keys(errors)[0]];

  firstField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => firstField?.focus({ preventScroll: true }), 350);
}

function showFormMessage(message, details = [], type = 'error') {
  if (!formMessage) return;

  const detailsMarkup = details.length
    ? `<ul>${details
        .map((detail) => `<li>${Admin.escapeHTML(detail)}</li>`)
        .join('')}</ul>`
    : '';

  formMessage.className = `admin-form-message admin-form-message--${type}`;
  formMessage.innerHTML = `<strong>${Admin.escapeHTML(
    message,
  )}</strong>${detailsMarkup}`;
  formMessage.hidden = false;
}

function hideFormMessage() {
  if (!formMessage) return;

  formMessage.hidden = true;
  formMessage.innerHTML = '';
}

function bindSubmit() {
  carForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const formData = new FormData(carForm);
    formData.delete('galleryImages');

    selectedGalleryImages.forEach(({ file }) => {
      formData.append('galleryImages', file, file.name);
    });

    Object.entries(singleImageState).forEach(([fieldName, state]) => {
      if (state.removed) {
        formData.set(`remove${capitalize(fieldName)}`, 'true');
      }
    });

    try {
      setSavingState(true);
      const url = currentCarId
        ? `/api/admin/cars/${currentCarId}`
        : '/api/admin/cars';
      const method = currentCarId ? 'PUT' : 'POST';
      const data = await Admin.request(url, { method, body: formData });

      if (!data?.car) {
        throw new Error('Сервер не вернул сохранённый автомобиль');
      }

      window.location.href = '/admin/cars.html';
    } catch (error) {
      console.error('Car save error:', error);
      const serverErrors = error.errors || {};

      Object.entries(serverErrors).forEach(([fieldName, message]) => {
        showFieldError(fieldName, message);
      });

      showFormMessage(
        error.message || 'Не удалось сохранить автомобиль',
        Object.values(serverErrors),
      );

      if (Object.keys(serverErrors).length) {
        focusFirstInvalidField(serverErrors);
      } else {
        formMessage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setSavingState(false);
    }
  });
}

function setSavingState(isSaving) {
  if (!submitButton) return;

  submitButton.disabled = isSaving;
  submitButton.textContent = isSaving
    ? 'Обрабатываем фото...'
    : 'Сохранить автомобиль';
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
