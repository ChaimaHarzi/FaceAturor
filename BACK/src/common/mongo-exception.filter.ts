import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Error as MongooseError, mongo } from 'mongoose';

/** Turns database errors into clean 400/409 responses instead of 500s. */
@Catch(mongo.MongoServerError, MongooseError.ValidationError, MongooseError.CastError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception?.code === 11000) {
      const field = Object.keys(exception.keyValue ?? {})[0] ?? 'value';
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: `This ${field} is already used`,
        error: 'Conflict',
      });
    }
    if (
      exception instanceof MongooseError.ValidationError ||
      exception instanceof MongooseError.CastError
    ) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        error: 'Bad Request',
      });
    }
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
