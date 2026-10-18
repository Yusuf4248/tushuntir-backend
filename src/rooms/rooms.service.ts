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
import { SchoolsService } from "../modules/school/schools/schools.service";
import { School } from "../modules/school/schools/entities/school.entity";

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    private readonly schoolsService: SchoolsService
  ) {}
  async create(createRoomDto: CreateRoomDto) {
    const school = await this.schoolsService.findOne(createRoomDto.schoolId);
    const newRoom = await this.roomRepo.save({
      school: school.school,
      ...createRoomDto,
    });
    return {
      message: "New room created!",
      success: true,
      newRoom,
    };
  }

  async findAll() {
    const rooms = await this.roomRepo.find({ relations: ["school"] });
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
      relations: ["school", "lesson", "lesson.room", "lesson.group"],
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

      const oldSchoolId = existingRoom.room.school
        ? existingRoom.room.school.id
        : undefined;

      const newSchoolId = updateRoomDto.schoolId!;

      if (newSchoolId !== undefined && newSchoolId !== oldSchoolId) {
        await this.deleteOldSchoolData(existingRoom.room);
        await this.addNewSchoolData(newSchoolId, existingRoom.room);
      } else if (newSchoolId === undefined) {
        updateRoomDto.schoolId = oldSchoolId || undefined;
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

  private async deleteOldSchoolData(room: Room) {
    try {
      if (room.school) {
        await this.roomRepo
          .createQueryBuilder()
          .relation(Room, "school")
          .of(room)
          .set(null);
      }
    } catch (error) {
      throw new Error(`Eski school o'chirishda xatolik: ${error.message}`);
    }
  }

  private async addNewSchoolData(newSchoolId: number, room: Room) {
    try {
      const newSchool = await this.schoolRepo.findOne({
        where: { id: newSchoolId },
      });
      if (!newSchool) {
        throw new Error(`School ID ${newSchoolId} topilmadi`);
      }

      await this.roomRepo
        .createQueryBuilder()
        .relation(Room, "school")
        .of(room)
        .set(newSchool);
    } catch (error) {
      throw new Error(`Yangi school qo'shishda xatolik: ${error.message}`);
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
