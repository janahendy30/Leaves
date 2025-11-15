
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeaveType } from './leave-type.schema';
import { AccrualFrequency, RoundingMethod } from './leaves.enums';

@Schema()
export class LeaveEntitlementRule {
  @Prop({ type: Types.ObjectId, ref: LeaveType.name, required: true })
  leaveType: Types.ObjectId;

  @Prop({ required: true })
  daysPerYear: number;

  @Prop({ type: String, enum: AccrualFrequency, default: AccrualFrequency.MONTHLY })
  accrualFrequency: AccrualFrequency;

  @Prop()
  maxCarryForwardDays?: number; // e.g. 45

  @Prop()
  carryForwardExpiryYears?: number; // must be used within 1–2 years

  @Prop({ type: String, enum: RoundingMethod, default: RoundingMethod.ARITHMETIC })
  roundingMethod: RoundingMethod;

  @Prop()
  minTenureMonths?: number;

  @Prop()
  maxTenureMonths?: number;

  @Prop()
  applicableGrades?: string[]; // e.g. ["G1", "G2"]

  @Prop()
  applicableContractTypes?: string[]; // e.g. ["FULL_TIME", "PART_TIME"]
}

export const LeaveEntitlementRuleSchema =
  SchemaFactory.createForClass(LeaveEntitlementRule);

@Schema({ timestamps: true })
export class LeavePackage extends Document {
  @Prop({ required: true, unique: true })
  code: string; // e.g. "EGY_LOCAL", "FOREIGNER"

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  country?: string; // for national labor law link

  @Prop({ type: [LeaveEntitlementRuleSchema], default: [] })
  entitlements: LeaveEntitlementRule[];
}

export const LeavePackageSchema = SchemaFactory.createForClass(LeavePackage);
