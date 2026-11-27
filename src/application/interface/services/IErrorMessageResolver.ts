import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

/**
 * Port for resolving a human-readable message for an ErrorCode when persisting
 * domain/application failure records (e.g., order rejection reasons).
 */
export interface IErrorMessageResolver {
  resolve(code: ErrorCodes): string | undefined;
}
