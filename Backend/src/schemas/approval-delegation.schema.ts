import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ApprovalDelegation extends Document {
   @Prop({ type: Types.ObjectId, ref: 'Employee' })
managerId: Types.ObjectId;


  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
delegateId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  active: boolean; // is delegation currently active
}

export const ApprovalDelegationSchema =
  SchemaFactory.createForClass(ApprovalDelegation);
