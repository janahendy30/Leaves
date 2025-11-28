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
import { CreateLeaveCategoryDto } from './dto/CreateLeaveCategory.dto';
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
    //@InjectModel(EmployeeProfile.name) private employeeProfileModel: mongoose.Model<EmployeeProfileDocument>,
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

// Leave Category
async createLeaveCategory(createLeaveCategoryDto: CreateLeaveCategoryDto): Promise<LeaveCategoryDocument> {
  const newCategory = new this.leaveCategoryModel(createLeaveCategoryDto);
  return await newCategory.save();
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

    // Phase 2: REQ-015 - Create leave request with validation and routing
    async createLeaveRequest(createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequestDocument> {
        const { dates, employeeId, leaveTypeId, justification, attachmentId, durationDays } = createLeaveRequestDto;
        const { from, to } = dates;

        const startDate = new Date(from);
        const endDate = new Date(to);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // REQ-031: Check post-leave grace period
        const maxGracePeriodDays = 7; // Should come from configuration
        const daysSinceEndDate = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceEndDate > maxGracePeriodDays && daysSinceEndDate > 0) {
            throw new Error(`Post-leave requests must be submitted within ${maxGracePeriodDays} days after the leave end date.`);
        }

        //Fetch employee profile
        // const employeeProfile = await this.EmployeeProfileModel.findById(employeeId).exec();
        // if (!employeeProfile) {
        //     throw new Error('Employee not found');
        // }

        // Fetch leave type
        const leaveType = await this.leaveTypeModel.findById(leaveTypeId).exec();
        if (!leaveType) {
            throw new Error('Leave type not found');
        }

        // REQ-016: Validate medical certificate requirement for sick leave exceeding one day
        if (leaveType.code === 'SICK_LEAVE' && durationDays > 1) {
            if (!attachmentId) {
                throw new Error('Medical certificate is required for sick leave exceeding one day.');
            }
        }

        // REQ-016: Validate attachment requirement
        if (leaveType.requiresAttachment && !attachmentId) {
            throw new Error(`Attachment is required for ${leaveType.name} leave requests.`);
        }

        if (attachmentId) {
            const attachment = await this.attachmentModel.findById(attachmentId).exec();
            if (!attachment) {
                throw new Error('Attachment not found');
            }
        }

        // Check if dates fall on blocked periods
        const isFromBlocked = await this.isBlockedDate(startDate.toISOString());
        const isToBlocked = await this.isBlockedDate(endDate.toISOString());
        if (isFromBlocked || isToBlocked) {
            throw new Error('The requested leave dates fall on blocked periods.');
        }

        // Validate balance and overlaps
        const validationResult = await this.validateLeaveRequest(employeeId, leaveTypeId, startDate, endDate, durationDays);
        if (!validationResult.isValid) {
            throw new Error(validationResult.errorMessage);
        }

        // // REQ-020: Route to Line Manager/Department Head
        // const lineManagerId = await this.getLineManagerId(employeeId);
        // if (!lineManagerId) {
        //     throw new Error('Line manager not found. Cannot route leave request for approval.');
        // }

        // Create leave request with initial approval flow
        const leaveRequest = new this.leaveRequestModel({
            ...createLeaveRequestDto,
            status: LeaveStatus.PENDING,
            approvalFlow: [{
                role: 'Manager',
                status: 'PENDING',
                //decidedBy: lineManagerId,
                decidedAt: undefined,
            }],
        });

        // Update pending balance
        const entitlement = await this.getLeaveEntitlement(employeeId, leaveTypeId);
        entitlement.pending += durationDays;
        await this.updateLeaveEntitlement(entitlement._id.toString(), {
            pending: entitlement.pending,
        });

        const savedLeaveRequest = await leaveRequest.save();
        return savedLeaveRequest;
    }

    // Phase 2: Helper - Validate leave request (balance, overlaps)
    private async validateLeaveRequest(
        employeeId: string,
        leaveTypeId: string,
        startDate: Date,
        endDate: Date,
        durationDays: number
    ): Promise<{ isValid: boolean; errorMessage?: string }> {
        const entitlement = await this.getLeaveEntitlement(employeeId, leaveTypeId);
        const availableBalance = entitlement.remaining - entitlement.pending;
        
        if (availableBalance < durationDays) {
            return {
                isValid: false,
                errorMessage: `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${durationDays} days.`,
            };
        }

        // Check for overlapping leave requests
        const overlappingRequests = await this.leaveRequestModel.find({
            employeeId: new Types.ObjectId(employeeId),
            status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
            $or: [
                {
                    'dates.from': { $lte: endDate },
                    'dates.to': { $gte: startDate },
                },
            ],
        }).exec();

        if (overlappingRequests.length > 0) {
            return {
                isValid: false,
                errorMessage: 'Leave request overlaps with existing approved or pending leave requests.',
            };
        }

        return { isValid: true };
    }

    // // Phase 2: REQ-020 - Get Line Manager/Department Head ID
    // private async getLineManagerId(employeeId: string): Promise<Types.ObjectId | null> {
    //     const employeeProfile = await this.employeeProfileModel.findById(employeeId).exec();
    //     if (!employeeProfile || !employeeProfile.primaryPositionId) {
    //         return null;
    //     }

    //     const PositionModel = this.employeeProfileModel.db.model('Position');
    //     const position = await PositionModel.findById(employeeProfile.primaryPositionId).exec();

    //     if (!position || !position.reportsToPositionId) {
    //         if (employeeProfile.primaryDepartmentId) {
    //             const DepartmentModel = this.employeeProfileModel.db.model('Department');
    //             const department = await DepartmentModel.findById(employeeProfile.primaryDepartmentId).exec();
    //             if (department && department.headPositionId) {
    //                 const PositionAssignmentModel = this.employeeProfileModel.db.model('PositionAssignment');
    //                 const assignment = await PositionAssignmentModel.findOne({
    //                     positionId: department.headPositionId,
    //                     endDate: null,
    //                 }).exec();
    //                 if (assignment) {
    //                     return assignment.employeeProfileId;
    //                 }
    //             }
    //         }
    //         return null;
    //     }

    //     const PositionAssignmentModel = this.employeeProfileModel.db.model('PositionAssignment');
    //     const assignment = await PositionAssignmentModel.findOne({
    //         positionId: position.reportsToPositionId,
    //         endDate: null,
    //     }).exec();

    //     if (assignment) {
    //         return assignment.employeeProfileId;
    //     }

    //     return null;
    // }



async getLeaveRequestById(id: string): Promise<LeaveRequestDocument> {
 const LeaveRequest= await this.leaveRequestModel.findById(id).exec(); 
 if (!LeaveRequest) {
    throw new Error(`LeavePolicy with ID ${id} not found`);  
  }
 return LeaveRequest;
}


    // Phase 2: REQ-017 - Modify an existing leave request (only for pending requests)
    
    async updateLeaveRequest(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto): Promise<LeaveRequestDocument> {
      const leaveRequest = await this.leaveRequestModel.findById(id).exec();

      if (!leaveRequest) {
        throw new Error(`LeaveRequest with ID ${id} not found`);
      }

      if (leaveRequest.status !== LeaveStatus.PENDING) {
        throw new Error('Only pending requests can be modified');
      }

      // If duration changed, update pending balance
      if (updateLeaveRequestDto.durationDays && updateLeaveRequestDto.durationDays !== leaveRequest.durationDays) {
        const entitlement = await this.getLeaveEntitlement(
          leaveRequest.employeeId.toString(),
          leaveRequest.leaveTypeId.toString()
        );
        const oldPending = entitlement.pending;
        entitlement.pending = oldPending - leaveRequest.durationDays + updateLeaveRequestDto.durationDays;
        await this.updateLeaveEntitlement(entitlement._id.toString(), {
          pending: entitlement.pending,
        });
      }

      const updatedLeaveRequest = await this.leaveRequestModel
        .findByIdAndUpdate(id, updateLeaveRequestDto, { new: true })
        .exec();

      if (!updatedLeaveRequest) {
        throw new Error(`LeaveRequest with ID ${id} not found`);
      }

    // REQ-030: Notify employee about the update
      await this.notifyStakeholders(updatedLeaveRequest, 'modified');

      return updatedLeaveRequest;
    }



async deleteLeaveRequest(id: string): Promise<LeaveRequestDocument> {
   const leaveRequest = await this.leavePolicyModel.findById(id).exec();

  if (!leaveRequest) {
    throw new Error(`LeavePolicy with ID ${id} not found`);
  }

 return await this.leaveRequestModel.findByIdAndDelete(id).exec() as LeaveRequestDocument;
}

    // Phase 2: REQ-018 - Cancel a leave request before final approval
    async cancelLeaveRequest(id: string): Promise<LeaveRequestDocument> {
      const leaveRequest = await this.leaveRequestModel.findById(id).exec();

      if (!leaveRequest) {
        throw new Error(`LeaveRequest with ID ${id} not found`);
      }

      if (leaveRequest.status !== LeaveStatus.PENDING) {
        throw new Error('Only pending requests can be canceled');
      }

      // Release pending balance
      const entitlement = await this.getLeaveEntitlement(
        leaveRequest.employeeId.toString(),
        leaveRequest.leaveTypeId.toString()
      );
      entitlement.pending = Math.max(0, entitlement.pending - leaveRequest.durationDays);
      await this.updateLeaveEntitlement(entitlement._id.toString(), {
        pending: entitlement.pending,
      });

      // Update status to canceled
      leaveRequest.status = LeaveStatus.CANCELLED;
      const canceledLeaveRequest = await leaveRequest.save();

      // REQ-030: Notify employee and manager
      await this.notifyStakeholders(canceledLeaveRequest, 'canceled');

      return canceledLeaveRequest;
    }

    // Phase 2: REQ-021 - Manager approve leave request
    async approveLeaveRequest(approveLeaveRequestDto: ApproveLeaveRequestDto, user: any): Promise<LeaveRequestDocument> {
        const { leaveRequestId, status } = approveLeaveRequestDto;

        const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId).exec();
        if (!leaveRequest) {
            throw new Error(`LeaveRequest with ID ${leaveRequestId} not found`);
        }

        if (leaveRequest.status !== LeaveStatus.PENDING) {
            throw new Error('Leave request can only be approved if it is in pending status.');
        }

        const isManager = user.role === 'Manager' || user.role === 'Department Head';
        if (!isManager) {
            throw new Error('Only managers can approve leave requests at this stage.');
        }

        // Record manager approval
        leaveRequest.approvalFlow.push({
            role: user.role,
            status: LeaveStatus.APPROVED,
            decidedBy: new Types.ObjectId(user._id || user.id),
            decidedAt: new Date(),
        });

        // Route to HR for finalization (REQ-025)
        leaveRequest.status = LeaveStatus.PENDING; // Keep pending until HR finalizes
        leaveRequest.approvalFlow.push({
            role: 'HR Manager',
            status: 'PENDING',
            decidedBy: undefined,
            decidedAt: undefined,
        });

        const savedRequest = await leaveRequest.save();

        // REQ-030: Notify stakeholders
        await this.notifyStakeholders(savedRequest, 'manager_approved');

        return savedRequest;
    }

// Phase 2: REQ-022 - Manager reject leave request
async rejectLeaveRequest(rejectLeaveRequestDto: RejectLeaveRequestDto, user: any): Promise<LeaveRequestDocument> {
  const { leaveRequestId, status } = rejectLeaveRequestDto;

  const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId).exec();
  if (!leaveRequest) {
    throw new Error(`LeaveRequest with ID ${leaveRequestId} not found`);
  }

  if (leaveRequest.status !== LeaveStatus.PENDING) {
    throw new Error('Leave request can only be rejected if it is in pending status.');
  }

  const isManager = user.role === 'Manager' || user.role === 'Department Head';
  if (!isManager) {
    throw new Error('Only managers can reject leave requests at this stage.');
  }

  leaveRequest.approvalFlow.push({
    role: user.role,
    status: LeaveStatus.REJECTED,
    decidedBy: new Types.ObjectId(user._id || user.id),
    decidedAt: new Date(),
  });

  leaveRequest.status = LeaveStatus.REJECTED;

  // Release pending balance
  const entitlement = await this.getLeaveEntitlement(
    leaveRequest.employeeId.toString(),
    leaveRequest.leaveTypeId.toString()
  );
  entitlement.pending = Math.max(0, entitlement.pending - leaveRequest.durationDays);
  await this.updateLeaveEntitlement(entitlement._id.toString(), {
    pending: entitlement.pending,
  });

  const savedRequest = await leaveRequest.save();

  // REQ-030: Notify stakeholders
  await this.notifyStakeholders(savedRequest, 'rejected');

  return savedRequest;
}

                   
                          //LeaveAdjustment


async createLeaveAdjustment(createLeaveAdjustmentDto: any): Promise<LeaveAdjustmentDocument> {
  const newLeaveAdjustment = new this.leaveAdjustmentModel(createLeaveAdjustmentDto);
  return await newLeaveAdjustment.save(); 
}


async getLeaveAdjustments(employeeId: string): Promise<LeaveAdjustmentDocument[]> {
  return await this.leaveAdjustmentModel.find({ employeeId }).exec(); 
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

    // // Phase 2: REQ-020 - Get pending requests for manager review
    // async getPendingRequestsForManager(managerId: string): Promise<LeaveRequestDocument[]> {
    //     const managerProfile = await this.employeeProfileModel.findById(managerId).exec();
    //     if (!managerProfile || !managerProfile.primaryPositionId) {
    //         return [];
    //     }

    //     const PositionModel = this.employeeProfileModel.db.model('Position');
    //     const managerPosition = await PositionModel.findById(managerProfile.primaryPositionId).exec();
    //     if (!managerPosition) {
    //         return [];
    //     }

    //     const reportingPositions = await PositionModel.find({
    //         reportsToPositionId: managerPosition._id,
    //     }).select('_id').exec();

    //     const positionIds = reportingPositions.map(p => p._id);
    //     const PositionAssignmentModel = this.employeeProfileModel.db.model('PositionAssignment');
    //     const assignments = await PositionAssignmentModel.find({
    //         positionId: { $in: positionIds },
    //         endDate: null,
    //     }).select('employeeProfileId').exec();

    //     const employeeIds = assignments.map(a => a.employeeProfileId);

    //     // REQ-023: Include delegated requests
    //     const delegatedManagerIds = await this.getDelegatedManagers(managerId);
    //     const allManagerIds = [new Types.ObjectId(managerId), ...delegatedManagerIds];

    //     return await this.leaveRequestModel.find({
    //         employeeId: { $in: employeeIds },
    //         status: LeaveStatus.PENDING,
    //         $or: [
    //             { 'approvalFlow.0.decidedBy': { $in: allManagerIds } },
    //             { 'approvalFlow.0.status': 'PENDING' }
    //         ],
    //     }).exec();
    // }

    // Phase 2: REQ-023 - Get delegated managers for a manager
    private async getDelegatedManagers(managerId: string): Promise<Types.ObjectId[]> {
        // This would typically query a delegation table
        // For now, return empty array - can be enhanced with actual delegation logic
        // Example: return await delegationModel.find({ delegatorId: managerId, isActive: true }).select('delegateId').exec();
        return [];
    }

    // Phase 2: REQ-023 - Delegate approval authority to another manager
    async delegateApprovalAuthority(managerId: string, delegateId: string, startDate: Date, endDate: Date): Promise<void> {
        // This would create a delegation record
        // await this.delegationModel.create({
        //     delegatorId: managerId,
        //     delegateId: delegateId,
        //     startDate: startDate,
        //     endDate: endDate,
        //     isActive: true,
        // });
        
        // For now, this is a placeholder - actual implementation would require a Delegation schema
        console.log(`Delegating approval authority from ${managerId} to ${delegateId} from ${startDate} to ${endDate}`);
    }

    // Phase 2: REQ-025, REQ-029 - HR Manager finalize approved leave request
    async finalizeLeaveRequest(leaveRequestId: string, hrUserId: string): Promise<LeaveRequestDocument> {
      const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId).exec();
      if (!leaveRequest) {
        throw new Error(`LeaveRequest with ID ${leaveRequestId} not found`);
      }

      const lastApproval = leaveRequest.approvalFlow[leaveRequest.approvalFlow.length - 1];
      if (lastApproval.role !== 'HR Manager' || lastApproval.status !== 'PENDING') {
        throw new Error('Leave request is not pending HR finalization.');
      }

      // REQ-028: Verify medical documents if required
      if (leaveRequest.attachmentId) {
        const attachment = await this.attachmentModel.findById(leaveRequest.attachmentId).exec();
        if (!attachment) {
          throw new Error('Referenced attachment not found.');
        }
        // BR 54: Additional document validation (file type, size, etc.)
        await this.validateDocument(leaveRequest.leaveTypeId.toString(), attachment);
      }

      // BR 41: Check cumulative limits (e.g., max sick leave per year)
      await this.checkCumulativeLimits(leaveRequest.employeeId.toString(), leaveRequest.leaveTypeId.toString(), leaveRequest.durationDays);

      // Update approval flow
      const hrIndex = leaveRequest.approvalFlow.length - 1;
      leaveRequest.approvalFlow[hrIndex] = {
        role: 'HR Manager',
        status: LeaveStatus.APPROVED,
        decidedBy: new Types.ObjectId(hrUserId),
        decidedAt: new Date(),
      };

      leaveRequest.status = LeaveStatus.APPROVED;

      // REQ-029, BR 32: Auto-update leave balances with proper calculation
      await this.finalizeApprovedLeaveRequest(leaveRequest);

      // REQ-030: Notify stakeholders
      //await this.notifyStakeholders(leaveRequest, 'finalized');

      // REQ-042, BR 692: Sync with payroll system
    ///await this.syncWithPayroll(leaveRequest);

      return await leaveRequest.save();
    }


    // Phase 2: BR 54 - Validate document (file type, size, format)
    private async validateDocument(leaveTypeId: string, attachment: AttachmentDocument): Promise<void> {
        const leaveType = await this.leaveTypeModel.findById(leaveTypeId).exec();
        if (!leaveType) {
            return;
        }

        // Validate file type if specified
        if (leaveType.attachmentType) {
            // Additional validation can be added here based on attachmentType
            // For example, medical documents should be PDF or image files
        }

        // Validate file size (e.g., max 10MB)
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (attachment.size && attachment.size > maxFileSize) {
            throw new Error('Attachment file size exceeds maximum allowed size (10MB).');
        }
    }


    // Phase 2: BR 41 - Check cumulative limits (e.g., max sick leave per year)
    private async checkCumulativeLimits(employeeId: string, leaveTypeId: string, requestedDays: number): Promise<void> {
      const leaveType = await this.leaveTypeModel.findById(leaveTypeId).exec();
      if (!leaveType) {
        return;
      }

      // Check max sick leave per year
      if (leaveType.code === 'SICK_LEAVE') {
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31);

        const approvedSickLeaves = await this.leaveRequestModel.find({
          employeeId: new Types.ObjectId(employeeId),
          leaveTypeId: new Types.ObjectId(leaveTypeId),
          status: LeaveStatus.APPROVED,
          'dates.from': { $gte: yearStart, $lte: yearEnd },
        }).exec();

        const totalSickLeaveDays = approvedSickLeaves.reduce((sum, req) => sum + req.durationDays, 0);
        const maxSickLeavePerYear = 30; // Should come from policy configuration

        if (totalSickLeaveDays + requestedDays > maxSickLeavePerYear) {
          throw new Error(`Cumulative sick leave limit exceeded. Maximum ${maxSickLeavePerYear} days per year allowed.`);
        }
      }
    }


    // Phase 2: REQ-029, BR 32 - Finalize approved leave request (update balances with proper calculation)
    private async finalizeApprovedLeaveRequest(leaveRequest: LeaveRequestDocument): Promise<void> {
      const entitlement = await this.getLeaveEntitlement(
        leaveRequest.employeeId.toString(),
        leaveRequest.leaveTypeId.toString()
      );

      // BR 32: Proper balance calculation - move from pending to taken
      entitlement.pending = Math.max(0, entitlement.pending - leaveRequest.durationDays);
      entitlement.taken += leaveRequest.durationDays;
        
      // BR 32: Recalculate remaining balance (yearlyEntitlement - taken)
      entitlement.remaining = entitlement.yearlyEntitlement - entitlement.taken;

      await this.updateLeaveEntitlement(entitlement._id.toString(), {
        pending: entitlement.pending,
        taken: entitlement.taken,
        remaining: entitlement.remaining,
      });
    }


    // Phase 2: REQ-030, N-053 - Notify stakeholders
    private async notifyStakeholders(leaveRequest: LeaveRequestDocument, event: string): Promise<void> {
        // This would integrate with NotificationService
        // await this.notificationService.sendNotification(
        //     leaveRequest.employeeId.toString(),
        //     `Leave request ${event}`,
        //     `Your leave request has been ${event}.`
        // );
        
        // Notify manager
        const managerId = leaveRequest.approvalFlow[0]?.decidedBy;
        if (managerId) {
            // await this.notificationService.sendNotification(
            //     managerId.toString(),
            //     `Leave request ${event}`,
            //     `Leave request from employee has been ${event}.`
            // );
        }

        // Notify HR and attendance coordinator
        // await this.notificationService.sendNotification(
        //     'HR_TEAM_ID',
        //     `Leave request ${event}`,
        //     `Leave request ${leaveRequest._id} has been ${event}.`
        // );
    }

    // Phase 2: REQ-042, BR 692 - Sync with payroll system
    private async syncWithPayroll(leaveRequest: LeaveRequestDocument): Promise<void> {
        // This would integrate with PayrollService
        // BR 692: Sync leave balance changes with payroll
        // await this.payrollService.updateLeaveBalance(
        //     leaveRequest.employeeId.toString(),
        //     leaveRequest.leaveTypeId.toString(),
        //     leaveRequest.durationDays,
        //     leaveRequest.dates.from,
        //     leaveRequest.dates.to
        // );
    }

    
    // Phase 2: REQ-026, BR 479 - HR Manager override manager decision
    async hrOverrideDecision(leaveRequestId: string, hrUserId: string, overrideToApproved: boolean, overrideReason?: string): Promise<LeaveRequestDocument> {
      const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId).exec();
      if (!leaveRequest) {
        throw new Error(`LeaveRequest with ID ${leaveRequestId} not found`);
      }

      // BR 479: Validate override conditions (e.g., only for special circumstances)
      if (!overrideReason || overrideReason.trim().length === 0) {
        throw new Error('Override reason is required for HR override decisions.');
      }

      leaveRequest.approvalFlow.push({
        role: 'HR Manager',
        status: overrideToApproved ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
        decidedBy: new Types.ObjectId(hrUserId),
        decidedAt: new Date(),
      });

      if (overrideToApproved) {
        leaveRequest.status = LeaveStatus.APPROVED;
        await this.finalizeApprovedLeaveRequest(leaveRequest);
        await this.notifyStakeholders(leaveRequest, 'overridden_approved');
        await this.syncWithPayroll(leaveRequest);
      } else {
        leaveRequest.status = LeaveStatus.REJECTED;
        const entitlement = await this.getLeaveEntitlement(
          leaveRequest.employeeId.toString(),
          leaveRequest.leaveTypeId.toString()
        );
        entitlement.pending = Math.max(0, entitlement.pending - leaveRequest.durationDays);
        await this.updateLeaveEntitlement(entitlement._id.toString(), {
          pending: entitlement.pending,
        });
        await this.notifyStakeholders(leaveRequest, 'overridden_rejected');
      }

      return await leaveRequest.save();
    }
    

    
    // Phase 2: REQ-027 - Process multiple leave requests at once
    async processMultipleLeaveRequests(leaveRequestIds: string[], hrUserId: string, approved: boolean): Promise<LeaveRequestDocument[]> {
      const results: LeaveRequestDocument[] = [];

      for (const leaveRequestId of leaveRequestIds) {
        try {
          if (approved) {
            const finalized = await this.finalizeLeaveRequest(leaveRequestId, hrUserId);
            results.push(finalized);
          } else {
            const rejected = await this.hrOverrideDecision(leaveRequestId, hrUserId, false, 'Bulk rejection');
            results.push(rejected);
          }
        } catch (error) {
          console.error(`Error processing leave request ${leaveRequestId}:`, error);
        }
      }

      return results;
    }
    

    
    // Phase 2: Get employee leave balance
    async getEmployeeLeaveBalance(employeeId: string, leaveTypeId?: string): Promise<any> {
      if (leaveTypeId) {
        const entitlement = await this.getLeaveEntitlement(employeeId, leaveTypeId);
        return {
          leaveTypeId,
          yearlyEntitlement: entitlement.yearlyEntitlement,
          taken: entitlement.taken,
          pending: entitlement.pending,
          remaining: entitlement.remaining,
        };
      } else {
        const entitlements = await this.leaveEntitlementModel.find({ employeeId }).exec();
        return entitlements.map(ent => ({
          leaveTypeId: ent.leaveTypeId,
          yearlyEntitlement: ent.yearlyEntitlement,
          taken: ent.taken,
          pending: ent.pending,
          remaining: ent.remaining,
        }));
      }
    }
   










}
