-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Survey" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestion" (
    "id" SERIAL NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "text" TEXT NOT NULL,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyOption" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "text" TEXT NOT NULL,

    CONSTRAINT "SurveyOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAudience" (
    "id" SERIAL NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "audienceId" INTEGER NOT NULL,

    CONSTRAINT "SurveyAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAnswer" (
    "id" SERIAL NOT NULL,
    "responseId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "optionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Survey_status_startAt_endAt_idx" ON "Survey"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "SurveyQuestion_surveyId_order_idx" ON "SurveyQuestion"("surveyId", "order");

-- CreateIndex
CREATE INDEX "SurveyOption_questionId_order_idx" ON "SurveyOption"("questionId", "order");

-- CreateIndex
CREATE INDEX "SurveyAudience_audienceId_idx" ON "SurveyAudience"("audienceId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyAudience_surveyId_audienceId_key" ON "SurveyAudience"("surveyId", "audienceId");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_createdAt_idx" ON "SurveyResponse"("surveyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_userId_surveyId_key" ON "SurveyResponse"("userId", "surveyId");

-- CreateIndex
CREATE INDEX "SurveyAnswer_questionId_optionId_idx" ON "SurveyAnswer"("questionId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyAnswer_responseId_questionId_key" ON "SurveyAnswer"("responseId", "questionId");

-- AddForeignKey
ALTER TABLE "SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyOption" ADD CONSTRAINT "SurveyOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAudience" ADD CONSTRAINT "SurveyAudience_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAudience" ADD CONSTRAINT "SurveyAudience_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SurveyOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
