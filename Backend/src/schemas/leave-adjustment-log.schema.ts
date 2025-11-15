
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeaveType } from './leave-type.schema';
import { AdjustmentSource } from './leaves.enums';

@Schema({ timestamps: true })
export class LeaveAdjustmentLog extends Document {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ type: Types.ObjectId, ref: LeaveType.name, required: true })
  leaveType: Types.ObjectId;

  @Prop({ type: String, enum: AdjustmentSource, required: true })
  source: AdjustmentSource; // MANUAL, ACCRUAL, CARRY_FORWARD, REQUEST_APPROVAL...

  @Prop({ required: true })
  leaveYear: number;

  @Prop({ required: true })
  amountActual: number; // positive or negative

  @Prop({ required: true })
  amountRounded: number;

  @Prop({ required: true })
  balanceAfterActual: number;

  @Prop({ required: true })
  balanceAfterRounded: number;

  @Prop()
  relatedRequestId?: string; // LeaveRequest._id as string

  @Prop()
  relatedPayrollRef?: string;

  @Prop()
  performedByUserId?: string; // HR admin ID (or "system")

  @Prop()
  reason?: string;
}

export const LeaveAdjustmentLogSchema =
  SchemaFactory.createForClass(LeaveAdjustmentLog);
