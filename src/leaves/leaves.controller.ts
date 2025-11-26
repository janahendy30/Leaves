import { Controller, Post, Get, Put, Delete, Body, Param,UseGuards} from '@nestjs/common';
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

import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('leaves')
export class LeaveController {
  constructor(private readonly leavesService: LeavesService) {}
                       //leave policy Endpoints
  @Post('policy')
  @UseGuards(RolesGuard) 
  @Roles('HR Admin')
  async createLeavePolicy(@Body() createLeavePolicyDto: CreateLeavePolicyDto) {
    return await this.leavesService.createLeavePolicy(createLeavePolicyDto);
  }

  @Get('policies')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')
  async getLeavePolicies() {
    return await this.leavesService.getLeavePolicies();
  }

  @Get('policy/:id')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')
  async getLeavePolicyById(@Param('id') id: string) {
    return await this.leavesService.getLeavePolicyById(id);
  }

  @Put('policy/:id')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')
  async updateLeavePolicy(
    @Param('id') id: string,
    @Body() updateLeavePolicyDto: UpdateLeavePolicyDto
  ) {
    return await this.leavesService.updateLeavePolicy(id, updateLeavePolicyDto);
  }

  @Delete('policy/:id')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')
  async deleteLeavePolicy(@Param('id') id: string) {
    return await this.leavesService.deleteLeavePolicy(id);
  }

                          // Leave Request Endpoints

  @Post('request')
  //@UseGuards(JwtAuthGuard)  // Only authenticated users can submit a request
  @Roles('Employee')
  async createLeaveRequest(@Body() createLeaveRequestDto: CreateLeaveRequestDto) {
    return await this.leavesService.createLeaveRequest(createLeaveRequestDto);
  }

  @Get('request/:id')
  @UseGuards(RolesGuard)
  @Roles('Employee', 'HR Admin', 'Manager')  // Employees, HR Admin, and Manager can view leave requests
  async getLeaveRequestById(@Param('id') id: string) {
    return await this.leavesService.getLeaveRequestById(id);
  }

  @Put('request/:id')
  @UseGuards( RolesGuard)
  @Roles('Employee', 'HR Admin', 'Manager')  // Employee can update their own request, HR Admin and Manager can update any
  async updateLeaveRequest(
    @Param('id') id: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto
  ) {
    return await this.leavesService.updateLeaveRequest(id, updateLeaveRequestDto);
  }

  @Delete('request/:id')
  @UseGuards(RolesGuard)
  @Roles('Employee', 'HR Admin')  // Employees can delete their own leave requests, HR Admin can delete any
  async deleteLeaveRequest(@Param('id') id: string) {
    return await this.leavesService.deleteLeaveRequest(id);
  }

  // Leave Entitlement Endpoints
  @Post('entitlement')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')  // Only HR Admin can create leave entitlement
  async createLeaveEntitlement(@Body() createLeaveEntitlementDto: CreateLeaveEntitlementDto) {
    return await this.leavesService.createLeaveEntitlement(createLeaveEntitlementDto);
  }

  @Get('entitlement/:employeeId/:leaveTypeId')
  @UseGuards(RolesGuard)
  @Roles('HR Admin', 'Manager')  // HR Admin and Manager can view entitlements
  async getLeaveEntitlement(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string
  ) {
    return await this.leavesService.getLeaveEntitlement(employeeId, leaveTypeId);
  }

  @Put('entitlement/:id')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')  // Only HR Admin can update leave entitlement
  async updateLeaveEntitlement(
    @Param('id') id: string,
    @Body() updateLeaveEntitlementDto: UpdateLeaveEntitlementDto
  ) {
    return await this.leavesService.updateLeaveEntitlement(id, updateLeaveEntitlementDto);
  }

  // Leave Adjustment Endpoints
  @Post('adjustment')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')  // Only HR Admin can create leave adjustments
  async createLeaveAdjustment(@Body() createLeaveAdjustmentDto: CreateLeaveAdjustmentDto) {
    return await this.leavesService.createLeaveAdjustment(createLeaveAdjustmentDto);
  }

  @Get('adjustment/:employeeId')
  @UseGuards(RolesGuard)
  @Roles('HR Admin', 'Manager')  // HR Admin and Manager can view leave adjustments
  async getLeaveAdjustments(@Param('employeeId') employeeId: string) {
    return await this.leavesService.getLeaveAdjustments(employeeId);
  }

  @Delete('adjustment/:id')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')  // Only HR Admin can delete leave adjustments
  async deleteLeaveAdjustment(@Param('id') id: string) {
    return await this.leavesService.deleteLeaveAdjustment(id);
  }

  // Leave Type Endpoints
  @Post('type')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')  // Only HR Admin can create leave types
  async createLeaveType(@Body() createLeaveTypeDto: CreateLeaveTypeDto) {
    return await this.leavesService.createLeaveType(createLeaveTypeDto);
  }

  @Put('type/:id')
  @UseGuards(RolesGuard)
  @Roles('HR Admin')  // Only HR Admin can update leave types
  async updateLeaveType(
    @Param('id') id: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto
  ) {
    return await this.leavesService.updateLeaveType(id, updateLeaveTypeDto);
  }
}
