import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { HealthService, HealthStatus } from './health.service';
import { ApiSuccessEnvelope } from '@sofe/shared';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'API service health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is operational',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2026-10-29T10:00:00.000Z' },
            uptime: { type: 'number', example: 120 },
          },
        },
      },
    },
  })
  check(): ApiSuccessEnvelope<HealthStatus> {
    return this.healthService.check();
  }
}
