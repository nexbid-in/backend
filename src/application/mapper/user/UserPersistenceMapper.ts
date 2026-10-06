import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";
import { UserPersistenceDTO } from "../../dto/internal/UserPersistenceDTO";

export class UserPersistenceMapper {

  static toPrisma(user: User): UserPersistenceDTO {
    return {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password,
      role: user.role,
      mobile: user.mobile,
      profileImage: user.profileImage,
      googleId: user.googleId,
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
        role: raw.role,
        mobile: raw.mobile,
        profileImage: raw.profileImage,
        googleId: raw.googleId,
        isBlocked: raw.isBlocked,
        createdAt: raw.createdAt,
    });
 }

}
