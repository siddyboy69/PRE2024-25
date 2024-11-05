"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;

class User {
    constructor(id = -1, uuid = "", username = "", password = "", isAdmin = false, firstName = "", lastName = "", sex = "") {
        this.id = id;
        this.uuid = uuid;
        this.username = username;
        this.password = password;
        this.isAdmin = isAdmin;
        this.firstName = firstName;
        this.lastName = lastName;
        this.sex = sex;
    }
}

exports.User = User;
