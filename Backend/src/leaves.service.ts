import { Injectable } from '@nestjs/common';

@Injectable()
export class LeavesService {
  // For Milestone 1 this can stay mostly empty.
  // Later you'll add real logic here.

  healthCheck(): string {
    return 'Leaves service is up';
  }
}
