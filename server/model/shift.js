"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shift = void 0;
class Shift {
    constructor(id, userId, shiftStart, shiftEnd, breakStart, breakEnd) {
        this.id = id;
        this.userId = userId;
        this.shiftStart = shiftStart;
        this.shiftEnd = shiftEnd;
        this.breakStart = breakStart;
        this.breakEnd = breakEnd;
    }
}
exports.Shift = Shift;
