const putTopping = () => {
  setTimeout(() => {
    console.log(
      ` (Topping Chef number ${process.argv[2]}:) Order received! Starting the toppinator`
    );
  }, 0);

  setTimeout(() => {
    console.log(
      `(Topping Chef number ${process.argv[2]}:) Topping finished in 4s`
    );
  }, 4000);
};

process.on(`message`, (msg) => {
  console.log(
    `(Topping Chef number ${process.argv[2]}:) message from manager: ${msg} toppings pizza!`
  );

  if (+msg === 1) {
    putTopping();
    setTimeout(() => {
      process.exit();
    }, 4025);
  } else {
    putTopping();
    setTimeout(() => {
      putTopping();
    }, 4000);
    setTimeout(() => {
      process.exit();
    }, 8025);
  }
});
