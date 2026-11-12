import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CloudinaryService],
})
export class CoursesModule {}
