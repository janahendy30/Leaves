import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeaveRequest } from './leave-request.schema';

/**
 * REQ-017: Modify Pending Request - Audit Trail
 * Tracks all modifications made to a leave request
 */
@Schema({ timestamps: true })
export class LeaveRequestHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: LeaveRequest.name, required: true })
  requestId: Types.ObjectId;

  @Prop({ required: true })
  version: number; // Incremental version number

  @Prop({ required: true })
  modifiedBy: string; // employeeId who made the change

  @Prop({ type: [Object], default: [] })
  changes: Array<{
    field: string; // Field name that changed
    oldValue: any; // Previous value
    newValue: any; // New value
  }>;

  @Prop()
  modificationReason?: string; // Optional reason for modification

  @Prop()
  previousStatus?: string; // Status before modification

  @Prop()
  newStatus?: string; // Status after modification (if changed)
}

export const LeaveRequestHistorySchema =
  SchemaFactory.createForClass(LeaveRequestHistory);

// Index for efficient querying of request history
LeaveRequestHistorySchema.index({ requestId: 1, version: -1 });

