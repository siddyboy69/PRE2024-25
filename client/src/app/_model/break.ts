export class Break {
  id: number = 0;
  shift_id: number = 0;
  breakStart: Date = new Date();
  breakEnd: Date | null = null;

  constructor(
    id: number,
    shift_id: number,
    breakStart: Date,
    breakEnd?: Date | null
  ) {
    this.id = id;
    this.shift_id = shift_id;
    this.breakStart = breakStart;
    this.breakEnd = breakEnd || null;
  }
}
