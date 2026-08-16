const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { Prisma } = require('@prisma/client');

const prisma = require('../db');
const upload = require('../config/multer');
const requireAdminAuth = require('../middleware/requireAdminAuth');

const router = express.Router();
const MAX_GALLERY_IMAGES = 15;

const imageFields = [
  {
    name: 'previewImage',
    maxCount: 1,
  },
  {
    name: 'image',
    maxCount: 1,
  },
  {
    name: 'mainImage',
    maxCount: 1,
  },
  {
    name: 'galleryImages',
    maxCount: MAX_GALLERY_IMAGES,
  },
];

function getUploadedFiles(req) {
  return Object.values(req.files || {}).flat().filter(Boolean);
}

function deleteTemporaryFiles(req) {
  getUploadedFiles(req).forEach((file) => {
    if (!file.path || !fs.existsSync(file.path)) return;

    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Не удалось удалить временный файл:', file.path);
      }
    }
  });
}

function handleCarUploads(req, res, next) {
  upload.fields(imageFields)(req, res, (error) => {
    if (!error) return next();

    deleteTemporaryFiles(req);

    const messages = {
      LIMIT_FILE_SIZE: 'Одна из фотографий больше 15 МБ',
      LIMIT_FILE_COUNT: `Можно загрузить не больше ${MAX_GALLERY_IMAGES} фотографий`,
      LIMIT_UNEXPECTED_FILE: `В галерее может быть не больше ${MAX_GALLERY_IMAGES} фотографий`,
      LIMIT_PART_COUNT: 'В форме слишком много данных',
    };

    const fieldName =
      error.field === 'previewImage' || error.field === 'mainImage'
        ? error.field
        : 'galleryImages';
    const message =
      messages[error.code] ||
      error.message ||
      'Не удалось загрузить фотографии';

    return res.status(400).json({
      success: false,
      code: error.code || 'IMAGE_UPLOAD_ERROR',
      message,
      errors: {
        [fieldName]: message,
      },
    });
  });
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeNullableString(value) {
  const normalized = normalizeString(value);

  return normalized || null;
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function normalizeNumber(value, fallback = 100) {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    return fallback;
  }

  return number;
}

function createSlug(value) {
  return normalizeString(value)
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

function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function buildCarPayload(body) {
  const title = normalizeString(body.title);
  const slug = normalizeString(body.slug || createSlug(title)).toLowerCase();
  const price = normalizeString(body.price) || 'Цена уточняется';

  if (title.length < 2) {
    return {
      error: 'Название автомобиля должно быть не короче 2 символов',
      field: 'title',
    };
  }

  if (!isValidSlug(slug)) {
    return {
      error: 'Slug должен быть латиницей: toyota-land-cruiser-300-zx-2023',
      field: 'slug',
    };
  }

  return {
    data: {
      title,
      slug,
      brand: normalizeNullableString(body.brand),
      model: normalizeNullableString(body.model),

      price,
      oldPrice: normalizeNullableString(body.oldPrice),

      badge: normalizeNullableString(body.badge),
      country: normalizeNullableString(body.country),
      city: normalizeNullableString(body.city),
      availability: normalizeNullableString(body.availability),

      year: normalizeNullableString(body.year),
      engine: normalizeNullableString(body.engine),
      power: normalizeNullableString(body.power),
      fuel: normalizeNullableString(body.fuel),
      mileage: normalizeNullableString(body.mileage),
      drive: normalizeNullableString(body.drive),
      gearbox: normalizeNullableString(body.gearbox),
      body: normalizeNullableString(body.body),
      color: normalizeNullableString(body.color),
      grade: normalizeNullableString(body.grade),
      complectation: normalizeNullableString(body.complectation),
      documents: normalizeNullableString(body.documents),

      auctionUrl: normalizeNullableString(body.auctionUrl),

      shortDescription: normalizeNullableString(body.shortDescription),
      description: normalizeNullableString(body.description),
      features: normalizeNullableString(body.features),
      conditionText: normalizeNullableString(body.conditionText),
      documentsText: normalizeNullableString(body.documentsText),
      serviceText: normalizeNullableString(body.serviceText),

      seoTitle: normalizeNullableString(body.seoTitle),
      seoDescription: normalizeNullableString(body.seoDescription),

      isActive: normalizeBoolean(body.isActive),
      showOnHome: normalizeBoolean(body.showOnHome),
      isFeatured: normalizeBoolean(body.isFeatured),

      sortOrder: normalizeNumber(body.sortOrder, 100),
    },
  };
}

async function optimizeImage(file, options = {}) {
  if (!file) {
    return null;
  }

  const width = options.width || 1400;
  const quality = options.quality || 84;

  const uploadsDir = path.join(process.cwd(), 'uploads', 'cars');
  const outputFilename = `car-${path.parse(file.filename).name}.webp`;
  const outputPath = path.join(uploadsDir, outputFilename);

  try {
    await sharp(file.path, {
      failOn: 'error',
      limitInputPixels: 100_000_000,
      sequentialRead: true,
    })
      .rotate()
      .resize({
        width,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 4,
        smartSubsample: true,
      })
      .toFile(outputPath);

    return `/uploads/cars/${outputFilename}`;
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    const imageError = new Error(
      `Не удалось обработать фотографию «${file.originalname}». Проверьте, что файл не повреждён.`,
    );
    imageError.code = 'SHARP_IMAGE_ERROR';
    imageError.field = file.fieldname;
    imageError.cause = error;
    throw imageError;
  } finally {
    if (fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('Не удалось удалить временный файл:', file.path);
        }
      }
    }
  }
}

async function optimizeRequestImage(req, file, options = {}) {
  const imagePath = await optimizeImage(file, options);

  req.optimizedCarFiles = req.optimizedCarFiles || [];
  req.optimizedCarFiles.push(imagePath);

  return imagePath;
}

function deleteUploadFile(filePath) {
  if (!filePath || !filePath.startsWith('/uploads/cars/')) {
    return;
  }

  const normalizedPath = filePath.replace(/^\//, '');
  const fullPath = path.join(process.cwd(), normalizedPath);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  try {
    fs.unlinkSync(fullPath);
  } catch (error) {
    if (
      error.code !== 'ENOENT' &&
      error.code !== 'EBUSY' &&
      error.code !== 'EPERM'
    ) {
      console.warn('Не удалось удалить файл:', fullPath);
    }
  }
}

function deleteUploadFiles(filePaths) {
  [...new Set(filePaths.filter(Boolean))].forEach(deleteUploadFile);
}

async function processCarImages(req, existingCar = null) {
  const previewImageFile = req.files?.previewImage?.[0];
  const mainImageFile = req.files?.mainImage?.[0] || req.files?.image?.[0];

  const data = {};
  const replacedFiles = [];

  if (previewImageFile) {
    const previewImage = await optimizeRequestImage(req, previewImageFile, {
      width: 800,
      quality: 82,
    });

    data.previewImage = previewImage;

    if (existingCar?.previewImage) {
      replacedFiles.push(existingCar.previewImage);
    }
  } else if (normalizeBoolean(req.body.removePreviewImage)) {
    data.previewImage = null;

    if (existingCar?.previewImage) {
      replacedFiles.push(existingCar.previewImage);
    }
  }

  if (mainImageFile) {
    const mainImage = await optimizeRequestImage(req, mainImageFile, {
      width: 1800,
      quality: 86,
    });

    data.mainImage = mainImage;
    data.image = mainImage;

    if (existingCar?.mainImage) {
      replacedFiles.push(existingCar.mainImage);
    }

    if (existingCar?.image) {
      replacedFiles.push(existingCar.image);
    }
  } else if (normalizeBoolean(req.body.removeMainImage)) {
    data.mainImage = null;
    data.image = null;

    if (existingCar?.mainImage) {
      replacedFiles.push(existingCar.mainImage);
    }

    if (existingCar?.image) {
      replacedFiles.push(existingCar.image);
    }
  }

  return {
    data,
    replacedFiles,
  };
}

async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

async function optimizeGalleryImages(req) {
  const galleryFiles = req.files?.galleryImages || [];

  if (!galleryFiles.length) {
    return [];
  }

  const results = await mapWithConcurrency(galleryFiles, 2, async (file) => {
    try {
      return {
        image: await optimizeRequestImage(req, file, {
          width: 1800,
          quality: 84,
        }),
      };
    } catch (error) {
      return { error };
    }
  });
  const failedResult = results.find((result) => result.error);

  if (failedResult) {
    throw failedResult.error;
  }

  return results.map((result) => result.image);
}

function handlePrismaError(error, res, fallbackMessage) {
  if (error.code === 'SHARP_IMAGE_ERROR') {
    const fieldName =
      error.field === 'previewImage' || error.field === 'mainImage'
        ? error.field
        : 'galleryImages';

    return res.status(400).json({
      success: false,
      code: error.code,
      message: error.message,
      errors: {
        [fieldName]: error.message,
      },
    });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return res.status(409).json({
      success: false,
      message: 'Автомобиль с таким slug уже существует',
      errors: {
        slug: 'Этот slug уже используется другим автомобилем',
      },
    });
  }

  console.error(fallbackMessage, error);

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
}

router.get('/admin/cars', requireAdminAuth, async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      include: {
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return res.status(200).json({
      success: true,
      cars,
    });
  } catch (error) {
    console.error('Admin cars loading error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка загрузки автомобилей',
    });
  }
});

router.get('/admin/cars/:id', requireAdminAuth, async (req, res) => {
  try {
    const carId = Number(req.params.id);

    if (!Number.isInteger(carId) || carId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID автомобиля',
      });
    }

    const car = await prisma.car.findUnique({
      where: {
        id: carId,
      },
      include: {
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Автомобиль не найден',
      });
    }

    return res.status(200).json({
      success: true,
      car,
    });
  } catch (error) {
    console.error('Admin car loading error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка загрузки автомобиля',
    });
  }
});

router.post(
  '/admin/cars',
  requireAdminAuth,
  handleCarUploads,
  async (req, res) => {
    try {
      const payload = buildCarPayload(req.body);

      if (payload.error) {
        deleteTemporaryFiles(req);

        return res.status(400).json({
          success: false,
          message: payload.error,
          errors: {
            [payload.field]: payload.error,
          },
        });
      }

      const imageResult = await processCarImages(req);
      const galleryImages = await optimizeGalleryImages(req);
      const createdCar = await prisma.$transaction(async (transaction) => {
        const createdCar = await transaction.car.create({
          data: {
            ...payload.data,
            ...imageResult.data,
          },
        });

        if (galleryImages.length) {
          await transaction.carImage.createMany({
            data: galleryImages.map((image, index) => ({
              carId: createdCar.id,
              image,
              alt: null,
              sortOrder: index + 1,
            })),
          });
        }

        return transaction.car.findUnique({
          where: { id: createdCar.id },
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        });
      });

      return res.status(201).json({
        success: true,
        car: createdCar,
      });
    } catch (error) {
      deleteTemporaryFiles(req);
      deleteUploadFiles(req.optimizedCarFiles || []);
      return handlePrismaError(error, res, 'Ошибка создания автомобиля');
    }
  },
);

router.put(
  '/admin/cars/:id',
  requireAdminAuth,
  handleCarUploads,
  async (req, res) => {
    try {
      const carId = Number(req.params.id);

      if (!Number.isInteger(carId) || carId <= 0) {
        deleteTemporaryFiles(req);

        return res.status(400).json({
          success: false,
          message: 'Некорректный ID автомобиля',
        });
      }

      const existingCar = await prisma.car.findUnique({
        where: {
          id: carId,
        },
      });

      if (!existingCar) {
        deleteTemporaryFiles(req);

        return res.status(404).json({
          success: false,
          message: 'Автомобиль не найден',
        });
      }

      const payload = buildCarPayload(req.body);

      if (payload.error) {
        deleteTemporaryFiles(req);

        return res.status(400).json({
          success: false,
          message: payload.error,
          errors: {
            [payload.field]: payload.error,
          },
        });
      }

      const existingGalleryCount = await prisma.carImage.count({
        where: { carId },
      });
      const newGalleryCount = req.files?.galleryImages?.length || 0;

      if (existingGalleryCount + newGalleryCount > MAX_GALLERY_IMAGES) {
        deleteTemporaryFiles(req);

        return res.status(400).json({
          success: false,
          message: `В галерее может быть не больше ${MAX_GALLERY_IMAGES} фотографий`,
          errors: {
            galleryImages: `Удалите лишние фотографии. Сейчас загружено ${existingGalleryCount}, выбрано ещё ${newGalleryCount}.`,
          },
        });
      }

      const imageResult = await processCarImages(req, existingCar);
      const galleryImages = await optimizeGalleryImages(req);

      const updatedCar = await prisma.$transaction(async (transaction) => {
        await transaction.car.update({
          where: { id: carId },
          data: {
            ...payload.data,
            ...imageResult.data,
          },
        });

        if (galleryImages.length) {
          await transaction.carImage.createMany({
            data: galleryImages.map((image, index) => ({
              carId,
              image,
              alt: null,
              sortOrder: existingGalleryCount + index + 1,
            })),
          });
        }

        return transaction.car.findUnique({
          where: { id: carId },
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        });
      });

      const activePrimaryImages = [
        updatedCar.previewImage,
        updatedCar.image,
        updatedCar.mainImage,
      ];
      deleteUploadFiles(
        imageResult.replacedFiles.filter(
          (imagePath) => !activePrimaryImages.includes(imagePath),
        ),
      );

      return res.status(200).json({
        success: true,
        car: updatedCar,
      });
    } catch (error) {
      deleteTemporaryFiles(req);
      deleteUploadFiles(req.optimizedCarFiles || []);
      return handlePrismaError(error, res, 'Ошибка обновления автомобиля');
    }
  },
);

router.patch('/admin/cars/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const carId = Number(req.params.id);

    if (!Number.isInteger(carId) || carId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID автомобиля',
      });
    }

    const car = await prisma.car.findUnique({
      where: {
        id: carId,
      },
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Автомобиль не найден',
      });
    }

    const updatedCar = await prisma.car.update({
      where: {
        id: carId,
      },
      data: {
        isActive: !car.isActive,
      },
    });

    return res.status(200).json({
      success: true,
      car: updatedCar,
    });
  } catch (error) {
    console.error('Toggle car status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка изменения статуса автомобиля',
    });
  }
});

router.delete(
  '/admin/cars/:carId/images/:imageId',
  requireAdminAuth,
  async (req, res) => {
    try {
      const carId = Number(req.params.carId);
      const imageId = Number(req.params.imageId);

      if (
        !Number.isInteger(carId) ||
        carId <= 0 ||
        !Number.isInteger(imageId) ||
        imageId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Некорректный ID фотографии',
        });
      }

      const image = await prisma.carImage.findFirst({
        where: {
          id: imageId,
          carId,
        },
      });

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Фотография не найдена',
        });
      }

      await prisma.carImage.delete({
        where: {
          id: image.id,
        },
      });

      deleteUploadFile(image.image);

      return res.status(200).json({
        success: true,
        message: 'Фотография удалена',
      });
    } catch (error) {
      console.error('Delete car image error:', error);

      return res.status(500).json({
        success: false,
        message: 'Ошибка удаления фотографии',
      });
    }
  },
);

router.delete('/admin/cars/:id', requireAdminAuth, async (req, res) => {
  try {
    const carId = Number(req.params.id);

    if (!Number.isInteger(carId) || carId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID автомобиля',
      });
    }

    const car = await prisma.car.findUnique({
      where: {
        id: carId,
      },
      include: {
        images: true,
      },
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Автомобиль не найден',
      });
    }

    const carFiles = [
      car.previewImage,
      car.image,
      car.mainImage,
      ...car.images.map((item) => item.image),
    ];

    await prisma.car.delete({
      where: {
        id: carId,
      },
    });

    deleteUploadFiles(carFiles);

    return res.status(200).json({
      success: true,
      message: 'Автомобиль удалён',
    });
  } catch (error) {
    console.error('Delete car error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка удаления автомобиля',
    });
  }
});

module.exports = router;
