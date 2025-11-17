import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IrregularPatternType,
  PatternFlagStatus,
} from './leaves.enums';
import { LeaveRequest } from './leave-request.schema';

@Schema({ timestamps: true })
export class LeavePatternFlag extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
employeeId: Types.ObjectId;

 @Prop({ type: Types.ObjectId, ref: 'Employee' })
 managerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  positionId?: Types.ObjectId; 

  @Prop({ type: [Types.ObjectId], ref: LeaveRequest.name, default: [] })
  relatedRequests: Types.ObjectId[];

  @Prop({ type: String, enum: IrregularPatternType, required: true })
  patternType: IrregularPatternType;

  @Prop({ required: true })
  reason: string; // free-text description

  @Prop({
    type: String,
    enum: PatternFlagStatus,
    default: PatternFlagStatus.OPEN,
  })
  status: PatternFlagStatus; // OPEN / REVIEWED / RESOLVED / DISMISSED

  @Prop()
  resolutionNotes?: string;

  @Prop()
  resolvedByUserId?: string;

  @Prop()
  resolvedAt?: Date;
}

export const LeavePatternFlagSchema =
  SchemaFactory.createForClass(LeavePatternFlag);

LeavePatternFlagSchema.index({ employeeId: 1, status: 1 });
