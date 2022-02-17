process.on(`message`, (msg) => {
  console.log(`(oven:) Message from manager: ${msg}`);

  setTimeout(() => {
    console.log("(oven:) 1 pizza! Starting the fire-inator");
  }, 0);

  setTimeout(() => {
    console.log("(oven:) Pizza finished in 10s");
    process.exit();
  }, 10000);
});
