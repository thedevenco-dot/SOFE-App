import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminModule } from '../admin.module';
import { AdminTaxonomyController } from './admin-taxonomy.controller';
import { AdminTaxonomyService } from './admin-taxonomy.service';

@Module({
  imports: [DatabaseModule, AdminModule],
  controllers: [AdminTaxonomyController],
  providers: [AdminTaxonomyService],
  exports: [AdminTaxonomyService],
})
export class AdminTaxonomyModule {}
