import { IUserIdGenerator } from "../../../application/interface/services/IUserIdGenerator";


export class UserIdGenerator implements IUserIdGenerator {
     private SYSTEM_PREFIX = "X";
     private RANDOM_DIGITS = 5;

     generate(fullName: string): string {
         const letter = this.extractFirstLetter(fullName);
         const random = this.randomNumber();

         return `${this.SYSTEM_PREFIX}${letter}${random}`;
     }

     private extractFirstLetter(name: string): string {
        const trimmed = name.trim();

        for (const char of trimmed) {
            if (/[a-zA-Z]/.test(char)) {
                return char.toUpperCase();
            }
        }

        return "X";
     }

     private randomNumber(): string {
        const min = Math.pow(10, this.RANDOM_DIGITS - 1);
        const max = Math.pow(10, this.RANDOM_DIGITS) - 1;
        return Math.floor(min + Math.random() * (max - min + 1)).toString();
     }
}