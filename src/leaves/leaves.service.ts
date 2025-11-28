import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { populate } from 'dotenv';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { HolidayType } from '../time-management/models/enums';
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
import { CreateCalendarDto } from './dto/CreateCalendar.dto';
import { UpdateLeaveTypeDto } from './dto/UpdateLeaveType.dto'; 
import { LeaveStatus } from './enums/leave-status.enum';
//import { NotificationService } from '../notification/notification.service'; // Assuming a notification service

  


import { AccrualMethod } from './enums/accrual-method.enum';
import { ApproveLeaveRequestDto } from './dto/ApproveLeaveRequest.dto';
import { RejectLeaveRequestDto } from './dto/RejectLeaveRequest.dto';
import { ViewLeaveBalanceDto } from './dto/ViewLeaveBalance.dto';
import { ViewPastLeaveRequestsDto } from './dto/ViewPastLeaveRequests.dto';
import { FilterLeaveHistoryDto } from './dto/FilterLeaveHistory.dto';
import { ViewTeamLeaveBalancesDto } from './dto/ViewTeamLeaveBalances.dto';
import { FilterTeamLeaveDataDto } from './dto/FilterTeamLeaveData.dto';
import { FlagIrregularPatternDto } from './dto/FlagIrregularPattern.dto';
import { AutoAccrueLeaveDto, AccrueAllEmployeesDto } from './dto/AutoAccrueLeave.dto';
import { RunCarryForwardDto } from './dto/CarryForward.dto';
import { AccrualAdjustmentDto } from './dto/AccrualAdjustment.dto';
import { SyncWithPayrollDto } from './dto/SyncWithPayroll.dto';



@Injectable()
export class LeavesService {
      // Calendar Management
      async createCalendar(dto: CreateCalendarDto): Promise<CalendarDocument> {
        // Normalize holidays: accept either array of ObjectId strings or embedded holiday objects
        const holidayIds: Types.ObjectId[] = [];
        if (dto.holidays && Array.isArray(dto.holidays)) {
          // Try to get Holiday model from same connection (registered in time-management module)
          let HolidayModel: any = null;
          try {
            HolidayModel = this.calendarModel.db.model('Holiday');
          } catch (err) {
            HolidayModel = null;
          }

          for (const h of dto.holidays) {
            if (!h) continue;
            // If already an id string or ObjectId-like, push as ObjectId
            if (typeof h === 'string' || h instanceof Types.ObjectId) {
              holidayIds.push(new Types.ObjectId(h));
              continue;
            }

            // otherwise assume it's an object with { name, date, description }
            if (HolidayModel) {
              try {
                const created: any = await HolidayModel.create({
                  type: HolidayType.ORGANIZATIONAL,
                  startDate: new Date(h.date),
                  endDate: h.date ? new Date(h.date) : undefined,
                  name: h.name || undefined,
                  active: true,
                });
                holidayIds.push(created._id);
                continue;
              } catch (err) {
                // if creation failed, skip this holiday
                console.warn('Failed to create Holiday document for calendar import:', err);
              }
            }

            // fallback: skip or attempt to coerce
          }
        }

        const doc = new this.calendarModel({
          year: dto.year,
          holidays: holidayIds,
          blockedPeriods: dto.blockedPeriods?.map(p => ({
            from: new Date(p.from),
            to: new Date(p.to),
            reason: p.reason || ''
          })) || []
        });
        return await doc.save();
      }

      async getCalendarByYear(year: number): Promise<CalendarDocument | null> {
        // Populate holidays so callers receive full holiday documents (dates/names)
        return await this.calendarModel.findOne({ year }).populate('holidays').exec();
      }

      async updateCalendar(year: number, dto: CreateCalendarDto): Promise<CalendarDocument | null> {
        const holidayIds: Types.ObjectId[] = [];
        if (dto.holidays && Array.isArray(dto.holidays)) {
          let HolidayModel: any = null;
          try {
            HolidayModel = this.calendarModel.db.model('Holiday');
          } catch (err) {
            HolidayModel = null;
          }

          for (const h of dto.holidays) {
            if (!h) continue;
            if (typeof h === 'string' || h instanceof Types.ObjectId) {
              holidayIds.push(new Types.ObjectId(h));
              continue;
            }

            if (HolidayModel) {
              try {
                const created: any = await HolidayModel.create({
                  type: HolidayType.ORGANIZATIONAL,
                  startDate: new Date(h.date),
                  endDate: h.date ? new Date(h.date) : undefined,
                  name: h.name || undefined,
                  active: true,
                });
                holidayIds.push(created._id);
                continue;
              } catch (err) {
                console.warn('Failed to create Holiday document for calendar update:', err);
              }
            }
          }
        }

        return await this.calendarModel.findOneAndUpdate(
          { year },
          {
            $set: {
              holidays: holidayIds,
              blockedPeriods: dto.blockedPeriods?.map(p => ({
                from: new Date(p.from),
                to: new Date(p.to),
                reason: p.reason || ''
              })) || []
            }
          },
          { upsert: true, new: true }
        ).exec();
      }
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




// Checks if any date in the range [from, to] overlaps with blocked periods in the calendar for that year
async isBlockedDateRange(from: string, to: string): Promise<boolean> {
  const year = new Date(from).getFullYear();
  const calendar = await this.calendarModel.findOne({ year }).exec();
  if (!calendar) {
    console.warn('Calendar for year', year, 'not found; treating date as not blocked:', from, to);
    return false;
  }
  const start = new Date(from);
  const end = new Date(to);
  return calendar.blockedPeriods.some(
    (period) => {
      const blockedStart = new Date(period.from);
      const blockedEnd = new Date(period.to);
      // Overlap: (start <= blockedEnd) && (end >= blockedStart)
      return start <= blockedEnd && end >= blockedStart;
    }
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

        // Check if any date in the requested range falls on a blocked period
        const isBlocked = await this.isBlockedDateRange(startDate.toISOString(), endDate.toISOString());
        if (isBlocked) {
          throw new BadRequestException('The requested leave dates fall on blocked periods.');
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
      const leaveRequest = await this.leaveRequestModel.findById(id).exec();
      if (!leaveRequest) {
        throw new Error(`LeaveRequest with ID ${id} not found`);
      }
      return leaveRequest;
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
  const leaveRequest = await this.leaveRequestModel.findById(id).exec();

  if (!leaveRequest) {
    throw new Error(`LeaveRequest with ID ${id} not found`);
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
    // Notifications are disabled per requirements (no-op)
    private async notifyStakeholders(_: LeaveRequestDocument, __: string): Promise<void> {
      return; // intentionally no-op
    }

    // Phase 2: REQ-042, BR 692 - Sync with payroll system (internal helper)
    // renamed to avoid collision with public `syncWithPayroll` that accepts event payloads
    private async syncWithPayrollForRequest(leaveRequest: LeaveRequestDocument): Promise<void> {
      // Placeholder for integration with PayrollService
      // Implementation intentionally left as no-op for now (external sync handled elsewhere)
      return;
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
        await this.syncWithPayrollForRequest(leaveRequest);
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
    

    
    // Phase 2: Get employee leave balance (detailed)
    // Consolidated: returns detailed entitlement info. If `leaveTypeId` is provided,
    // returns a single object; otherwise returns an array of entitlements.
    //REQ-031:view current leave balance
    async getEmployeeLeaveBalance(employeeId: string, leaveTypeId?: string): Promise<any> {
      try {
        const query: any = { employeeId: new Types.ObjectId(employeeId) };
        if (leaveTypeId) {
          query.leaveTypeId = new Types.ObjectId(leaveTypeId);
        }

        const entitlements = await this.leaveEntitlementModel.find(query).populate('leaveTypeId').exec();

        const mapped = entitlements.map(ent => ({
          leaveTypeId: ent.leaveTypeId?._id || ent.leaveTypeId,
          leaveTypeName: (ent.leaveTypeId as any)?.name || undefined,
          yearlyEntitlement: ent.yearlyEntitlement,
          accruedActual: ent.accruedActual,
          carryForward: ent.carryForward,
          taken: ent.taken,
          pending: ent.pending,
          remaining: ent.remaining,
          lastAccrualDate: ent.lastAccrualDate,
        }));

        if (leaveTypeId) {
          return mapped.length ? mapped[0] : null;
        }

        return mapped;
      } catch (error) {
        throw new Error(`Failed to fetch leave balance: ${(error as any).message}`);
      }
    }

    // REQ-032: Get past leave requests with filters
    async getPastLeaveRequests(employeeId: string, filters?: any): Promise<any[]> {
      try {
        const query: any = { employeeId: new Types.ObjectId(employeeId) };
        
        if (filters?.fromDate || filters?.toDate) {
          query['dates.from'] = {};
          if (filters?.fromDate) query['dates.from'].$gte = new Date(filters.fromDate);
          if (filters?.toDate) {
            query['dates.to'] = query['dates.to'] || {};
            query['dates.to'].$lte = new Date(filters.toDate);
          }
        }

        if (filters?.status) {
          query.status = filters.status;
        }

        if (filters?.leaveTypeId) {
          query.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
        }

        const requests = await this.leaveRequestModel.find(query)
          .populate('leaveTypeId')
          .sort({ 'dates.from': -1 })
          .exec();

        return requests.map(req => ({
          _id: req._id,
          employeeId: req.employeeId,
          leaveTypeId: req.leaveTypeId._id,
          leaveTypeName: (req.leaveTypeId as any).name,
          dates: req.dates,
          durationDays: req.durationDays,
          justification: req.justification,
          status: req.status,
          approvalFlow: req.approvalFlow,
          createdAt: (req as any).createdAt,
          updatedAt: (req as any).updatedAt,
        }));
      } catch (error) {
        throw new Error(`Failed to fetch past leave requests: ${(error as any).message}`);
      }
    }

    // REQ-033: Filter and sort leave history
    async filterLeaveHistory(employeeId: string, filters: any): Promise<any> {
      try {
        const query: any = { employeeId: new Types.ObjectId(employeeId) };

        if (filters.leaveTypeId) {
          query.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
        }

        if (filters.fromDate || filters.toDate) {
          query['dates.from'] = {};
          if (filters.fromDate) query['dates.from'].$gte = new Date(filters.fromDate);
          if (filters.toDate) {
            query['dates.to'] = query['dates.to'] || {};
            query['dates.to'].$lte = new Date(filters.toDate);
          }
        }

        if (filters.status) {
          query.status = filters.status;
        }

        let sortObj: any = {};
        if (filters.sortByDate) {
          sortObj['dates.from'] = filters.sortByDate === 'asc' ? 1 : -1;
        }
        if (filters.sortByStatus) {
          sortObj.status = filters.sortByStatus === 'asc' ? 1 : -1;
        }

        const total = await this.leaveRequestModel.countDocuments(query);
        const skip = filters.offset || 0;
        const limit = filters.limit || 10;

        const items = await this.leaveRequestModel.find(query)
          .populate('leaveTypeId')
          .sort(sortObj || { 'dates.from': -1 })
          .skip(skip)
          .limit(limit)
          .exec();

        return {
          total,
          items: items.map(req => ({
            _id: req._id,
            employeeId: req.employeeId,
            leaveTypeName: (req.leaveTypeId as any).name,
            dates: req.dates,
            durationDays: req.durationDays,
            status: req.status,
            createdAt: (req as any).createdAt,
          })),
        };
      } catch (error) {
        throw new Error(`Failed to filter leave history: ${(error as any).message}`);
      }
    }

    // REQ-034: Get team leave balances and upcoming leaves
    async getTeamLeaveBalances(managerId: string, upcomingFromDate?: Date, upcomingToDate?: Date, departmentId?: string): Promise<any> {
      try {
        // Get team members under manager - placeholder implementation
        const teamMembers: any[] = [];
        
        const balances = await Promise.all(
          teamMembers.map(async (member) => {
            const entitlements = await this.leaveEntitlementModel.find({ employeeId: new Types.ObjectId(member._id) })
              .populate('leaveTypeId')
              .exec();

            let upcomingQuery: any = { employeeId: new Types.ObjectId(member._id), status: { $in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] } };
            if (upcomingFromDate || upcomingToDate) {
              upcomingQuery['dates.from'] = {};
              if (upcomingFromDate) upcomingQuery['dates.from'].$gte = upcomingFromDate;
              if (upcomingToDate) {
                upcomingQuery['dates.to'] = upcomingQuery['dates.to'] || {};
                upcomingQuery['dates.to'].$lte = upcomingToDate;
              }
            }

            const upcomingLeaves = await this.leaveRequestModel.find(upcomingQuery).populate('leaveTypeId').exec();

            return {
              employeeId: member._id,
              employeeName: member.name,
              position: member.position,
              department: member.department,
              leaveBalances: entitlements.map(ent => ({
                leaveTypeId: ent.leaveTypeId._id,
                leaveTypeName: (ent.leaveTypeId as any).name,
                remaining: ent.remaining,
                pending: ent.pending,
                taken: ent.taken,
              })),
              upcomingLeaves: upcomingLeaves.map(leave => ({
                _id: leave._id,
                leaveTypeName: (leave.leaveTypeId as any).name,
                dates: leave.dates,
                durationDays: leave.durationDays,
                status: leave.status,
              })),
            };
          })
        );

        return {
          managerId,
          teamMembers: balances,
          totalTeamMembers: balances.length,
        };
      } catch (error) {
        throw new Error(`Failed to get team leave balances: ${(error as any).message}`);
      }
    }

    // REQ-035: Filter and sort team leave data
    async filterTeamLeaveData(managerId: string, filters: any): Promise<any> {
      try {
        // Get team members - placeholder
        const teamMembers: any[] = [];
        const memberIds = teamMembers.map(m => new Types.ObjectId(m._id));

        const query: any = { employeeId: { $in: memberIds } };

        if (filters.leaveTypeId) {
          query.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
        }

        if (filters.fromDate || filters.toDate) {
          query['dates.from'] = {};
          if (filters.fromDate) query['dates.from'].$gte = new Date(filters.fromDate);
          if (filters.toDate) {
            query['dates.to'] = query['dates.to'] || {};
            query['dates.to'].$lte = new Date(filters.toDate);
          }
        }

        if (filters.status) {
          query.status = filters.status;
        }

        let sortObj: any = {};
        if (filters.sortByDate) {
          sortObj['dates.from'] = filters.sortByDate === 'asc' ? 1 : -1;
        }
        if (filters.sortByStatus) {
          sortObj.status = filters.sortByStatus === 'asc' ? 1 : -1;
        }

        const total = await this.leaveRequestModel.countDocuments(query);
        const skip = filters.offset || 0;
        const limit = filters.limit || 10;

        const items = await this.leaveRequestModel.find(query)
          .populate('leaveTypeId')
          .sort(sortObj || { 'dates.from': -1 })
          .skip(skip)
          .limit(limit)
          .exec();

        return {
          total,
          filters: {
            managerId,
            departmentId: filters.departmentId,
            leaveTypeId: filters.leaveTypeId,
            dateRange: filters.fromDate || filters.toDate ? { from: filters.fromDate, to: filters.toDate } : undefined,
            status: filters.status,
          },
          items: items.map(req => ({
            _id: req._id,
            employeeId: req.employeeId,
            leaveTypeName: (req.leaveTypeId as any).name,
            dates: req.dates,
            durationDays: req.durationDays,
            status: req.status,
            createdAt: (req as any).createdAt,
          })),
        };
      } catch (error) {
        throw new Error(`Failed to filter team leave data: ${(error as any).message}`);
      }
    }

    // REQ-039: Flag irregular leaving patterns
    async flagIrregularPattern(leaveRequestId: string, managerId: string, flagReason: string, notes?: string): Promise<any> {
      try {
        const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId).exec();
        if (!leaveRequest) {
          throw new Error(`LeaveRequest with ID ${leaveRequestId} not found`);
        }

        leaveRequest.irregularPatternFlag = true;
        await leaveRequest.save();

        return {
          success: true,
          leaveRequestId,
          flagReason,
          notes,
          flaggedBy: managerId,
          flaggedDate: new Date(),
          status: 'flagged',
        };
      } catch (error) {
        throw new Error(`Failed to flag irregular pattern: ${(error as any).message}`);
      }
    }

    // REQ-040: Auto accrue leave for single employee
    async autoAccrueLeave(employeeId: string, leaveTypeId: string, accrualAmount: number, accrualType: string, policyId?: string, notes?: string): Promise<any> {
      try {
        const entitlement = await this.getLeaveEntitlement(employeeId, leaveTypeId);
        const previousBalance = entitlement.remaining;

        entitlement.accruedActual += accrualAmount;
        entitlement.remaining = entitlement.yearlyEntitlement - entitlement.taken + entitlement.accruedActual;

        await this.updateLeaveEntitlement(entitlement._id.toString(), {
          accruedActual: entitlement.accruedActual,
          remaining: entitlement.remaining,
          lastAccrualDate: new Date(),
        });

        return {
          success: true,
          employeeId,
          leaveTypeId,
          accrualAmount,
          accrualType,
          previousBalance,
          newBalance: entitlement.remaining,
          effectiveDate: new Date(),
          notes,
        };
      } catch (error) {
        throw new Error(`Failed to accrue leave: ${(error as any).message}`);
      }
    }

    // REQ-040: Auto accrue for all employees
    async autoAccrueAllEmployees(leaveTypeId: string, accrualAmount: number, accrualType: string, departmentId?: string): Promise<any> {
      try {
        const query: any = { leaveTypeId: new Types.ObjectId(leaveTypeId) };
        const entitlements = await this.leaveEntitlementModel.find(query).exec();

        const results: any[] = [];
        let successful = 0;
        let failed = 0;

        for (const entitlement of entitlements) {
          try {
            const previousBalance = entitlement.remaining;
            entitlement.accruedActual += accrualAmount;
            entitlement.remaining = entitlement.yearlyEntitlement - entitlement.taken + entitlement.accruedActual;
            
            await this.updateLeaveEntitlement(entitlement._id.toString(), {
              accruedActual: entitlement.accruedActual,
              remaining: entitlement.remaining,
              lastAccrualDate: new Date(),
            });

            results.push({
              employeeId: entitlement.employeeId,
              status: 'success',
              previousBalance,
              newBalance: entitlement.remaining,
              accrualAmount,
            });
            successful++;
          } catch (err) {
            failed++;
            results.push({
              employeeId: entitlement.employeeId,
              status: 'failed',
              error: (err as any).message,
            });
          }
        }

        return {
          successful,
          failed,
          total: entitlements.length,
          details: results,
        };
      } catch (error) {
        throw new Error(`Failed to accrue leave for all employees: ${(error as any).message}`);
      }
    }

    // REQ-041: Run carry-forward
    async runCarryForward(leaveTypeId: string, employeeId?: string, asOfDate?: Date, departmentId?: string): Promise<any> {
      try {
        const processDate = asOfDate || new Date();
        const query: any = { leaveTypeId: new Types.ObjectId(leaveTypeId) };

        if (employeeId) {
          query.employeeId = new Types.ObjectId(employeeId);
        }

        const entitlements = await this.leaveEntitlementModel.find(query).exec();
        const results: any[] = [];
        let successful = 0;
        let failed = 0;

        for (const entitlement of entitlements) {
          try {
            const carryForwardAmount = Math.min(entitlement.remaining, 10); // Max 10 days carry forward
            entitlement.carryForward = carryForwardAmount;
            entitlement.remaining = entitlement.remaining - carryForwardAmount;

            await this.updateLeaveEntitlement(entitlement._id.toString(), {
              carryForward: entitlement.carryForward,
              remaining: entitlement.remaining,
            });

            results.push({
              employeeId: entitlement.employeeId,
              status: 'success',
              carryForwardAmount,
              expiringAmount: 0,
              newBalance: entitlement.remaining,
            });
            successful++;
          } catch (err) {
            failed++;
            results.push({
              employeeId: entitlement.employeeId,
              status: 'failed',
              error: (err as any).message,
            });
          }
        }

        return {
          processedDate: processDate,
          leaveTypeId,
          successful,
          failed,
          total: entitlements.length,
          details: results,
        };
      } catch (error) {
        throw new Error(`Failed to run carry-forward: ${(error as any).message}`);
      }
    }

    // REQ-042: Adjust accruals during unpaid leave or long absence
    async adjustAccrual(employeeId: string, leaveTypeId: string, adjustmentType: string, adjustmentAmount: number, fromDate: Date, toDate?: Date, reason?: string, notes?: string): Promise<any> {
      try {
        const entitlement = await this.getLeaveEntitlement(employeeId, leaveTypeId);
        const previousBalance = entitlement.remaining;

        switch (adjustmentType) {
          case 'suspension':
            entitlement.accruedActual -= adjustmentAmount;
            break;
          case 'reduction':
            entitlement.remaining -= adjustmentAmount;
            break;
          case 'adjustment':
            entitlement.remaining += adjustmentAmount;
            break;
          case 'restoration':
            entitlement.accruedActual += adjustmentAmount;
            break;
          default:
            throw new Error('Invalid adjustment type');
        }

        entitlement.remaining = Math.max(0, entitlement.remaining);

        await this.updateLeaveEntitlement(entitlement._id.toString(), {
          accruedActual: entitlement.accruedActual,
          remaining: entitlement.remaining,
        });

        return {
          success: true,
          employeeId,
          leaveTypeId,
          adjustmentType,
          adjustmentAmount,
          previousBalance,
          newBalance: entitlement.remaining,
          effectiveDate: fromDate,
          reason,
          notes,
        };
      } catch (error) {
        throw new Error(`Failed to adjust accrual: ${(error as any).message}`);
      }
    }

    // REQ-043: Sync with payroll system
    async syncWithPayroll(leaveRequestId: string, syncType: string, employeeId: string, effectiveDate?: Date, notes?: string): Promise<any> {
      try {
        const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId).exec();
        if (!leaveRequest) {
          throw new Error(`LeaveRequest with ID ${leaveRequestId} not found`);
        }

        const entitlement = await this.getLeaveEntitlement(employeeId, leaveRequest.leaveTypeId.toString());
        const salaryImpact = leaveRequest.durationDays * 100; // Simplified calculation

        return {
          success: true,
          syncStatus: 'synced',
          eventId: leaveRequestId,
          employeeId,
          syncType,
          payrollReference: `PAYROLL-${leaveRequestId}`,
          salaryImpact,
          timestamp: new Date(),
          notes,
        };
      } catch (error) {
        throw new Error(`Failed to sync with payroll: ${(error as any).message}`);
      }
    }
   










}
