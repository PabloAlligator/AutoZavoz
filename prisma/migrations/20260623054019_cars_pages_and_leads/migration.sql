-- CreateTable
CREATE TABLE "CarImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "carId" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarImage_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leadType" TEXT NOT NULL DEFAULT 'general',
    "source" TEXT,
    "customerName" TEXT,
    "phone" TEXT NOT NULL,
    "messenger" TEXT,
    "city" TEXT,
    "budget" TEXT,
    "message" TEXT,
    "carId" INTEGER,
    "carTitleSnapshot" TEXT,
    "carSlugSnapshot" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Car" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "price" TEXT NOT NULL,
    "oldPrice" TEXT,
    "badge" TEXT,
    "country" TEXT,
    "city" TEXT,
    "availability" TEXT,
    "year" TEXT,
    "engine" TEXT,
    "power" TEXT,
    "fuel" TEXT,
    "mileage" TEXT,
    "drive" TEXT,
    "gearbox" TEXT,
    "body" TEXT,
    "color" TEXT,
    "grade" TEXT,
    "complectation" TEXT,
    "documents" TEXT,
    "auctionUrl" TEXT,
    "previewImage" TEXT,
    "image" TEXT,
    "mainImage" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "features" TEXT,
    "conditionText" TEXT,
    "documentsText" TEXT,
    "serviceText" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnHome" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Car" ("auctionUrl", "badge", "complectation", "createdAt", "drive", "engine", "gearbox", "grade", "id", "image", "isActive", "mileage", "previewImage", "price", "slug", "sortOrder", "title", "updatedAt", "year") SELECT "auctionUrl", "badge", "complectation", "createdAt", "drive", "engine", "gearbox", "grade", "id", "image", "isActive", "mileage", "previewImage", "price", "slug", "sortOrder", "title", "updatedAt", "year" FROM "Car";
DROP TABLE "Car";
ALTER TABLE "new_Car" RENAME TO "Car";
CREATE UNIQUE INDEX "Car_slug_key" ON "Car"("slug");
CREATE INDEX "Car_isActive_idx" ON "Car"("isActive");
CREATE INDEX "Car_showOnHome_idx" ON "Car"("showOnHome");
CREATE INDEX "Car_isFeatured_idx" ON "Car"("isFeatured");
CREATE INDEX "Car_sortOrder_idx" ON "Car"("sortOrder");
CREATE INDEX "Car_brand_idx" ON "Car"("brand");
CREATE INDEX "Car_country_idx" ON "Car"("country");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CarImage_carId_idx" ON "CarImage"("carId");

-- CreateIndex
CREATE INDEX "CarImage_sortOrder_idx" ON "CarImage"("sortOrder");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_carId_idx" ON "Lead"("carId");
