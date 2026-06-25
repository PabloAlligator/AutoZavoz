const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { Prisma } = require('@prisma/client');

const prisma = require('../db');
const upload = require('../config/multer');
const requireAdminAuth = require('../middleware/requireAdminAuth');

const router = express.Router();

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
    maxCount: 10,
  },
];

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
    };
  }

  if (!isValidSlug(slug)) {
    return {
      error: 'Slug должен быть латиницей: toyota-land-cruiser-300-zx-2023',
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
  const outputFilename = `optimized-${path.parse(file.filename).name}.webp`;
  const outputPath = path.join(uploadsDir, outputFilename);

  await sharp(file.path)
    .resize({
      width,
      withoutEnlargement: true,
    })
    .webp({
      quality,
    })
    .toFile(outputPath);

  if (fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      if (
        error.code !== 'ENOENT' &&
        error.code !== 'EBUSY' &&
        error.code !== 'EPERM'
      ) {
        console.warn('Не удалось удалить временный файл:', file.path);
      }
    }
  }

  return `/uploads/cars/${outputFilename}`;
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
  const imageFile = req.files?.image?.[0];
  const mainImageFile = req.files?.mainImage?.[0];

  const data = {};

  if (previewImageFile) {
    const previewImage = await optimizeImage(previewImageFile, {
      width: 800,
      quality: 82,
    });

    if (existingCar?.previewImage) {
      deleteUploadFile(existingCar.previewImage);
    }

    data.previewImage = previewImage;
  }

  if (imageFile) {
    const image = await optimizeImage(imageFile, {
      width: 1600,
      quality: 86,
    });

    if (existingCar?.image) {
      deleteUploadFile(existingCar.image);
    }

    data.image = image;
  }

  if (mainImageFile) {
    const mainImage = await optimizeImage(mainImageFile, {
      width: 1800,
      quality: 86,
    });

    if (existingCar?.mainImage) {
      deleteUploadFile(existingCar.mainImage);
    }

    data.mainImage = mainImage;
  }

  if (!data.mainImage && data.image && !existingCar?.mainImage) {
    data.mainImage = data.image;
  }

  return data;
}

async function processGalleryImages(req, carId) {
  const galleryFiles = req.files?.galleryImages || [];

  if (!galleryFiles.length) {
    return;
  }

  const existingCount = await prisma.carImage.count({
    where: {
      carId,
    },
  });

  const images = [];

  for (let index = 0; index < galleryFiles.length; index += 1) {
    const file = galleryFiles[index];

    const image = await optimizeImage(file, {
      width: 1800,
      quality: 86,
    });

    images.push({
      carId,
      image,
      alt: null,
      sortOrder: existingCount + index + 1,
    });
  }

  if (images.length) {
    await prisma.carImage.createMany({
      data: images,
    });
  }
}

function handlePrismaError(error, res, fallbackMessage) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return res.status(409).json({
      success: false,
      message: 'Автомобиль с таким slug уже существует',
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
  upload.fields(imageFields),
  async (req, res) => {
    try {
      const payload = buildCarPayload(req.body);

      if (payload.error) {
        return res.status(400).json({
          success: false,
          message: payload.error,
        });
      }

      const imageData = await processCarImages(req);

      const car = await prisma.car.create({
        data: {
          ...payload.data,
          ...imageData,
        },
      });

      await processGalleryImages(req, car.id);

      const createdCar = await prisma.car.findUnique({
        where: {
          id: car.id,
        },
        include: {
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        car: createdCar,
      });
    } catch (error) {
      return handlePrismaError(error, res, 'Ошибка создания автомобиля');
    }
  },
);

router.put(
  '/admin/cars/:id',
  requireAdminAuth,
  upload.fields(imageFields),
  async (req, res) => {
    try {
      const carId = Number(req.params.id);

      if (!Number.isInteger(carId) || carId <= 0) {
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
        return res.status(404).json({
          success: false,
          message: 'Автомобиль не найден',
        });
      }

      const payload = buildCarPayload(req.body);

      if (payload.error) {
        return res.status(400).json({
          success: false,
          message: payload.error,
        });
      }

      const imageData = await processCarImages(req, existingCar);

      await prisma.car.update({
        where: {
          id: carId,
        },
        data: {
          ...payload.data,
          ...imageData,
        },
      });

      await processGalleryImages(req, carId);

      const updatedCar = await prisma.car.findUnique({
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

      return res.status(200).json({
        success: true,
        car: updatedCar,
      });
    } catch (error) {
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

      deleteUploadFile(image.image);

      await prisma.carImage.delete({
        where: {
          id: image.id,
        },
      });

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

    deleteUploadFiles([
      car.previewImage,
      car.image,
      car.mainImage,
      ...car.images.map((item) => item.image),
    ]);

    await prisma.car.delete({
      where: {
        id: carId,
      },
    });

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
