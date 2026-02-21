-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_trainerId_idx" ON "Booking"("trainerId");

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "Booking"("date");

-- CreateIndex
CREATE INDEX "TrainerProfile_specialization_idx" ON "TrainerProfile"("specialization");

-- CreateIndex
CREATE INDEX "TrainerProfile_isAvailable_idx" ON "TrainerProfile"("isAvailable");

-- CreateIndex
CREATE INDEX "TrainerProfile_rating_idx" ON "TrainerProfile"("rating");
