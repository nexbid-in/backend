import { User } from "../../../domain/entities/User";
import { UserPersistenceDTO } from "../../dto/internal/user-persistence.dto";

export class UserPersistenceMapper {

  static toPrisma(user: User): UserPersistenceDTO {
    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      fullName: user.fullName,
      dob: user.dob,
      pinHash: user.pinHash,
      gender: user.gender ?? null,
      incomeRange: user.incomeRange ?? null,
      occupation: user.occupation ?? null,
      permanentAddress: user.permanentAddress ?? null,
      correspondenceAddress: user.correspondenceAddress ?? null,
      profileImage: user.profileImage ?? null,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
    };
  }


  static toDomain(raw: UserPersistenceDTO): User {
    return User.create({
        id: raw.id,
        email: raw.email,
        mobile: raw.mobile,
        fullName: raw.fullName,
        dob: raw.dob,
        pinHash: raw.pinHash,
        gender: raw.gender ?? undefined,
        incomeRange: raw.incomeRange ?? undefined,
        occupation: raw.occupation ?? undefined,
        permanentAddress: raw.permanentAddress ?? undefined,
        correspondenceAddress: raw.correspondenceAddress ?? undefined,
        profileImage: raw.profileImage ?? undefined,
        isActive: raw.isActive,
        isBlocked: raw.isBlocked,
        isBanned: raw.isBanned,
        createdAt: raw.createdAt,
    });
 }

}
