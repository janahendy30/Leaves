import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  BulkOperationType,
  BulkOperationStatus,
} from './leaves.enums';
import { LeaveRequest } from './leave-request.schema';

@Schema({ timestamps: true })
export class LeaveBulkOperation extends Document {
 // @Prop({ required: true })
  //initiatedByUserId: string; // HR admin

  @Prop({ type: String, enum: BulkOperationType, required: true })
  type: BulkOperationType; // APPROVE / REJECT / FINALIZE

  @Prop({ type: [Types.ObjectId], ref: LeaveRequest.name, default: [] })
  requestIds: Types.ObjectId[];

  @Prop({
    type: String,
    enum: BulkOperationStatus,
    default: BulkOperationStatus.PENDING,
  })
  status: BulkOperationStatus; // PENDING / IN_PROGRESS / COMPLETED / FAILED

  @Prop({ default: 0 })
  totalCount: number;

  @Prop({ default: 0 })
  successCount: number;

  @Prop({ default: 0 })
  failureCount: number;

  @Prop({ type: [String], default: [] })
  failureReasons: string[];

  @Prop()
  filterDescription?: string; // e.g. "All pending sick leaves on 2025-11-20"
}

export const LeaveBulkOperationSchema =
  SchemaFactory.createForClass(LeaveBulkOperation);

LeaveBulkOperationSchema.index({ status: 1, createdAt: -1 });
