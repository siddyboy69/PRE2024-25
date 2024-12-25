export class Shift {
    id: number;
    userId: number;
    shiftStart: Date;
    shiftEnd?: Date;
    breakStart?: Date;
    breakEnd?: Date;
    constructor(
        id: number,
        userId: number,
        shiftStart: Date,
        shiftEnd?: Date,
        breakStart?: Date,
        breakEnd?: Date
    ) {
        this.id = id;
        this.userId = userId;
        this.shiftStart = shiftStart;
        this.shiftEnd = shiftEnd;
        this.breakStart = breakStart;
        this.breakEnd = breakEnd;
    }
}
