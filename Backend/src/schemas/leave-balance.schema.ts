
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeaveType } from './leave-type.schema';
import { LeavePackage } from './leave-package.schema';

@Schema({ timestamps: true })
export class LeaveBalance extends Document {
  //@Prop({ required: true })
  //employeeId: string; // from Employee Profile subsystem

  @Prop({ type: Types.ObjectId, ref: LeaveType.name, required: true })
  leaveType: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: LeavePackage.name })
  leavePackage?: Types.ObjectId;

  @Prop({ required: true })
  leaveYear: number; // e.g. 2025

  // Raw values (pre rounding)
  @Prop({ default: 0 })
  accruedActual: number;

  @Prop({ default: 0 })
  takenActual: number;

  @Prop({ default: 0 })
  pendingActual: number;

  @Prop({ default: 0 })
  carryOverActual: number;

  @Prop({ default: 0 })
  encashedActual: number;

  // Rounded values (for display)
  @Prop({ default: 0 })
  accruedRounded: number;

  @Prop({ default: 0 })
  takenRounded: number;

  @Prop({ default: 0 })
  pendingRounded: number;

  @Prop({ default: 0 })
  carryOverRounded: number;

  @Prop({ default: 0 })
  encashedRounded: number;

  @Prop({ default: 0 })
  remainingActual: number;

  @Prop({ default: 0 })
  remainingRounded: number;

  @Prop({ default: false })
  lockedForYearEnd: boolean; // after carry forward run
}

export const LeaveBalanceSchema = SchemaFactory.createForClass(LeaveBalance);
