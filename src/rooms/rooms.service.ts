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
      relations: ["branch", "lesson", "lesson.room", "lesson.group"],
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
    } catch (error) {
      throw new Error(`Yangi branch qo'shishda xatolik: ${error.message}`);
    }
  }

  async roomSchedule(roomId: number) {
    //  Reuse your findOne() method to get the room and its lessons
    const { room } = await this.findOne(roomId);

    // Check if lessons exist
    if (!room.lesson || room.lesson.length === 0) {
      return {
        message: "No lessons found for this room",
        success: true,
        data: [],
      };
    }

    //  Sort by date first, then by group.start_time
    const sortedLessons = room.lesson.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      // First compare by date
      if (dateA !== dateB) return dateA - dateB;

      // If dates are the same, compare by start_time (if available)
      const timeA = a.group?.start_time ? a.group.start_time : "00:00";
      const timeB = b.group?.start_time ? b.group.start_time : "00:00";

      // Compare as times
      return timeA.localeCompare(timeB);
    });

    // Return the sorted lessons
    return {
      message: "Room schedule retrieved successfully",
      success: true,
      data: sortedLessons.map((lesson) => ({
        id: lesson.id,
        date: lesson.date,
        start_time: lesson.group?.start_time || null,
        end_time: lesson.group?.end_time || null,
        group: lesson.group || null,
        room: lesson.room || null,
      })),
    };
  }
}
