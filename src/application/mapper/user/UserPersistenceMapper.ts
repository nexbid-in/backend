import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";
import { UserPersistenceDTO } from "../../dto/internal/user-persistence.dto";

export class UserPersistenceMapper {

  static toPrisma(user: User): UserPersistenceDTO {
    return {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password,
      mobile: user.mobile ?? null,
      profileImage: user.profileImage ?? null,
      googleId: user.googleId ?? null,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    };
  }

  static toDomain(raw: UserPersistenceDTO): User {
    return User.create({
        id: raw.id,
        email: Email.create(raw.email),
        firstName: raw.firstName,
        lastName: raw.lastName,
        password: raw.password,
        mobile: raw.mobile ?? undefined,
        profileImage: raw.profileImage ?? undefined,
        googleId: raw.googleId ?? undefined,
        isBlocked: raw.isBlocked,
        createdAt: raw.createdAt,
    });
 }

}
