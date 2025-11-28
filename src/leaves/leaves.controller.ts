import { CreateCalendarDto } from './dto/CreateCalendar.dto';
import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeavePolicyDto } from './dto/CreateLeavePolicy.dto';
import { UpdateLeavePolicyDto } from './dto/UpdateLeavePolicy.dto';
import { CreateLeaveRequestDto } from './dto/CreateLeaveRequest.dto';
import { UpdateLeaveRequestDto } from './dto/UpdateLeaveRequest.dto';
import { CreateLeaveEntitlementDto } from './dto/CreateLeaveEntitlement.dto';
import { UpdateLeaveEntitlementDto } from './dto/UpdateLeaveEntitlement.dto';
import { CreateLeaveAdjustmentDto } from './dto/CreateLeaveAdjustment.dto';
import { CreateLeaveTypeDto } from './dto/CreateLeaveType.dto';
import { UpdateLeaveTypeDto } from './dto/UpdateLeaveType.dto';
import { CreateLeaveCategoryDto } from './dto/CreateLeaveCategory.dto';
import { ApproveLeaveRequestDto } from './dto/ApproveLeaveRequest.dto';
import { RejectLeaveRequestDto } from './dto/RejectLeaveRequest.dto';
import { FinalizeLeaveRequestDto } from './dto/FinalizeLeaveRequest.dto';
import { HrOverrideDecisionDto } from './dto/HrOverrideDecision.dto';
import { ProcessMultipleRequestsDto } from './dto/ProcessMultipleRequests.dto';
import { ViewLeaveBalanceDto } from './dto/ViewLeaveBalance.dto';
import { ViewPastLeaveRequestsDto } from './dto/ViewPastLeaveRequests.dto';
import { FilterLeaveHistoryDto } from './dto/FilterLeaveHistory.dto';
import { ViewTeamLeaveBalancesDto } from './dto/ViewTeamLeaveBalances.dto';
import { FilterTeamLeaveDataDto } from './dto/FilterTeamLeaveData.dto';
import { FlagIrregularPatternDto, IrregularPatternAnalysisDto } from './dto/FlagIrregularPattern.dto';
import { AutoAccrueLeaveDto, AccrueAllEmployeesDto } from './dto/AutoAccrueLeave.dto';
import { RunCarryForwardDto } from './dto/CarryForward.dto';
import { AccrualAdjustmentDto, AccrualSuspensionDto } from './dto/AccrualAdjustment.dto';
import { SyncWithPayrollDto } from './dto/SyncWithPayroll.dto';
//import { DelegateApprovalDto } from './dto/DelegateApproval.dto';

// import { Roles } from './decorators/roles.decorator';
// import { RolesGuard } from './guards/roles.guard';

@Controller('leaves')
export class LeaveController {
    // Calendar Endpoints
    @Post('calendar')
    async createCalendar(@Body() dto: CreateCalendarDto) {
      return await this.leavesService.createCalendar(dto);
    }

    @Get('calendar/:year')
    async getCalendar(@Param('year') year: string) {
      return await this.leavesService.getCalendarByYear(Number(year));
    }

    @Put('calendar/:year')
    async updateCalendar(@Param('year') year: string, @Body() dto: CreateCalendarDto) {
      return await this.leavesService.updateCalendar(Number(year), dto);
    }
  constructor(private readonly leavesService: LeavesService) {}
                       //leave policy Endpoints
  @Post('policy')
  // @UseGuards(RolesGuard) 
  // @Roles('HR Admin')
  async createLeavePolicy(@Body() createLeavePolicyDto: CreateLeavePolicyDto) {
    return await this.leavesService.createLeavePolicy(createLeavePolicyDto);
  }

  @Get('policies')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')
  async getLeavePolicies() {
    return await this.leavesService.getLeavePolicies();
  }

  @Get('policy/:id')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')
  async getLeavePolicyById(@Param('id') id: string) {
    return await this.leavesService.getLeavePolicyById(id);
  }

  @Put('policy/:id')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')
  async updateLeavePolicy(
    @Param('id') id: string,
    @Body() updateLeavePolicyDto: UpdateLeavePolicyDto
  ) {
    return await this.leavesService.updateLeavePolicy(id, updateLeavePolicyDto);
  }

  @Delete('policy/:id')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')
  async deleteLeavePolicy(@Param('id') id: string) {
    return await this.leavesService.deleteLeavePolicy(id);
  }

                          // Leave Request Endpoints

  @Post('request')
  //@UseGuards(JwtAuthGuard)  // Only authenticated users can submit a request
  // @Roles('Employee')
  async createLeaveRequest(@Body() createLeaveRequestDto: CreateLeaveRequestDto) {
    return await this.leavesService.createLeaveRequest(createLeaveRequestDto);
  }

  @Get('request/:id')
  // @UseGuards(RolesGuard)
  // @Roles('Employee', 'HR Admin', 'Manager')  // Employees, HR Admin, and Manager can view leave requests
  async getLeaveRequestById(@Param('id') id: string) {
    return await this.leavesService.getLeaveRequestById(id);
  }

  @Put('request/:id')
  // @UseGuards( RolesGuard)
  // @Roles('Employee', 'HR Admin', 'Manager')  // Employee can update their own request, HR Admin and Manager can update any
  async updateLeaveRequest(
    @Param('id') id: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto
  ) {
    return await this.leavesService.updateLeaveRequest(id, updateLeaveRequestDto);
  }

  @Delete('request/:id')
  // @UseGuards(RolesGuard)
  // @Roles('Employee', 'HR Admin')  // Employees can delete their own leave requests, HR Admin can delete any
  async deleteLeaveRequest(@Param('id') id: string) {
    return await this.leavesService.deleteLeaveRequest(id);
  }

  // Leave Entitlement Endpoints
  @Post('entitlement')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')  // Only HR Admin can create leave entitlement
  async createLeaveEntitlement(@Body() createLeaveEntitlementDto: CreateLeaveEntitlementDto) {
    return await this.leavesService.createLeaveEntitlement(createLeaveEntitlementDto);
  }

  @Get('entitlement/:employeeId/:leaveTypeId')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin', 'Manager')  // HR Admin and Manager can view entitlements
  async getLeaveEntitlement(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string
  ) {
    return await this.leavesService.getLeaveEntitlement(employeeId, leaveTypeId);
  }

  @Put('entitlement/:id')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')  // Only HR Admin can update leave entitlement
  async updateLeaveEntitlement(
    @Param('id') id: string,
    @Body() updateLeaveEntitlementDto: UpdateLeaveEntitlementDto
  ) {
    return await this.leavesService.updateLeaveEntitlement(id, updateLeaveEntitlementDto);
  }

  // Leave Adjustment Endpoints
  @Post('adjustment')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')  // Only HR Admin can create leave adjustments
  async createLeaveAdjustment(@Body() createLeaveAdjustmentDto: CreateLeaveAdjustmentDto) {
    return await this.leavesService.createLeaveAdjustment(createLeaveAdjustmentDto);
  }

  @Get('adjustment/:employeeId')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin', 'Manager')  // HR Admin and Manager can view leave adjustments
  async getLeaveAdjustments(@Param('employeeId') employeeId: string) {
    return await this.leavesService.getLeaveAdjustments(employeeId);
  }

  @Delete('adjustment/:id')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')  // Only HR Admin can delete leave adjustments
  async deleteLeaveAdjustment(@Param('id') id: string) {
    return await this.leavesService.deleteLeaveAdjustment(id);
  }

  // Leave Type Endpoints
  @Post('category')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')  // Only HR Admin can create leave categories
  async createLeaveCategory(@Body() createLeaveCategoryDto: CreateLeaveCategoryDto) {
    return await this.leavesService.createLeaveCategory(createLeaveCategoryDto);
  }
  @Post('type')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')  // Only HR Admin can create leave types
  async createLeaveType(@Body() createLeaveTypeDto: CreateLeaveTypeDto) {
    return await this.leavesService.createLeaveType(createLeaveTypeDto);
  }

  @Put('type/:id')
  // @UseGuards(RolesGuard)
  // @Roles('HR Admin')  // Only HR Admin can update leave types
  async updateLeaveType(
    @Param('id') id: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto
  ) {
    return await this.leavesService.updateLeaveType(id, updateLeaveTypeDto);
  }

  // Phase 2: Leave Request Approval Endpoints

  @Post('request/:id/approve')
  // @UseGuards(RolesGuard)
  // @Roles('Manager', 'Department Head')
  async approveLeaveRequest(
    @Param('id') id: string,
    @Body() approveLeaveRequestDto: ApproveLeaveRequestDto,
    @Req() req: any
  ) {
    return await this.leavesService.approveLeaveRequest(approveLeaveRequestDto, req.user);
  }

  @Post('request/:id/reject')
  // @UseGuards(RolesGuard)
  // @Roles('Manager', 'Department Head')
  async rejectLeaveRequest(
    @Param('id') id: string,
    @Body() rejectLeaveRequestDto: RejectLeaveRequestDto,
    @Req() req: any
  ) {
    return await this.leavesService.rejectLeaveRequest(rejectLeaveRequestDto, req.user);
  }

  // @Get('request/manager/:managerId/pending')
  // @UseGuards(RolesGuard)
  // @Roles('Manager', 'Department Head')
  // async getPendingRequestsForManager(@Param('managerId') managerId: string) {
  //   return await this.leavesService.getPendingRequestsForManager(managerId);
  // }

  // Phase 2: HR Manager Endpoints

  @Post('request/finalize')
  // @UseGuards(RolesGuard)
  // @Roles('HR Manager')
  async finalizeLeaveRequest(@Body() finalizeDto: FinalizeLeaveRequestDto) {
    return await this.leavesService.finalizeLeaveRequest(finalizeDto.leaveRequestId, finalizeDto.hrUserId);
  }

  @Post('request/override')
  // @UseGuards(RolesGuard)
  // @Roles('HR Manager')
  async hrOverrideDecision(@Body() overrideDto: HrOverrideDecisionDto) {
    return await this.leavesService.hrOverrideDecision(
      overrideDto.leaveRequestId,
      overrideDto.hrUserId,
      overrideDto.overrideToApproved,
      overrideDto.overrideReason
    );
  }

  @Post('request/process-multiple')
  //@UseGuards(RolesGuard)
  //@Roles('HR Manager')
  async processMultipleLeaveRequests(@Body() processDto: ProcessMultipleRequestsDto) {
    return await this.leavesService.processMultipleLeaveRequests(
      processDto.leaveRequestIds,
      processDto.hrUserId,
      processDto.approved
    );
  }

  // Phase 2: Employee Endpoints

  @Get('balance/:employeeId')
 // @UseGuards(RolesGuard)
  //@Roles('Employee', 'Manager', 'HR Manager')
  async getEmployeeLeaveBalance(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId?: string
  ) {
    return await this.leavesService.getEmployeeLeaveBalance(employeeId, leaveTypeId);
  }

  @Post('request/:id/cancel')
  //@UseGuards(RolesGuard)
  //@Roles('Employee')
  async cancelLeaveRequest(@Param('id') id: string) {
    return await this.leavesService.cancelLeaveRequest(id);
  }

  // REQ-031: Get detailed leave balance
  @Get('balance-details/:employeeId')
  async getLeaveBalanceDetails(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId?: string
  ) {
    return await this.leavesService.getEmployeeLeaveBalance(employeeId, leaveTypeId);
  }

  // REQ-032: Get past leave requests
  @Get('past-requests/:employeeId')
  async getPastLeaveRequests(
    @Param('employeeId') employeeId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
    @Query('leaveTypeId') leaveTypeId?: string
  ) {
    return await this.leavesService.getPastLeaveRequests(employeeId, {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      status,
      leaveTypeId,
    });
  }

  // REQ-033: Filter leave history
  @Post('filter-history')
  async filterLeaveHistory(@Body() filterDto: FilterLeaveHistoryDto) {
    return await this.leavesService.filterLeaveHistory(filterDto.employeeId, filterDto);
  }

  // REQ-034: View team leave balances and upcoming leaves
  @Get('team-balances/:managerId')
  async getTeamLeaveBalances(
    @Param('managerId') managerId: string,
    @Query('upcomingFromDate') upcomingFromDate?: string,
    @Query('upcomingToDate') upcomingToDate?: string,
    @Query('departmentId') departmentId?: string
  ) {
    return await this.leavesService.getTeamLeaveBalances(
      managerId,
      upcomingFromDate ? new Date(upcomingFromDate) : undefined,
      upcomingToDate ? new Date(upcomingToDate) : undefined,
      departmentId
    );
  }

  // REQ-035: Filter team leave data
  @Post('filter-team-data')
  async filterTeamLeaveData(@Body() filterDto: FilterTeamLeaveDataDto) {
    return await this.leavesService.filterTeamLeaveData(filterDto.managerId, filterDto);
  }

  // REQ-039: Flag irregular pattern
  @Post('flag-irregular-pattern')
  async flagIrregularPattern(@Body() flagDto: FlagIrregularPatternDto) {
    return await this.leavesService.flagIrregularPattern(
      flagDto.leaveRequestId,
      flagDto.managerId,
      flagDto.flagReason,
      flagDto.notes
    );
  }

  // REQ-040: Auto accrue leave for single employee
  @Post('auto-accrue')
  async autoAccrueLeave(@Body() accrueDto: AutoAccrueLeaveDto) {
    return await this.leavesService.autoAccrueLeave(
      accrueDto.employeeId,
      accrueDto.leaveTypeId,
      accrueDto.accrualAmount,
      accrueDto.accrualType,
      accrueDto.policyId,
      accrueDto.notes
    );
  }

  // REQ-040: Auto accrue leave for all employees
  @Post('auto-accrue-all')
  async autoAccrueAllEmployees(@Body() accrueAllDto: AccrueAllEmployeesDto) {
    return await this.leavesService.autoAccrueAllEmployees(
      accrueAllDto.leaveTypeId,
      accrueAllDto.accrualAmount,
      accrueAllDto.accrualType,
      accrueAllDto.departmentId
    );
  }

  // REQ-041: Run carry-forward
  @Post('carry-forward')
  async runCarryForward(@Body() carryForwardDto: RunCarryForwardDto) {
    return await this.leavesService.runCarryForward(
      carryForwardDto.leaveTypeId,
      carryForwardDto.employeeId,
      carryForwardDto.asOfDate,
      carryForwardDto.departmentId
    );
  }

  // REQ-042: Adjust accruals
  @Post('adjust-accrual')
  async adjustAccrual(@Body() adjustmentDto: AccrualAdjustmentDto) {
    return await this.leavesService.adjustAccrual(
      adjustmentDto.employeeId,
      adjustmentDto.leaveTypeId,
      adjustmentDto.adjustmentType,
      adjustmentDto.adjustmentAmount,
      adjustmentDto.fromDate,
      adjustmentDto.toDate,
      adjustmentDto.reason,
      adjustmentDto.notes
    );
  }

  // REQ-043: Sync with payroll
  @Post('sync-payroll')
  async syncWithPayroll(@Body() syncDto: SyncWithPayrollDto) {
    return await this.leavesService.syncWithPayroll(
      syncDto.leaveRequestId,
      syncDto.syncType,
      syncDto.employeeId,
      syncDto.effectiveDate,
      syncDto.notes
    );
  }

  // Phase 2: REQ-023 - Delegate approval authority
  // @Post('delegate')
  // @UseGuards(RolesGuard)
  // @Roles('Manager', 'Department Head')
  // async delegateApprovalAuthority(@Body() delegateDto: DelegateApprovalDto) {
  //   return await this.leavesService.delegateApprovalAuthority(
  //     delegateDto.managerId,
  //     delegateDto.delegateId,
  //     delegateDto.startDate,
  //     delegateDto.endDate
  //   );
  // }
}
