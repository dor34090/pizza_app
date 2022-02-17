//imports
const { fork } = require(`child_process`);
const input = require(`readline-sync`);
var Pizza = require(`./Pizza`);
require("events").EventEmitter.defaultMaxListeners = 25;
//setting up db
// var mongoose = require("mongoose");
// mongoose
//   .connect("mongodb://mongodb:27017", { useNewUrlParser: true })
//   .then(() => console.log("(MongoDB Connected)"))
//   .catch((err) => console.log(err));
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://mongodb:27017";
const client = new MongoClient(url);
client.connect();
const database = client.db("mydb");
//child processes
let doughChef1 = fork(`doughChef.ts`, [1]);
let doughChef2 = fork(`doughChef.ts`, [2]);
let toppingChefs = [
  fork(`toppingChef.ts`, [1]),
  fork(`toppingChef.ts`, [2]),
  fork(`toppingChef.ts`, [3]),
];
let oven;
let waiters = [fork(`waiter.ts`, [1]), fork(`waiter.ts`, [2])];
//local variables
let isValid = false;
let availableChefs = [true, true, true];
let toppings;
let toppingSum = 0;
let timeSum = 0;
let pizzaAmount;
let order;
let amountMadeDough = 0;
let amountMadeToppings = 0;
let answer;
let isOvenFree = true;
let availableWaiters = [true, true];
let readyPizzas = [];
let pizzasServed = 0;

//each order is an array comprised of pizza class objects
//a pizza class is definec by the amount of toppings it has, if it's ready to be served and start and stop time

//function to start dough making procedure
//starts only one chef if there's only one dough
//if more than one is needed, both are run in a pair with doughchef2 taking the lead to prevent double-calling
const makeDough = () => {
  if (order.length === 1) {
    doughChef2.send(`1 pizza dough!`);
    order[0].start();
    listenDough();
  } else {
    doughChef2.send(`1 pizza dough!`);
    order[0].start();
    setTimeout(
      () => {
        doughChef1.send(`1 pizza dough!`);
        order[1].start();
        listenDough();
      },
      order.length >= 8 ? 0 : 5
    );
  }
};

//the exit listeners for the dough chef (once again, timed to prevent double calling)
//increases the number of doughs prepared and sends them to the toppings chefs
//once they've reached the last dough, no new listeners are added
const listenDough = () => {
  if (amountMadeDough >= order.length) {
    makeToppings(order[amountMadeDough - 1]);
    return 0;
  }
  doughChef2.on(`exit`, () => {
    amountMadeDough++;
    if (amountMadeDough < order.length - 1) {
      doughChef2 = fork(`doughChef.ts`, [2]);
      doughChef2.send(`1 pizza dough!`);
      order[amountMadeDough].start();
      makeToppings(order[amountMadeDough - 1]);
      setTimeout(() => {
        listenDough();
      }, 25);
    } else {
      makeToppings(order[amountMadeDough - 1]);
      order[amountMadeDough - 1].start();
    }
  });
  doughChef1.on(`exit`, () => {
    amountMadeDough++;
    if (amountMadeDough < order.length - 1) {
      setTimeout(() => {
        doughChef1 = fork(`doughChef.ts`, [1]);
        doughChef1.send(`1 pizza dough!`);
      }, 0);
      order[amountMadeDough].start();
      makeToppings(order[amountMadeDough - 1]);
    } else {
      makeToppings(order[amountMadeDough - 1]);
      order[amountMadeDough - 1].start();
    }
  });
};

//managing and calling the toppings chefs
//each toppings chef has a corresponding child process and availability array to prevent order crossings
//if there are less than 3 pizzas, the chefs divide the toppings of all pizzas between them
//to prevent overload, once there are more than 3 pizzas each chef works on his own pizza alone
const makeToppings = (pizza) => {
  toppings = pizza ? pizza.toppings : [];
  for (let i = 0; i < 3; i++) {
    if (availableChefs[i]) {
      if (toppings.length >= 2) {
        availableChefs[i] = false;
        toppingChefs[i] = fork(`toppingChef.ts`, [i + 1]);
        toppingChefs[i].send(2);
        toppings.shift();
        toppings.shift();
        listenTopping(i, toppings, pizza);
        if ((order.length < 3 && toppings.length > 2) || toppings.length === 1)
          continue;
        return;
      } else if (toppings.length === 1) {
        availableChefs[i] = false;
        toppingChefs[i] = fork(`toppingChef.ts`, [i + 1]);
        toppingChefs[i].send(1);
        toppings.shift();
        listenTopping(i, toppings, pizza);
      } else {
        availableChefs[i] = true;
        return;
      }
    } else if (toppings.length > 0) {
      listenTopping(i, toppings, pizza);
    }
  }
};

//listeners for the toppings chefs
//receives the index of the topping chef in question (since they are in an array), and runs according to the number of toppings in the pizza
const listenTopping = (i, toppings, pizza) => {
  if (!toppingChefs[i].listeners(`exit`)[0]) {
    toppingChefs[i].on(`exit`, () => {
      if (toppings.length >= 2) {
        availableChefs[i] = false;
        toppingChefs[i] = fork(`toppingChef.ts`, [i + 1]);
        toppingChefs[i].send(2);
        toppings.shift();
        toppings.shift();
        listenTopping(i, toppings, pizza);
      } else if (toppings.length == 1) {
        availableChefs[i] = false;
        toppingChefs[i] = fork(`toppingChef.ts`, [i + 1]);
        toppingChefs[i].send(1);
        toppings.shift();
        listenTopping(i, toppings, pizza);
      } else {
        availableChefs[i] = true;
        bakePizza(pizza);
        return;
      }
    });
  } else {
    toppingChefs[i].on(`exit`, () => {
      if (availableChefs[i]) {
        if (toppings.length >= 2) {
          availableChefs[i] = false;
          toppingChefs[i] = fork(`toppingChef.ts`, [i + 1]);
          toppingChefs[i].send(2);
          toppings.shift();
          toppings.shift();
          listenTopping(i, toppings, pizza);
        } else if (toppings.length == 1) {
          availableChefs[i] = false;
          toppingChefs[i] = fork(`toppingChef.ts`, [i + 1]);
          toppingChefs[i].send(1);
          toppings.shift();
          listenTopping(i, toppings, pizza);
        } else {
          availableChefs[i] = true;
          bakePizza(pizza);
        }
      } else listenTopping(i, toppings, pizza);
    });
  }
};

//managing the oven
//the oven bakes the pizza it receives in the args and then pushes it into an array of ready pizzas
const bakePizza = (pizza) => {
  if (!pizza.isReady) {
    if (isOvenFree) {
      isOvenFree = false;
      oven = fork(`oven.ts`);
      oven.send(`1 pizza!`);
      oven.on(`exit`, () => {
        pizza.ready();
        readyPizzas.push(pizza);
        isOvenFree = true;
        servePizza();
      });
    } else if (oven.listeners(`exit`)[0]) {
      oven.on(`exit`, () => {
        if (isOvenFree && !pizza.isReady) {
          isOvenFree = false;
          oven = fork(`oven.ts`);
          oven.send(`1 pizza!`);
          oven.on(`exit`, () => {
            pizza.ready();
            readyPizzas.push(pizza);
            isOvenFree = true;
            servePizza();
          });
        } else bakePizza(pizza);
      });
    }
  }
};

//managing the waiters
//similar to the toppings chefs, each waiter has a place in a process array and an availability array
const servePizza = () => {
  if (readyPizzas.length >= 1 && availableWaiters[1]) {
    waiters[1] = fork(`waiter.ts`, [2]);
    waiters[1].send(`1 pizza to serve!`);
    availableWaiters[1] = false;
    listenWaiter(1);
  } else if (readyPizzas.length > 1 && availableWaiters[0]) {
    waiters[0] = fork(`waiter.ts`, [1]);
    waiters[0].send(`1 pizza to serve!`);
    availableWaiters[0] = false;
    listenWaiter(0);
  }
};

//listeners for the waiters
//to prevent a waiter serving a pizza that's already in process, a waiter only carries out a pizza once both waiters are known to be free
const listenWaiter = (i) => {
  waiters[i].on(`exit`, () => {
    readyPizzas[0].finish();
    readyPizzas.shift();
    pizzasServed++;
    if (
      readyPizzas.length > 0 &&
      availableWaiters[i] &&
      availableWaiters[i == 1 ? 0 : 1]
    ) {
      availableWaiters[i] = false;
      waiters[i] = fork(`waiter.ts`, [2]);
      waiters[i].send(`1 pizza to serve!`);
      setTimeout(() => {
        listenWaiter(i);
      }, 25);
    } else if (pizzasServed === order.length) {
      printReport();
    } else availableWaiters[i] = true;
  });
};

//printing the final report
//each pizza object has a start and end time to calculate for each and for the total amount of time the order took
const printReport = async () => {
  let report = "";
  for (let k = 0; k < order.length; k++) {
    timeSum = timeSum + (order[k].endTime - order[k].startTime) / 1000;
    report += `Pizza no.${k + 1} was prepared in ${
      (order[k].endTime - order[k].startTime) / 1000
    } seconds.
         `;
  }
  report += `Entire order took ${
    (order[order.length - 1].endTime - order[0].startTime) / 1000
  } seconds.
  `;
  report += "Thank you for coming to `Hey I'm walking here!` pizza!";
  console.log(report);
  const result = await database
    .collection("reports")
    .insertOne({ Report: report });
  console.log(`Report saved with the id: ${result.insertedId}`);
  process.exit();
};

//the opening function that orders the pizza using basic input
//to prevent an overload of listeners from all stations, a maximum of 25 toppings are allowed in one order
//once a correct input has been received, the process may begin with a calling of the dough chef function
const orderPizza = () => {
  while (!isValid) {
    answer = input.question(`How many pizzas are we making today boss? `);
    isValid = answer > 0 && Number.isFinite(+answer) ? true : false;
    console.log(
      isValid
        ? `Roger! ${answer} pizzas! How many topping for each one?`
        : "Very funny boss"
    );
  }
  pizzaAmount = +answer;
  order = new Array(+pizzaAmount);
  for (let i = 0; i < pizzaAmount; i++) {
    let res = input.question(`For pizza no.${i + 1}: `);
    if (Number.isFinite(+res) && res > 0) {
      toppingSum = toppingSum + +res;
      if (toppingSum >= 25) {
        console.log("Whoa boss dial it down you tryna get us killed?!");
        toppingSum = 0;
        isValid = false;
        i = -2;
        orderPizza();
        return;
      }
      order[i] = new Pizza["default"](+res);
    } else {
      console.log("Very funny boss");
      i--;
    }
  }
  makeDough();
};

orderPizza();
