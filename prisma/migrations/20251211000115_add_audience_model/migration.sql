/*
  Warnings:

  - Added the required column `rules` to the `Audience` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Audience" ADD COLUMN     "rules" JSONB NOT NULL;
