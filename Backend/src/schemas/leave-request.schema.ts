import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeaveType } from './leave-type.schema';
import {
  LeaveRequestStatus,
  PayrollSyncStatus,
  PayrollSyncType,
} from './leaves.enums';

// REQ-017: sub-document for modification history
@Schema()
export class LeaveRequestChange {
  @Prop({ required: true })
  changedAt: Date;

  @Prop({ required: true })
  changedByUserId: string; // employee or HR

  @Prop({ type: [String], default: [] })
  changedFields: string[]; // e.g. ["startDate", "endDate"]

  @Prop()
  comment?: string; // reason for modification

  @Prop({ type: String, enum: LeaveRequestStatus })
  previousStatus?: LeaveRequestStatus;

  @Prop({ type: String, enum: LeaveRequestStatus })
  newStatus?: LeaveRequestStatus;
}

export const LeaveRequestChangeSchema =
  SchemaFactory.createForClass(LeaveRequestChange);

@Schema({ timestamps: true })
export class LeaveRequest extends Document {
  //@Prop({ required: true })
  //employeeId: string; // from Employee Profile

  //@Prop()
  //employeeName?: string; // denormalized for reporting

  @Prop({ type: Types.ObjectId, ref: LeaveType.name, required: true })
  leaveType: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 0 })
  totalCalendarDays: number;

  @Prop({ default: 0 })
  totalWorkingDays: number; // excluding weekends/holidays per REQ-010, BR 23

  @Prop({ default: false })
  isPostLeaveRequest: boolean; // REQ-031

  @Prop()
  justification?: string;

  @Prop({ type: [String], default: [] })
  attachmentUrls: string[]; // REQ-016

  // Workflow
  @Prop({
    type: String,
    enum: LeaveRequestStatus,
    default: LeaveRequestStatus.PENDING_MANAGER,
  })
  status: LeaveRequestStatus;

  //@Prop()
  //managerId?: string; // from Org Structure

  @Prop()
  managerDecisionAt?: Date;

  @Prop()
  managerComment?: string;

  @Prop()
  hrAdminId?: string;

  @Prop()
  hrDecisionAt?: Date;

  @Prop()
  hrComment?: string;

  @Prop({ default: false })
  escalated: boolean; // after 48h, BR 28

  @Prop()
  escalatedAt?: Date;

  @Prop({ default: false })
  cancelledByEmployee: boolean; // REQ-018

  @Prop()
  cancelledAt?: Date;

  @Prop({ default: false })
  overlapsWithExistingApproved: boolean; // BR 31

  @Prop({ default: false })
  convertedExcessToUnpaid: boolean; // BR 29

  @Prop({ default: 0 })
  excessDaysConvertedToUnpaid: number;

  //@Prop()
  //timeManagementEventId?: string; // ID pushed to Time Management

  //@Prop()
  //payrollImpactRef?: string; // link to payroll adjustment/encashment

  // REQ-042: Enhanced Payroll Synchronization Tracking
 // @Prop({ type: String, enum: PayrollSyncStatus })
  //payrollSyncStatus?: PayrollSyncStatus; // Status of payroll synchronization

  //@Prop()
 // payrollSyncAttemptedAt?: Date; // When last sync was attempted

  //@Prop()
  //payrollSyncCompletedAt?: Date; // When sync completed successfully

  //@Prop()
  //payrollSyncError?: string; // Error message if sync failed

  //@Prop({ default: 0 })
  //payrollSyncRetryCount: number; // Number of retry attempts

  //@Prop({ type: String, enum: PayrollSyncType })
  //payrollSyncType?: PayrollSyncType; // Type of payroll sync operation

  @Prop({ default: false })
  requiresDocumentVerification: boolean; // REQ-028

  @Prop({ default: false })
  documentVerified: boolean;

  // REQ-017: Modification tracking
  @Prop({ default: 1 })
  version: number; // Increment on each modification

  @Prop({ type: [LeaveRequestChangeSchema], default: [] })
  changeHistory: LeaveRequestChange[]; // full history of changes
}

export const LeaveRequestSchema =
  SchemaFactory.createForClass(LeaveRequest);
