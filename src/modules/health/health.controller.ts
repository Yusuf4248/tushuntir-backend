import { Controller, Get, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { DataSource } from "typeorm";
import { Public } from "../../common/decorators/public.decorator";
import { HealthDto } from "./health.dto";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: "Liveness for the host's health check (no login)",
    description:
      "200 when the database answers and the pgvector extension is installed; 503 otherwise.",
  })
  @ApiOkResponse({ type: HealthDto })
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthDto> {
    let database = false;
    let vector = false;
    try {
      const [row] = await this.dataSource.query(
        `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS vector`,
      );
      database = true;
      vector = row?.vector === true;
    } catch {
      // database unreachable: reported below
    }
    const ok = database && vector;
    if (!ok) res.status(503);
    return { status: ok ? "ok" : "error", database, vector };
  }
}
