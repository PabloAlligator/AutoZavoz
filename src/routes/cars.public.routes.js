const express = require('express');
const prisma = require('../db');

const router = express.Router();

function buildCarsWhere(query) {
  const where = {
    isActive: true,
  };

  if (query.home === 'true') {
    where.showOnHome = true;
  }

  if (query.featured === 'true') {
    where.isFeatured = true;
  }

  if (query.search) {
    const search = String(query.search).trim();

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { year: { contains: search } },
        { engine: { contains: search } },
        { complectation: { contains: search } },
      ];
    }
  }

  ['brand', 'country', 'city', 'body', 'gearbox', 'drive', 'availability'].forEach(
    (field) => {
      if (query[field]) {
        where[field] = String(query[field]).trim();
      }
    },
  );

  return where;
}

router.get('/cars', async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: buildCarsWhere(req.query),
      include: {
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return res.status(200).json({
      success: true,
      cars,
    });
  } catch (error) {
    console.error('Ошибка получения машин:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
});

router.get('/cars/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Некорректная ссылка автомобиля',
      });
    }

    const car = await prisma.car.findFirst({
      where: {
        slug,
        isActive: true,
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

    const similarFilters = [
      car.brand ? { brand: car.brand } : null,
      car.body ? { body: car.body } : null,
      car.country ? { country: car.country } : null,
    ].filter(Boolean);

    const similarCars = similarFilters.length
      ? await prisma.car.findMany({
          where: {
            isActive: true,
            id: {
              not: car.id,
            },
            OR: similarFilters,
          },
          take: 3,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        })
      : [];

    return res.status(200).json({
      success: true,
      car,
      similarCars,
    });
  } catch (error) {
    console.error('Ошибка получения машины:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
});

module.exports = router;
