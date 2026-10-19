import "reflect-metadata";
import { EntityManager, ObjectLiteral, SelectQueryBuilder } from "typeorm";

/**
 * How a table reaches its school. Admins only see rows whose school equals their own.
 * - "global": shared by all schools (subjects, textbooks, questions...)
 * - { column }: the row has a school id column (classes.school_id, users.school_id)
 * - { via, target }: follow a ManyToOne relation and use the target's rule
 * - { expression }: custom SQL expression for the school id (quizzes)
 */
export type SchoolScopeRule =
  | "global"
  | { column: string }
  | { via: string; target: () => Function }
  | {
      expression: (
        qb: SelectQueryBuilder<ObjectLiteral>,
        alias: string,
        nextAlias: () => string,
      ) => string;
    };

const SCHOOL_SCOPE = Symbol("schoolScope");

export const SchoolScope =
  (rule: SchoolScopeRule): ClassDecorator =>
  (target) =>
    Reflect.defineMetadata(SCHOOL_SCOPE, rule, target);

export function schoolScopeOf(entity: Function): SchoolScopeRule {
  const rule = Reflect.getMetadata(SCHOOL_SCOPE, entity) as
    | SchoolScopeRule
    | undefined;
  if (!rule) throw new Error(`${entity.name} has no @SchoolScope rule`);
  return rule;
}

/** Quoted SQL for a property of the entity behind `alias`. */
export function columnSql<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  entity: Function,
  alias: string,
  property: string,
): string {
  const column = qb.connection
    .getMetadata(entity)
    .findColumnWithPropertyName(property);
  if (!column) throw new Error(`${entity.name}.${property} is not a column`);
  return `${qb.escape(alias)}.${qb.escape(column.databaseName)}`;
}

/**
 * Adds the joins needed to reach the row's school and returns the SQL expression
 * for its school id, or null when the table is global.
 */
export function schoolIdExpression<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  entity: Function,
  alias: string,
): string | null {
  let counter = 0;
  const nextAlias = () => `${alias}_scope${++counter}`;
  const walk = (current: Function, currentAlias: string): string | null => {
    const rule = schoolScopeOf(current);
    if (rule === "global") return null;
    if ("column" in rule)
      return columnSql(qb, current, currentAlias, rule.column);
    if ("via" in rule) {
      const joined = nextAlias();
      qb.leftJoin(`${currentAlias}.${rule.via}`, joined);
      return walk(rule.target(), joined);
    }
    return rule.expression(
      qb as unknown as SelectQueryBuilder<ObjectLiteral>,
      currentAlias,
      nextAlias,
    );
  };
  return walk(entity, alias);
}

export const NOT_FOUND = Symbol("notFound");

/** The school id of one row: a number, null (global or no school), or NOT_FOUND. */
export async function resolveSchoolId(
  manager: EntityManager,
  entity: Function,
  id: number,
): Promise<number | null | typeof NOT_FOUND> {
  const qb = manager
    .createQueryBuilder(entity, "target")
    .where("target.id = :id", { id });
  const expression = schoolIdExpression(qb, entity, "target");
  qb.select(expression ?? "NULL", "school_id");
  const row = await qb.getRawOne<{ school_id: number | null }>();
  return row ? row.school_id : NOT_FOUND;
}
