
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class HolidayCalendar extends Document {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  name: string; // e.g. "Eid El-Fitr"

  @Prop({ default: false })
  isCompanySpecific: boolean;

  @Prop({ default: true })
  isFullDay: boolean;

  @Prop()
  countryCode?: string;

  @Prop()
  notes?: string;
}

export const HolidayCalendarSchema =
  SchemaFactory.createForClass(HolidayCalendar);

@Schema({ timestamps: true })
export class LeaveBlockedPeriod extends Document {
  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  reason?: string; // e.g. "Year-end closing"

  @Prop({ type: [String], default: [] })
  leaveTypeCodes: string[]; // which leave types are blocked, empty = all
}

export const LeaveBlockedPeriodSchema =
  SchemaFactory.createForClass(LeaveBlockedPeriod);
