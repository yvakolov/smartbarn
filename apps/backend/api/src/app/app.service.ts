import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'smartbarn-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
