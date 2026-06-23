const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const car = await prisma.car.upsert({
    where: {
      slug: 'toyota-land-cruiser-300-zx-2023',
    },
    update: {
      title: 'Toyota Land Cruiser 300 ZX, 2023',
      brand: 'Toyota',
      model: 'Land Cruiser 300',
      price: '12 900 000 ₽',
      badge: 'Проверенный автомобиль',
      country: 'Япония',
      city: 'Владивосток',
      availability: 'В наличии',
      year: '2023',
      engine: '3.5 л бензин',
      power: '415 л.с.',
      fuel: 'Бензин',
      mileage: '27 000 км',
      drive: '4WD',
      gearbox: 'АКПП',
      body: 'Внедорожник 5 дв.',
      color: 'Чёрный металлик',
      grade: '4.5 (B)',
      complectation: 'ZX',
      documents: 'ПТС',
      auctionUrl: 'https://auc.tajp.com/',
      previewImage: '/site/img/Audi-Q2L/audiq2l-gr.png',
      image: '/site/img/Audi-Q2L/audiq2l.jpg',
      mainImage: '/site/img/Audi-Q2L/audiq2l.jpg',
      shortDescription:
        'Флагманский внедорожник с легендарной надёжностью, мощным мотором и максимальным комфортом.',
      description:
        'Toyota Land Cruiser 300 ZX — флагманский внедорожник с легендарной надёжностью и максимальным комфортом. Автомобиль приобретён на аукционе в Японии, находится в отличном техническом состоянии и полностью готов к эксплуатации. Богатая комплектация ZX включает премиальную отделку, современные системы безопасности, полный привод и высокий уровень комфорта для водителя и пассажиров.',
      features:
        'Кожаный салон, мультимедиа, камеры кругового обзора, адаптивный круиз-контроль, подогрев и вентиляция сидений.',
      conditionText:
        'Без ДТП и окрасов\nОтличное техническое состояние\nАукционный автомобиль\nГотов к постановке на учёт',
      documentsText:
        'ПТС РФ\nТаможенная декларация\nАукционный лист\nСервисная книжка',
      serviceText:
        'Проверка техники и документов\nПомощь с доставкой по России\nСопровождение сделки под ключ',
      seoTitle:
        'Toyota Land Cruiser 300 ZX 2023 под заказ — АвтоZавоз',
      seoDescription:
        'Toyota Land Cruiser 300 ZX 2023 из Японии. Цена под ключ, проверка, доставка, растаможка и оформление документов.',
      isActive: true,
      showOnHome: true,
      isFeatured: true,
      sortOrder: 1,
    },
    create: {
      title: 'Toyota Land Cruiser 300 ZX, 2023',
      slug: 'toyota-land-cruiser-300-zx-2023',
      brand: 'Toyota',
      model: 'Land Cruiser 300',
      price: '12 900 000 ₽',
      badge: 'Проверенный автомобиль',
      country: 'Япония',
      city: 'Владивосток',
      availability: 'В наличии',
      year: '2023',
      engine: '3.5 л бензин',
      power: '415 л.с.',
      fuel: 'Бензин',
      mileage: '27 000 км',
      drive: '4WD',
      gearbox: 'АКПП',
      body: 'Внедорожник 5 дв.',
      color: 'Чёрный металлик',
      grade: '4.5 (B)',
      complectation: 'ZX',
      documents: 'ПТС',
      auctionUrl: 'https://auc.tajp.com/',
      previewImage: '/site/img/Audi-Q2L/audiq2l-gr.png',
      image: '/site/img/Audi-Q2L/audiq2l.jpg',
      mainImage: '/site/img/Audi-Q2L/audiq2l.jpg',
      shortDescription:
        'Флагманский внедорожник с легендарной надёжностью, мощным мотором и максимальным комфортом.',
      description:
        'Toyota Land Cruiser 300 ZX — флагманский внедорожник с легендарной надёжностью и максимальным комфортом. Автомобиль приобретён на аукционе в Японии, находится в отличном техническом состоянии и полностью готов к эксплуатации. Богатая комплектация ZX включает премиальную отделку, современные системы безопасности, полный привод и высокий уровень комфорта для водителя и пассажиров.',
      features:
        'Кожаный салон, мультимедиа, камеры кругового обзора, адаптивный круиз-контроль, подогрев и вентиляция сидений.',
      conditionText:
        'Без ДТП и окрасов\nОтличное техническое состояние\nАукционный автомобиль\nГотов к постановке на учёт',
      documentsText:
        'ПТС РФ\nТаможенная декларация\nАукционный лист\nСервисная книжка',
      serviceText:
        'Проверка техники и документов\nПомощь с доставкой по России\nСопровождение сделки под ключ',
      seoTitle:
        'Toyota Land Cruiser 300 ZX 2023 под заказ — АвтоZавоз',
      seoDescription:
        'Toyota Land Cruiser 300 ZX 2023 из Японии. Цена под ключ, проверка, доставка, растаможка и оформление документов.',
      isActive: true,
      showOnHome: true,
      isFeatured: true,
      sortOrder: 1,
    },
  });

  await prisma.carImage.deleteMany({
    where: {
      carId: car.id,
    },
  });

  await prisma.carImage.createMany({
    data: [
      {
        carId: car.id,
        image: '/site/img/Audi-Q2L/audiq2l.jpg',
        alt: 'Toyota Land Cruiser 300 ZX 2023 главное фото',
        sortOrder: 1,
      },
      {
        carId: car.id,
        image: '/site/img/Audi-Q2L/audiq2l-gr.png',
        alt: 'Toyota Land Cruiser 300 ZX 2023 превью',
        sortOrder: 2,
      },
    ],
  });

  console.log('Тестовый автомобиль создан/обновлён:');
  console.log(`/cars/${car.slug}`);
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
