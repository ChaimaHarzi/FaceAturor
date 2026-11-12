import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ADMIN_ROLES, Role } from '../common/enums';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { CoursesService } from './courses.service';
import { CreateCourseDto, ListByChildQuery, UpdateCourseDto } from './dto';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const optionalFile = new ParseFilePipe({
  fileIsRequired: false,
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE, message: 'File must be under 20 MB' }),
    new FileTypeValidator({
      fileType: /(pdf|msword|officedocument|presentation|image\/|video\/|text\/plain)/,
    }),
  ],
});

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListByChildQuery) {
    return this.courses.list(user, query);
  }

  @Post()
  @Roles(Role.TEACHER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCourseDto,
    @UploadedFile(optionalFile) file?: Express.Multer.File,
  ) {
    return this.courses.create(user, dto, file);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, ...ADMIN_ROLES)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @UploadedFile(optionalFile) file?: Express.Multer.File,
  ) {
    return this.courses.update(user, id, dto, file);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, ...ADMIN_ROLES)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    return this.courses.remove(user, id);
  }
}
