

export interface IStartEmailRegistrationUseCase {
    execute(input: IStartEmailRegistrationInput): Promise<void>;
}

export interface IStartEmailRegistrationInput {
    email: string;
}