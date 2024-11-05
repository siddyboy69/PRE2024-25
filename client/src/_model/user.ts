export class User {
  id: number = 0;
  uuid: string = "";
  username: string = "";
  password: string = "";
  isAdmin: boolean = false;
  firstName: string = "";
  lastName: string = "";
  sex: string = "";

  constructor(
    id: number,
    uuid: string,
    username: string,
    password: string,
    isAdmin: boolean,
    firstName: string,
    lastName: string,
    sex: string
  ) {
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
