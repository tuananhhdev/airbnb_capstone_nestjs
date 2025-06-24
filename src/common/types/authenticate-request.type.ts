import { Request } from "express";

export interface AuthenticateRequest extends Request {
    user: {
        id: number;
        roleId: number;
        fullName?: string;
        email?: string;
        Roles?: any;
        [key: string]: any; // Allow additional properties
    };
}

