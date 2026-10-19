import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import {
  DeepPartial,
  EntityManager,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { AuthUser } from "../auth/auth-user";
import { Paginated } from "../dto/paginated.dto";
import { PaginationQueryDto } from "../dto/pagination-query.dto";
import { SortOrder, UserRole } from "../enums";
import { pgErrorOf } from "../errors/db-error";
import {
  columnSql,
  NOT_FOUND,
  resolveSchoolId,
  schoolIdExpression,
  schoolScopeOf,
} from "../scope/school-scope";

/** A foreign key in the DTO, validated on create and update. */
export interface ReferenceRule {
  entity: () => Function;
  /** Used in error messages: "Teacher 7 not found". */
  label: string;
  /** For references to users: the roles the referenced user must have. */
  roles?: UserRole[];
}

export interface CrudOptions {
  /** Singular, for messages: "Class". */
  label: string;
  /** Direct relations loaded on list and get. */
  relations?: string[];
  /** Query parameter -> entity property, filtered by equality. */
  filters?: Record<string, string>;
  /** Properties accepted by ?sort=. */
  sortable: string[];
  defaultSort?: { property: string; order: SortOrder };
  /** DTO property -> referenced table. */
  references?: Record<string, ReferenceRule>;
}

type Data = Record<string, unknown>;

const defined = (data: object): Data =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );

/**
 * Standard CRUD for one table, with school scoping:
 * super_admin sees everything, every other role only rows of its own school.
 */
export abstract class CrudService<E extends ObjectLiteral & { id: number }> {
  protected abstract readonly options: CrudOptions;

  protected constructor(protected readonly repository: Repository<E>) {}

  protected get manager(): EntityManager {
    return this.repository.manager;
  }

  protected get entity(): Function {
    return this.repository.target as Function;
  }

  protected get isGlobal(): boolean {
    return schoolScopeOf(this.entity) === "global";
  }

  async findAll(
    query: PaginationQueryDto,
    user: AuthUser,
  ): Promise<Paginated<E>> {
    const qb = this.query(user);
    const params = query as unknown as Data;
    for (const [param, property] of Object.entries(
      this.options.filters ?? {},
    )) {
      if (params[param] === undefined) continue;
      qb.andWhere(`row.${property} = :filter_${param}`, {
        [`filter_${param}`]: params[param],
      });
    }
    this.applyFilters(qb, query);

    const sort = query.sort ?? this.options.defaultSort?.property ?? "id";
    if (!this.options.sortable.includes(sort)) {
      throw new BadRequestException(
        `sort must be one of: ${this.options.sortable.join(", ")}`,
      );
    }
    const order =
      query.order ??
      (query.sort ? SortOrder.ASC : this.options.defaultSort?.order) ??
      SortOrder.ASC;
    qb.orderBy(`row.${sort}`, order);
    if (sort !== "id") qb.addOrderBy("row.id", SortOrder.ASC);

    const { page, limit } = query;
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number, user: AuthUser): Promise<E> {
    const row = await this.query(user)
      .andWhere("row.id = :id", { id })
      .getOne();
    if (!row) {
      throw new NotFoundException(`${this.options.label} ${id} not found`);
    }
    return row;
  }

  async create(dto: object, user: AuthUser): Promise<E> {
    this.assertCanWrite(user);
    const data = await this.beforeCreate(defined(dto), user);
    await this.validateReferences(data, user);
    const saved = await this.repository.save(
      this.repository.create(data as DeepPartial<E>),
    );
    return this.findOne(saved.id, user);
  }

  async update(id: number, dto: object, user: AuthUser): Promise<E> {
    this.assertCanWrite(user);
    const existing = await this.findOne(id, user);
    const data = await this.beforeUpdate(defined(dto), existing, user);
    if (Object.keys(data).length > 0) {
      await this.validateReferences(
        { ...this.referenceValues(existing), ...data },
        user,
      );
      await this.repository.update(id, data as QueryDeepPartialEntity<E>);
    }
    return this.findOne(id, user);
  }

  async remove(id: number, user: AuthUser): Promise<void> {
    this.assertCanWrite(user);
    await this.findOne(id, user);
    try {
      await this.repository.delete(id);
    } catch (error) {
      const pg = pgErrorOf(error);
      if (pg?.code === "23503") {
        throw new ConflictException(
          `${this.options.label} ${id} is still referenced from "${pg.table}"; remove or reassign those records first`,
        );
      }
      throw error;
    }
  }

  /** Base list/get query: direct relations plus the school filter for non-super-admins. */
  protected query(user: AuthUser): SelectQueryBuilder<E> {
    const qb = this.repository.createQueryBuilder("row");
    for (const relation of this.options.relations ?? []) {
      qb.leftJoinAndSelect(`row.${relation}`, relation);
    }
    if (user.role !== UserRole.SUPER_ADMIN) {
      const expression = schoolIdExpression(qb, this.entity, "row");
      if (expression) {
        qb.andWhere(`${expression} = :scopeSchoolId`, {
          scopeSchoolId: user.schoolId,
        });
      }
    }
    return qb;
  }

  /** Extra list filters that are not plain equality (search, ranges). */
  protected applyFilters(
    _qb: SelectQueryBuilder<E>,
    _query: PaginationQueryDto,
  ): void {}

  /**
   * Fills server-side fields before validation. On tables with their own school_id,
   * admins default to their own school and super_admin must name one.
   */
  protected async beforeCreate(data: Data, user: AuthUser): Promise<Data> {
    if (this.options.references?.schoolId && data.schoolId === undefined) {
      if (user.role !== UserRole.SUPER_ADMIN) {
        data.schoolId = user.schoolId;
      } else if (
        !this.repository.metadata.findColumnWithPropertyName("schoolId")
          ?.isNullable
      ) {
        throw new BadRequestException("schoolId is required");
      }
    }
    return data;
  }

  protected async beforeUpdate(
    data: Data,
    _existing: E,
    _user: AuthUser,
  ): Promise<Data> {
    return data;
  }

  protected assertCanWrite(user: AuthUser): void {
    if (this.isGlobal && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        `Only super_admin can change ${this.options.label.toLowerCase()} records`,
      );
    }
  }

  /**
   * Every referenced id must exist (404), user references must have the right role (400),
   * admins may only reference rows of their own school (404), and all school-bound
   * references must belong to the same school (400).
   */
  protected async validateReferences(
    values: Data,
    user: AuthUser,
  ): Promise<void> {
    const owners: { label: string; id: number; schoolId: number }[] = [];
    for (const [property, rule] of Object.entries(
      this.options.references ?? {},
    )) {
      const id = values[property];
      if (id === undefined || id === null) continue;
      const target = rule.entity();
      const schoolId = await resolveSchoolId(
        this.manager,
        target,
        id as number,
      );
      if (schoolId === NOT_FOUND) {
        throw new NotFoundException(`${rule.label} ${id} not found`);
      }
      if (rule.roles) {
        const role = await this.roleOf(target, id as number);
        if (!rule.roles.includes(role)) {
          throw new BadRequestException(
            `${rule.label} ${id} must be a user with role ${rule.roles.join(" or ")} (found ${role})`,
          );
        }
      }
      if (schoolId !== null)
        owners.push({ label: rule.label, id: id as number, schoolId });
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      const foreign = owners.find((owner) => owner.schoolId !== user.schoolId);
      if (foreign) {
        throw new NotFoundException(`${foreign.label} ${foreign.id} not found`);
      }
    }
    if (new Set(owners.map((owner) => owner.schoolId)).size > 1) {
      throw new BadRequestException(
        `All referenced records must belong to the same school (${owners
          .map(
            (owner) => `${owner.label} ${owner.id}: school ${owner.schoolId}`,
          )
          .join(", ")})`,
      );
    }
  }

  private referenceValues(existing: E): Data {
    return Object.fromEntries(
      Object.keys(this.options.references ?? {}).map((property) => [
        property,
        existing[property],
      ]),
    );
  }

  private async roleOf(entity: Function, id: number): Promise<UserRole> {
    const qb = this.manager
      .createQueryBuilder(entity, "target")
      .where("target.id = :id", { id });
    const row = await qb
      .select(columnSql(qb, entity, "target", "role"), "role")
      .getRawOne<{ role: UserRole }>();
    return row!.role;
  }
}
