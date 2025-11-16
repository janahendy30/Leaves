import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeaveType } from './leave-type.schema';
import { LeavePackage } from './leave-package.schema';

@Schema({ timestamps: true })
export class EmployeeEntitlementOverride extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: LeaveType.name, required: true })
  leaveType: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: LeavePackage.name })
  leavePackage?: Types.ObjectId; // optional: override within a package

  @Prop({ required: true })
  daysPerYearOverride: number; // personalized annual entitlement

  @Prop()
  effectiveFrom?: Date;

  @Prop()
  effectiveTo?: Date;

  @Prop()
  reason?: string; // why override exists

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  createdByUserId?: Types.ObjectId;
}

export const EmployeeEntitlementOverrideSchema =
  SchemaFactory.createForClass(EmployeeEntitlementOverride);
