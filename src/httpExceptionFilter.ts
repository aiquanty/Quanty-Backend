import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception.getStatus !== undefined ? exception.getStatus() : 404;
    console.log(status, exception.message);
    if (status === 404) {
      response.status(status).send({
        success: false,
        message: exception.message,
      });
      return;
    }

    response.status(status).send(
      exception.getResponse() ?? {
        success: false,
        message: exception.message,
      },
    );
  }
}
