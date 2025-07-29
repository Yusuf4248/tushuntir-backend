import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Room } from "./entities/room.entity";
import { Repository } from "typeorm";
import { BranchesService } from "../branches/branches.service";
import { Branch } from "../branches/entities/branch.entity";

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(Branch) private readonly branchRepo: Repository<Branch>,
    private readonly branchesService: BranchesService
  ) {}
  async create(createRoomDto: CreateRoomDto) {
    const branch = await this.branchesService.findOne(createRoomDto.branchId);
    const newRoom = await this.roomRepo.save({
      branch: branch.branch,
      ...createRoomDto,
    });
    return {
      message: "New room created!",
      success: true,
      newRoom,
    };
  }

  async findAll() {
    const rooms = await this.roomRepo.find({ relations: ["branch"] });
    return {
      message: "All rooms",
      success: true,
      rooms,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    }
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: ["branch"],
    });
    if (!room) {
      throw new NotFoundException(`${id}-room not found`);
    }
    return {
      message: `${id}-room`,
      success: true,
      room,
    };
  }

  async update(id: number, updateRoomDto: UpdateRoomDto) {
    try {
      const existingRoom = await this.findOne(id);

      const oldBranchId = existingRoom.room.branch
        ? existingRoom.room.branch.id
        : undefined;

      const newBranchId = updateRoomDto.branchId!;

      if (newBranchId !== undefined && newBranchId !== oldBranchId) {
        await this.deleteOldBranchData(existingRoom.room);
        await this.addNewBranchData(newBranchId, existingRoom.room);
      } else if (newBranchId === undefined) {
        updateRoomDto.branchId = oldBranchId || undefined;
      }

      await this.roomRepo.update({ id }, updateRoomDto);

      const updatedRoom = await this.findOne(id);

      return {
        message: `${id}-room data updated!`,
        success: true,
        room: updatedRoom.room,
      };
    } catch (error) {
      console.log(error);
      console.log(updateRoomDto);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.roomRepo.delete(id);

    return {
      message: `${id}-room deleted!`,
      success: true,
    };
  }

  private async deleteOldBranchData(room: Room) {
    try {
      if (room.branch) {
        await this.roomRepo
          .createQueryBuilder()
          .relation(Room, "branch")
          .of(room)
          .set(null);
        console.log(`Room ${room.id} uchun eski branch o'chirildi`);
      }
    } catch (error) {
      throw new Error(`Eski branch o'chirishda xatolik: ${error.message}`);
    }
  }

  private async addNewBranchData(newBranchId: number, room: Room) {
    try {
      const newBranch = await this.branchRepo.findOne({
        where: { id: newBranchId },
      });
      if (!newBranch) {
        throw new Error(`Branch ID ${newBranchId} topilmadi`);
      }

      await this.roomRepo
        .createQueryBuilder()
        .relation(Room, "branch")
        .of(room)
        .set(newBranch);

      console.log(
        `Room ${room.id} uchun yangi branch ${newBranchId} qo'shildi`
      );
    } catch (error) {
      throw new Error(`Yangi branch qo'shishda xatolik: ${error.message}`);
    }
  }
}
