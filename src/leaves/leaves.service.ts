import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { populate } from 'dotenv';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';



import { LeavePolicy,LeavePolicyDocument } from './models/leave-policy.schema';  
import { LeaveRequest,LeaveRequestDocument } from './models/leave-request.schema';  
import { LeaveEntitlement,LeaveEntitlementDocument } from './models/leave-entitlement.schema';  
import { LeaveAdjustment,LeaveAdjustmentDocument } from './models/leave-adjustment.schema';  
import { LeaveType,LeaveTypeDocument } from './models/leave-type.schema'; 
import { Attachment,AttachmentDocument } from './models/attachment.schema'; 
import { Calendar,CalendarDocument } from './models/calendar.schema'; 
import { LeaveCategory,LeaveCategoryDocument } from './models/leave-category.schema';  

import { EmployeeProfile,EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';

import { CreateLeavePolicyDto } from './dto/CreateLeavePolicy.dto';  
import { UpdateLeavePolicyDto } from './dto/UpdateLeavePolicy.dto';  
import { CreateLeaveRequestDto } from './dto/CreateLeaveRequest.dto';  
import { UpdateLeaveRequestDto } from './dto/UpdateLeaveRequest.dto'; 
import { CreateLeaveEntitlementDto } from './dto/CreateLeaveEntitlement.dto';  
import { UpdateLeaveEntitlementDto } from './dto/UpdateLeaveEntitlement.dto'; 
import { CreateLeaveTypeDto } from './dto/CreateLeaveType.dto';
import { UpdateLeaveTypeDto } from './dto/UpdateLeaveType.dto'; 
  


import { AccrualMethod } from './enums/accrual-method.enum';



@Injectable()
export class LeavesService {
    constructor(
    @InjectModel(LeavePolicy.name) private leavePolicyModel: mongoose.Model<LeavePolicyDocument>,
    @InjectModel(LeaveRequest.name) private leaveRequestModel: mongoose.Model<LeaveRequestDocument>,
    @InjectModel(LeaveEntitlement.name) private leaveEntitlementModel: mongoose.Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveAdjustment.name) private leaveAdjustmentModel: mongoose.Model<LeaveAdjustmentDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: mongoose.Model<LeaveTypeDocument>,
    @InjectModel(Attachment.name) private attachmentModel: mongoose.Model<AttachmentDocument>,
    @InjectModel(Calendar.name) private calendarModel: mongoose.Model<CalendarDocument>,
    @InjectModel(EmployeeProfile.name) private employeeProfileModel: mongoose.Model<EmployeeProfileDocument>,
    @InjectModel(LeaveCategory.name) private leaveCategoryModel: mongoose.Model<LeaveCategoryDocument>
  ) {}

                              // LeavePolicy
async createLeavePolicy(createLeavePolicyDto: CreateLeavePolicyDto): Promise<LeavePolicyDocument> {
  const newLeavePolicy = new this.leavePolicyModel(createLeavePolicyDto);
  return await newLeavePolicy.save(); 
}


async getLeavePolicies(): Promise<LeavePolicyDocument[]> {
  return await this.leavePolicyModel.find().exec(); 
}



async getLeavePolicyById(id: string): Promise<LeavePolicyDocument> {
  const leavePolicy = await this.leavePolicyModel.findById(id).exec();
  if (!leavePolicy) {
    throw new Error(`LeavePolicy with ID ${id} not found`);  
  }
  return leavePolicy;
}



async updateLeavePolicy(
  id: string,
  updateLeavePolicyDto: UpdateLeavePolicyDto
): Promise<LeavePolicyDocument> {
  const updatedLeavePolicy = await this.leavePolicyModel
    .findByIdAndUpdate(id, updateLeavePolicyDto, { new: true })
    .exec();

  if (!updatedLeavePolicy) {
    throw new Error(`LeavePolicy with ID ${id} not found`);
  }

  return updatedLeavePolicy;  
}






// Delete a LeavePolicy by ID
//async deleteLeavePolicy(id: string): Promise<LeavePolicyDocument> {
  // First, check if the document exists
  //const leavePolicy = await this.leavePolicyModel.findById(id).exec();

  //if (!leavePolicy) {
    //throw new Error(`LeavePolicy with ID ${id} not found`);
  //}

  // Now delete the document and return the result
  //return await this.leavePolicyModel.findByIdAndDelete(id).exec();
//}

async deleteLeavePolicy(id: string): Promise<LeavePolicyDocument> {

  const leavePolicy = await this.leavePolicyModel.findById(id).exec();

  
  if (!leavePolicy) {
    throw new Error(`LeavePolicy with ID ${id} not found`);
  }

 
  return await this.leavePolicyModel.findByIdAndDelete(id).exec() as LeavePolicyDocument;

}
                                  // LeaveRequest



async isBlockedDate(date: string): Promise<boolean> {
  const calendar = await this.calendarModel.findOne({ year: new Date().getFullYear() }).exec();
  if (!calendar) {
    throw new Error('Calendar for the year not found');
  }
  return calendar.blockedPeriods.some(
    (period) => new Date(period.from) <= new Date(date) && new Date(period.to) >= new Date(date)
  );
}

async createLeaveRequest(createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequestDocument> {
  const { dates, employeeId } = createLeaveRequestDto;
  const { from, to } = dates; 
  //3shan maynf3sh date nakhdo ka string fa amalt parsing
  const startDate = new Date(from).toISOString();
  const endDate = new Date(to).toISOString();
  const employeeProfile = await this.employeeProfileModel.findById(employeeId).exec();
  if (!employeeProfile) {
    throw new Error('Employee not found');
  }
  const isFromBlocked = await this.isBlockedDate(startDate);
  const isToBlocked = await this.isBlockedDate(endDate); 

  if (isFromBlocked || isToBlocked) {
    throw new Error(`The requested leave dates fall on blocked periods.`);
  }
  const newLeaveRequest = new this.leaveRequestModel(createLeaveRequestDto);
  return await newLeaveRequest.save();
}




async getLeaveRequestById(id: string): Promise<LeaveRequestDocument> {
 const LeaveRequest= await this.leaveRequestModel.findById(id).exec(); 
 if (!LeaveRequest) {
    throw new Error(`LeavePolicy with ID ${id} not found`);  
  }
 return LeaveRequest;
}


async updateLeaveRequest(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto): Promise<LeaveRequestDocument> {
  const updateLeaveRequest= await this.leaveRequestModel.findByIdAndUpdate(id, updateLeaveRequestDto, { new: true }).exec();
  if (!updateLeaveRequest) {
    throw new Error(`LeavePolicy with ID ${id} not found`);
  }
  return updateLeaveRequest;
}
  


async deleteLeaveRequest(id: string): Promise<LeaveRequestDocument> {
   const leaveRequest = await this.leavePolicyModel.findById(id).exec();

  if (!leaveRequest) {
    throw new Error(`LeavePolicy with ID ${id} not found`);
  }

 return await this.leaveRequestModel.findByIdAndDelete(id).exec() as LeaveRequestDocument;
}
                   
                          //LeaveAdjustment


async createLeaveAdjustment(createLeaveAdjustmentDto: any): Promise<LeaveAdjustmentDocument> {
  const newLeaveAdjustment = new this.leaveAdjustmentModel(createLeaveAdjustmentDto);
  return await newLeaveAdjustment.save(); 
}


async getLeaveAdjustments(employeeId: string): Promise<LeaveAdjustmentDocument[]> {
  return await this.leaveAdjustmentModel.find({ employeeId }).exec(); 
}

async getLeaveAdjustmentById(id: string): Promise<LeaveAdjustmentDocument> {
  const leaveAdjustment= await this.leaveAdjustmentModel.findById(id).exec();
  if(!leaveAdjustment){
    throw new Error(`leaveAdjustment with ID ${id} not found`);
  }
  return leaveAdjustment;
}


async deleteLeaveAdjustment(id: string): Promise<LeaveAdjustmentDocument> {
  const leaveAdjustment= await this.leaveAdjustmentModel.findByIdAndDelete(id).exec();
  if(!leaveAdjustment){
    throw new Error(`leaveAdjustment with ID ${id} not found`);
  }
   return leaveAdjustment as LeaveAdjustmentDocument;
}
                     //LeaveEntitlement


async createLeaveEntitlement(createLeaveEntitlementDto: CreateLeaveEntitlementDto): Promise<LeaveEntitlementDocument> {
  const newLeaveEntitlement = new this.leaveEntitlementModel(createLeaveEntitlementDto);
 return await newLeaveEntitlement.save();
}


async getLeaveEntitlement(employeeId: string, leaveTypeId: string): Promise<LeaveEntitlementDocument> {

  const leaveEntitlement = await this.leaveEntitlementModel
    .findOne({ employeeId, leaveTypeId })
    .exec();

  if (!leaveEntitlement) {
    throw new Error(`Entitlement for employee ${employeeId} with leave type ${leaveTypeId} not found`);
  }

  return leaveEntitlement; 
}

async updateLeaveEntitlement(
  id: string,
  updateLeaveEntitlementDto: UpdateLeaveEntitlementDto
): Promise<LeaveEntitlementDocument> {
  let leaveEntitlement = await this.leaveEntitlementModel.findById(id).exec();

  if (!leaveEntitlement) {
    throw new Error(`Leave entitlement with ID ${id} not found`);
  }

  // Here, you can modify `leaveEntitlement` based on the business logic (e.g., accruals)
  // If needed, modify `leaveEntitlement` before saving the update
  leaveEntitlement = await this.leaveEntitlementModel.findByIdAndUpdate(id.toString(), updateLeaveEntitlementDto, { new: true }).exec();
  return leaveEntitlement as LeaveEntitlementDocument;
}


async calculateAccrual(employeeId: string, leaveTypeId: string, accrualMethod: AccrualMethod): Promise<void> {
  const leaveEntitlement = await this.getLeaveEntitlement(employeeId, leaveTypeId);

  if (!leaveEntitlement) {
    throw new Error(`Leave entitlement for employee ${employeeId} with leave type ${leaveTypeId} not found`);
  }

  let accrualAmount = 0;

  switch (accrualMethod) {
    case AccrualMethod.MONTHLY:
      accrualAmount = leaveEntitlement.yearlyEntitlement / 12;  // Accrue monthly
      break;
    case AccrualMethod.YEARLY:
      accrualAmount = leaveEntitlement.yearlyEntitlement;  // Accrue annually
      break;
    case AccrualMethod.PER_TERM:
      accrualAmount = leaveEntitlement.yearlyEntitlement / 4;  // Accrue per term (e.g., quarterly)
      break;
    default:
      throw new Error('Invalid accrual method');
  }
  leaveEntitlement.accruedActual += accrualAmount;  // Adding the accrued amount to the actual accrual

  // Ensure the remaining leave is updated based on the balance
  leaveEntitlement.remaining = leaveEntitlement.yearlyEntitlement - leaveEntitlement.taken - leaveEntitlement.accruedActual;

  // Update the leave entitlement in the database
  await this.updateLeaveEntitlement(leaveEntitlement._id.toString(), {
    accruedActual: leaveEntitlement.accruedActual,
    remaining: leaveEntitlement.remaining,
    lastAccrualDate: new Date(),
  });

  console.log(`Leave entitlement for employee ${employeeId} updated. New balance: ${leaveEntitlement.remaining}`);
}
 
async assignPersonalizedEntitlement(
  employeeId: string,
  leaveTypeId: string,
  personalizedEntitlement: number
): Promise<LeaveEntitlementDocument> {
  const entitlement = await this.getLeaveEntitlement(employeeId, leaveTypeId);

  if (!entitlement) {
    throw new Error(`Leave entitlement for employee ${employeeId} with leave type ${leaveTypeId} not found`);
  }

  // Add the personalized entitlement to the `accruedActual` or `carryForward`
  // Here, let's assume personalized entitlements are added to `accruedActual`
  //2b2y shoofy lw di hatt8ayar
  entitlement.accruedActual += personalizedEntitlement;

  entitlement.remaining = entitlement.yearlyEntitlement - entitlement.taken - entitlement.accruedActual;// di bardo hatt8ayar lw 8ayarty el fo2
  
  return await this.updateLeaveEntitlement(entitlement._id.toString(), {  
    accruedActual: entitlement.accruedActual,
    remaining: entitlement.remaining,
    
  });
}


  async resetLeaveBalancesForNewYear(): Promise<void> {
  const currentYear = new Date().getFullYear(); 
  const leaveEntitlements: LeaveEntitlementDocument[] = await this.leaveEntitlementModel.find({}).exec();
leaveEntitlements.forEach(async (entitlement: LeaveEntitlementDocument) => {
    const lastAccrualDate = entitlement.lastAccrualDate ? new Date(entitlement.lastAccrualDate) : new Date();  
     const lastAccrualYear = lastAccrualDate.getFullYear();  
    if (lastAccrualYear !== currentYear) {
      entitlement.remaining = entitlement.yearlyEntitlement - entitlement.taken; //remaining leave balance  
      entitlement.lastAccrualDate = new Date();  
      if (entitlement.carryForward > 0) {
        entitlement.remaining += entitlement.carryForward;
      }
      await this.updateLeaveEntitlement(entitlement._id.toString(), {
        remaining: entitlement.remaining,
        lastAccrualDate: entitlement.lastAccrualDate
      });
    }
  });
}







                        //leave type 

        async createLeaveType(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveTypeDocument> {
  const { code, name } = createLeaveTypeDto;
  // Check if the leave type is a special leave type based on the `code` or `name`
  if (code === 'BEREAVEMENT_LEAVE' || code === 'JURY_DUTY') {
    // Add specific logic for special leave types hanshoof baa b3dein ayzeen n3mel eh
    console.log(`Creating special leave type: ${name}`);
  }
  const newLeaveType = new this.leaveTypeModel(createLeaveTypeDto);
  return await newLeaveType.save();
}

async updateLeaveType(
  id: string,
  updateLeaveTypeDto: UpdateLeaveTypeDto
): Promise<LeaveTypeDocument> {
  const updatedLeaveType = await this.leaveTypeModel.findByIdAndUpdate(id, updateLeaveTypeDto, { new: true }).exec();
  if (!updatedLeaveType) {
    throw new Error(`LeaveType with ID ${id} not found`);
  }

  return updatedLeaveType;
}










}
