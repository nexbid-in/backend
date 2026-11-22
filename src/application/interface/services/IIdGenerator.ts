export type IdPrefix = "ORD" | "TOP";

export interface IIdGenerator {
  generate(prefix: IdPrefix): string;
}
