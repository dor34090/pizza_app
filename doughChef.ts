process.on(`message`, (msg) => {
  console.log(
    `(Dough chef number ${process.argv[2]}:)Message from manager: ${msg}`
  );
  setTimeout(() => {
    console.log(
      `(Dough chef number ${process.argv[2]}:) Order received! Starting the doughinator`
    );
  }, 0);

  setTimeout(() => {
    console.log(`(Dough chef number ${process.argv[2]}:) Dough finished in 7s`);
    process.exit();
  }, 7000);
});
