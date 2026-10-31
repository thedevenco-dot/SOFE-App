import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminUserDocument => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin as AdminUserDocument;
  },
);
