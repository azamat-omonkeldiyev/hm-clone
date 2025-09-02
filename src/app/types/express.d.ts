

import { UserType } from "../modules/user/users.type";

declare global {
    namespace Express {
        interface Request {
            user?: UserType;
        }
    }
}
