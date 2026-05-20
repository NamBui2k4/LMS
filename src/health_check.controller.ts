import { Controller, Get, HttpException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, DataSource } from 'typeorm';

@Controller('api/v1')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}
  @Get('health')
  async check() {
    const start = Date.now();

    try {
      // Kiểm tra DB connection
      await this.connection.query('SELECT 1');

      const latency = Date.now() - start;

      // Nếu response quá chậm (do overload) → coi là unhealthy
      if (latency > 150) {  // ngưỡng tùy chỉnh
        throw new HttpException('High latency', 503);
      }

      return {
        status: 'ok',
        db: 'connected',
        latency_ms: latency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException('Unhealthy', 503);
    }
  }
}