import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

/* ---------------------- Base Schemas ---------------------- */

import { LeaveType, LeaveTypeSchema } from './schemas/leave-type.schema';
import { LeavePackage, LeavePackageSchema } from './schemas/leave-package.schema';
import { LeaveBalance, LeaveBalanceSchema } from './schemas/leave-balance.schema';
import {
  LeavePolicyConfig,
  LeavePolicyConfigSchema,
} from './schemas/leave-policy-config.schema';

import {
  HolidayCalendar,
  HolidayCalendarSchema,
} from './schemas/holiday-calendar.schema';

import { LeaveRequest, LeaveRequestSchema } from './schemas/leave-request.schema';

import {
  LeaveAdjustmentLog,
  LeaveAdjustmentLogSchema,
} from './schemas/leave-adjustment-log.schema';

import {
  ApprovalDelegation,
  ApprovalDelegationSchema,
} from './schemas/approval-delegation.schema';

/* ---------------------- Extra Schemas (REQ-008,017,027,039,042) ---------------------- */

import {
  EmployeeEntitlementOverride,
  EmployeeEntitlementOverrideSchema,
} from './schemas/employee-leave-entitlement-override.schema';

import {
  LeaveBulkOperation,
  LeaveBulkOperationSchema,
} from './schemas/leave-bulk-operation.schema';

import {
  LeavePatternFlag,
  LeavePatternFlagSchema,
} from './schemas/leave-pattern-flag.schema';

import {
  LeaveRequestHistory,
  LeaveRequestHistorySchema,
} from './schemas/leave-request-history.schema';

/* ---------------------- Service + Controller ---------------------- */

import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';

/* ---------------------- Module ---------------------- */

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: LeavePackage.name, schema: LeavePackageSchema },
      { name: LeaveBalance.name, schema: LeaveBalanceSchema },
      { name: LeavePolicyConfig.name, schema: LeavePolicyConfigSchema },
      { name: HolidayCalendar.name, schema: HolidayCalendarSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: LeaveAdjustmentLog.name, schema: LeaveAdjustmentLogSchema },
      { name: ApprovalDelegation.name, schema: ApprovalDelegationSchema },

      // ⭐ REQ-008
      { name: EmployeeEntitlementOverride.name, schema: EmployeeEntitlementOverrideSchema },

      // ⭐ REQ-027
      { name: LeaveBulkOperation.name, schema: LeaveBulkOperationSchema },

      // ⭐ REQ-039
      { name: LeavePatternFlag.name, schema: LeavePatternFlagSchema },

      // ⭐ REQ-017 (full request modification audit)
      { name: LeaveRequestHistory.name, schema: LeaveRequestHistorySchema },
    ]),
  ],

  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
