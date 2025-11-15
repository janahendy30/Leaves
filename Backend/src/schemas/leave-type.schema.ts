
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LeaveCategory } from './leaves.enums';

@Schema({ timestamps: true })
export class LeaveType extends Document {
  @Prop({ required: true, unique: true })
  code: string; // Unique leave code (e.g. "ANNUAL", "SICK_SHORT")

  @Prop({ required: true })
  name: string; // Display name

  @Prop({ type: String, enum: LeaveCategory, required: true })
  category: LeaveCategory; // Annual, Other, Unpaid, etc.

  @Prop({ default: true })
  affectsAnnualBalance: boolean; // true => deducted from ANNUAL balance

  @Prop({ default: false })
  paid: boolean; // true for paid leaves, false for unpaid

  @Prop()
  maxContinuousDays?: number; // optional cap per request

  @Prop({ default: false })
  requiresDocument: boolean; // e.g. medical certificate

  @Prop()
  requiresDocumentAfterDays?: number; // e.g. sick > 1 day

  @Prop()
  cumulativeLimitDaysPerCycle?: number; // e.g. total sick days over 3 years (BR 41)

  @Prop()
  maxTimesPerEmployee?: number; // e.g. number of maternity leaves (BR 40)

  @Prop()
  payCode?: string; // link to Payroll pay code (BR 6)

  @Prop({ default: true })
  isActive: boolean;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);
