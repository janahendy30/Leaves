// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums'; 
import { ROLES_KEY } from '../decorators/roles.decorator'; 

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<SystemRole[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles) {
      return true; // No roles required, so allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assume user is added to the request via JWT authentication
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}