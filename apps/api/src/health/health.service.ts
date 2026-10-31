import { Injectable } from '@nestjs/common';
import { ApiSuccessEnvelope } from '@sofe/shared';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

@Injectable()
export class HealthService {
  check(): ApiSuccessEnvelope<HealthStatus> {
    return {
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
      },
    };
  }
}
