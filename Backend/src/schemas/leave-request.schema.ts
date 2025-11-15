
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeaveType } from './leave-type.schema';
import { LeaveRequestStatus } from './leaves.enums';

@Schema({ timestamps: true })
export class LeaveRequest extends Document {
  @Prop({ required: true })
  employeeId: string; // from Employee Profile

  @Prop()
  employeeName?: string; // denormalized for reporting

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
  @Prop({ type: String, enum: LeaveRequestStatus, default: LeaveRequestStatus.PENDING_MANAGER })
  status: LeaveRequestStatus;

  @Prop()
  managerId?: string; // from Org Structure

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

  @Prop()
  timeManagementEventId?: string; // ID pushed to Time Management

  @Prop()
  payrollImpactRef?: string; // link to payroll adjustment/encashment

  @Prop({ default: false })
  requiresDocumentVerification: boolean; // REQ-028

  @Prop({ default: false })
  documentVerified: boolean;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);
