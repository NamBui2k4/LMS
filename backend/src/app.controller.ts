import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

// dang nhap: /auth/login
// profile: GET http://localhost:3000/buiphuongnam.7331/
// dang ky:   POST http://localhost:3000/auth/sign?name=Nam&age=21
// 
// GET, POST, PUT

// Restful API