import {User} from "./user";
export class Shift{
    constructor(
        public id: number =-1,
        public user: User = new User(),
        public shiftStart: Date = new Date(Date.now()),
        public shiftEnd: Date = new Date(Date.now()),
        public breakStart: Date = new Date(Date.now()),
        public breakEnd: Date = new Date(Date.now())
    ) {
    }
}
