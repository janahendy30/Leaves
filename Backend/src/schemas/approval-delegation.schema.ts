
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ApprovalDelegation extends Document {
  @Prop({ required: true })
  managerId: string; // original approver

  @Prop({ required: true })
  delegateId: string; // delegated approver

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  active: boolean;
}

export const ApprovalDelegationSchema =
  SchemaFactory.createForClass(ApprovalDelegation);
