import { IsString, IsOptional, IsDate, IsNumber, IsEnum } from 'class-validator';

export enum PayrollSyncType {
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  CANCELLATION = 'cancellation',
  ADJUSTMENT = 'adjustment',
  ACCRUAL = 'accrual',
  CARRY_FORWARD = 'carry_forward',
}

export class SyncWithPayrollDto {
  @IsString()
  leaveRequestId: string;

  @IsEnum(PayrollSyncType)
  syncType: PayrollSyncType;

  @IsString()
  employeeId: string;

  @IsOptional()
  @IsDate()
  effectiveDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
