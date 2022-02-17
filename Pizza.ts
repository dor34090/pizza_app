class Pizza {
  isReady: boolean;

  toppings: any[];

  startTime: number;

  endTime: number;

  constructor(topNum: number) {
    this.isReady = false;
    this.toppings = new Array(topNum);
  }

  ready() {
    this.isReady = true;
  }

  finish() {
    this.endTime = Date.now();
  }

  start() {
    this.startTime = Date.now();
  }
}

export default Pizza;
