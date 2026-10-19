import { PartialType } from "@nestjs/swagger";
import { CreateTopicMasteryDto } from "./create-topic-mastery.dto";

export class UpdateTopicMasteryDto extends PartialType(CreateTopicMasteryDto) {}
