
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  AccrualFrequency,
  RoundingMethod,
  ResetCriterion,
} from './leaves.enums';

@Schema({ timestamps: true })
export class LeavePolicyConfig extends Document {
  @Prop({ type: String, enum: AccrualFrequency, default: AccrualFrequency.MONTHLY })
  defaultAccrualFrequency: AccrualFrequency;

  @Prop({ type: String, enum: RoundingMethod, default: RoundingMethod.ARITHMETIC })
  defaultRoundingMethod: RoundingMethod;

  @Prop({ type: String, enum: ResetCriterion, default: ResetCriterion.HIRE_DATE })
  resetCriterion: ResetCriterion; // Hire date, Work receiving date, etc.

  @Prop({ default: 45 })
  defaultMaxCarryForwardDays: number; // BR 9 & 42 (customizable)

  @Prop({ default: 2 })
  defaultCarryForwardExpiryYears: number;

  @Prop({ default: false })
  allowNegativeBalance: boolean; // BR 48 – only if policy allows

  @Prop({ default: 7 })
  postLeaveRequestMaxDays: number; // REQ-031

  @Prop({ default: 48 })
  escalationHoursForPendingRequests: number; // BR 28

  @Prop({ default: true })
  enableBlockedPeriods: boolean;
}

export const LeavePolicyConfigSchema =
  SchemaFactory.createForClass(LeavePolicyConfig);
