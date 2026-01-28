

export interface IPinHashService {
    hash(pin: string): Promise<string>;
}