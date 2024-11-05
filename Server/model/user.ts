export class User {
    constructor(public id:number = -1, public uuid:string="",public username:string="",public password:string="",
                public isAdmin:boolean=false, public firstName:string="",public lastName:string="",
                public sex=""){
    }
}