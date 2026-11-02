import { Reflector } from '@nestjs/core';
import { Type } from '@nestjs/common';
import { HealthController } from '../../health/health.controller';
import { AuthController } from '../../auth/auth.controller';
import { UsersController } from '../../users/users.controller';
import { AdminAuthController } from '../../admin/admin-auth.controller';
import { AdminAuditController } from '../../admin/admin-audit.controller';
import { CoursesController } from '../../content/courses.controller';
import { ArticlesController } from '../../content/articles.controller';
import { TopicsController } from '../../content/topics.controller';
import { AuthorsController } from '../../content/authors.controller';
import { BooksController } from '../../content/books.controller';
import { VideosController } from '../../content/videos.controller';
import { SearchController } from '../../content/search.controller';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_AUTH_KEY } from '../decorators/auth.decorator';
import { IS_ADMIN_AUTH_KEY } from '../decorators/admin-auth.decorator';

describe('Guard Coverage Security Audit', () => {
  const reflector = new Reflector();

  const controllers = [
    HealthController,
    AuthController,
    UsersController,
    AdminAuthController,
    AdminAuditController,
    CoursesController,
    ArticlesController,
    TopicsController,
    AuthorsController,
    BooksController,
    VideosController,
    SearchController,
  ];

  function isRouteGuarded(targetClass: Type<unknown>, methodName: string): boolean {
    const handler = targetClass.prototype[methodName];

    const isPublic =
      reflector.get<boolean>(IS_PUBLIC_KEY, handler) ||
      reflector.get<boolean>(IS_PUBLIC_KEY, targetClass);

    const isAuth =
      reflector.get<boolean>(IS_AUTH_KEY, handler) ||
      reflector.get<boolean>(IS_AUTH_KEY, targetClass);

    const isAdminAuth =
      reflector.get<boolean>(IS_ADMIN_AUTH_KEY, handler) ||
      reflector.get<boolean>(IS_ADMIN_AUTH_KEY, targetClass);

    return Boolean(isPublic || isAuth || isAdminAuth);
  }

  function getControllerRouteMethods(targetClass: Type<unknown>): string[] {
    const prototype = targetClass.prototype;
    return Object.getOwnPropertyNames(prototype).filter((prop) => {
      if (prop === 'constructor') return false;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
      return typeof descriptor?.value === 'function';
    });
  }

  it('should ensure EVERY route in registered controllers has an explicit guard decorator', () => {
    const unguardedRoutes: string[] = [];

    for (const controller of controllers) {
      const methods = getControllerRouteMethods(controller);
      for (const method of methods) {
        const guarded = isRouteGuarded(controller, method);
        if (!guarded) {
          unguardedRoutes.push(`${controller.name}.${method}`);
        }
      }
    }

    expect(unguardedRoutes).toEqual([]);
  });

  it('should catch and fail if a route has NO guard decorator', () => {
    class UnguardedController {
      unprotectedEndpoint() {
        return 'danger';
      }
    }

    const guarded = isRouteGuarded(UnguardedController, 'unprotectedEndpoint');
    expect(guarded).toBe(false);
  });
});
