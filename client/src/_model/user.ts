export class User {
  id: number = 0;
  uuid: string = "";
  username: string = "";
  password: string = "";
  isAdmin: boolean = false;
  firstname: string = "";
  lastname: string = "";
  sex: string = "";

  constructor(
    id: number,
    uuid: string,
    username: string,
    password: string,
    isAdmin: boolean,
    firstname: string,
    lastname: string,
    sex: string
  ) {
    this.id = id;
    this.uuid = uuid;
    this.username = username;
    this.password = password;
    this.isAdmin = isAdmin;
    this.firstname = firstname;
    this.lastname = lastname;
    this.sex = sex;
  }
}
