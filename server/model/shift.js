"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shift = void 0;
const user_1 = require("./user")
class Shift{
    constructor(id = -1, user = new user_1.User(), shiftStart = new Date(Date.now()), shiftEnd = new Date(Date.now()), breakStart = new Date(Date.now()), breakEnd = new Date(Date.now())) {
        this.id = id;
        this.user = user;
        this.shiftStart = shiftStart;
        this.shiftEnd = shiftEnd;
        this.breakStart = breakStart;
        this.breakEnd = breakEnd;
    }
}
exports.Shift = Shift;