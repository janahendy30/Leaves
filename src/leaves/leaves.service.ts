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
import { LeaveStatus } from './enums/leave-status.enum';
//import { NotificationService } from '../notification/notification.service'; // Assuming a notification service

  


import { AccrualMethod } from './enums/accrual-method.enum';
import { ApproveLeaveRequestDto } from './dto/ApproveLeaveRequest.dto';
import { RejectLeaveRequestDto } from './dto/RejectLeaveRequest.dto';



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
    @InjectModel(LeaveCategory.name) private leaveCategoryModel: mongoose.Model<LeaveCategoryDocument>,
    //private notificationService: NotificationService, // Assuming a Notification service is available
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

    // Create a new leave request
    async createLeaveRequest(createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequestDocument> {
        const { dates, employeeId, justification, attachmentId, approvalFlow } = createLeaveRequestDto;
        const { from, to } = dates;

        // Convert dates to ISO string format
        const startDate = new Date(from).toISOString();
        const endDate = new Date(to).toISOString();

        // Fetch employee profile
        const employeeProfile = await this.employeeProfileModel.findById(employeeId).exec();
        if (!employeeProfile) {
            throw new Error('Employee not found');
        }

        // Check if dates fall on blocked periods
        const isFromBlocked = await this.isBlockedDate(startDate);
        const isToBlocked = await this.isBlockedDate(endDate);
        if (isFromBlocked || isToBlocked) {
            throw new Error('The requested leave dates fall on blocked periods.');
        }

        // Handle document attachment if needed
        if (attachmentId) {
            const attachment = await this.attachmentModel.findById(attachmentId).exec();
            if (!attachment) {
                throw new Error('Attachment not found');
            }
        }

        // Create leave request object
        const leaveRequest = new this.leaveRequestModel({
            ...createLeaveRequestDto,
            status: LeaveStatus.PENDING, // Default status is PENDING
            approvalFlow: approvalFlow || [], // Handle approval flow if provided
        });

        // Save and notify
        const savedLeaveRequest = await leaveRequest.save();

        // Notify employee and manager
        //await this.notificationService.sendNotification(employeeId, 'Leave request submitted', 'Your leave request has been successfully submitted for approval.');

        // Return saved leave request
        return savedLeaveRequest;
    }



async getLeaveRequestById(id: string): Promise<LeaveRequestDocument> {
 const LeaveRequest= await this.leaveRequestModel.findById(id).exec(); 
 if (!LeaveRequest) {
    throw new Error(`LeavePolicy with ID ${id} not found`);  
  }
 return LeaveRequest;
}


    // Modify an existing leave request (update)
    async updateLeaveRequest(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto): Promise<LeaveRequestDocument> {
        const updatedLeaveRequest = await this.leaveRequestModel
            .findByIdAndUpdate(id, updateLeaveRequestDto, { new: true })
            .exec();

        if (!updatedLeaveRequest) {
            throw new Error(`LeaveRequest with ID ${id} not found`);
        }

        // Notify employee about the update
        //await this.notificationService.sendNotification(updatedLeaveRequest.employeeId, 'Leave request updated', `Your leave request with ID ${id} has been updated.`);

        return updatedLeaveRequest;
    }


// async deleteLeaveRequest(id: string): Promise<LeaveRequestDocument> {
//    const leaveRequest = await this.leavePolicyModel.findById(id).exec();

//   if (!leaveRequest) {
//     throw new Error(`LeavePolicy with ID ${id} not found`);
//   }

//  return await this.leaveRequestModel.findByIdAndDelete(id).exec() as LeaveRequestDocument;
// }

    // Cancel a leave request before final approval
    async cancelLeaveRequest(id: string): Promise<LeaveRequestDocument> {
        const leaveRequest = await this.leaveRequestModel.findById(id).exec();

        if (!leaveRequest) {
            throw new Error(`LeaveRequest with ID ${id} not found`);
        }

        if (leaveRequest.status !== LeaveStatus.PENDING) {
            throw new Error('Only pending requests can be canceled');
        }

        // Update status to canceled
        leaveRequest.status = LeaveStatus.CANCELLED;
        const canceledLeaveRequest = await leaveRequest.save();

        // Notify employee and manager
        //await this.notificationService.sendNotification(canceledLeaveRequest.employeeId, 'Leave request canceled', `Your leave request with ID ${id} has been canceled.`);

        return canceledLeaveRequest;
    }

// Service method to approve leave
async approveLeaveRequest(approveLeaveRequestDto: ApproveLeaveRequestDto, user: any): Promise<LeaveRequestDocument> {
    const { leaveRequestId, status } = approveLeaveRequestDto;

    // Fetch the leave request to approve
    const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId).exec();
    if (!leaveRequest) {
        throw new Error(`LeaveRequest with ID ${leaveRequestId} not found`);
    }

    // Check if the status is pending
    if (leaveRequest.status !== LeaveStatus.PENDING) {
        throw new Error('Leave request can only be approved if it is in pending status.');
    }

    // Record the approval decision in approvalFlow
    leaveRequest.approvalFlow.push({
        role: user.role,  // The role of the approver (e.g., "Manager")
        status,           // APPROVED or REJECTED
        decidedBy: user._id, // The ID of the approver (e.g., the manager)
        decidedAt: new Date(),
    });

    // Update the leave request status if the leave is approved
    if (status === LeaveStatus.APPROVED) {
        leaveRequest.status = LeaveStatus.APPROVED;
    }

    // Save the updated leave request
    const updatedLeaveRequest = await leaveRequest.save();

    // Send notifications to relevant users (employee, manager, HR)
   // await this.notificationService.sendNotification(leaveRequest.employeeId, 'Leave request approved', `Your leave request with ID ${leaveRequestId} has been approved.`);
  // await this.notificationService.sendNotification('HR_USER_ID', 'Leave request awaiting finalization', `Leave request with ID ${leaveRequestId} is awaiting HR finalization.`);

    return updatedLeaveRequest;
}

// Service method to reject leave (without justification)
async rejectLeaveRequest(rejectLeaveRequestDto: RejectLeaveRequestDto, user: any): Promise<LeaveRequestDocument> {
    const { leaveRequestId, status } = rejectLeaveRequestDto;

    const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId).exec();
    if (!leaveRequest) {
        throw new Error(`LeaveRequest with ID ${leaveRequestId} not found`);
    }

    // Check if the status is pending
    if (leaveRequest.status !== LeaveStatus.PENDING) {
        throw new Error('Leave request can only be rejected if it is in pending status.');
    }

    // Record the rejection in the approvalFlow
    leaveRequest.approvalFlow.push({
        role: user.role,  // The role of the approver (e.g., "Manager")
        status,           // REJECTED
        decidedBy: user._id, // The ID of the approver (e.g., the manager)
        decidedAt: new Date(),
    });

    // Update the leave request status if the leave is rejected
    leaveRequest.status = LeaveStatus.REJECTED;

    // Save the updated leave request
    const rejectedLeaveRequest = await leaveRequest.save();

    // Send notification to employee about rejection
    //await this.notificationService.sendNotification(leaveRequest.employeeId, 'Leave request rejected', `Your leave request with ID ${leaveRequestId} has been rejected.`);

    return rejectedLeaveRequest;
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
