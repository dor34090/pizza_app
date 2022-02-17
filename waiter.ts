process.on(`message`, (msg) => {
  console.log(
    `(Waiter number ${process.argv[2]}:)Message from manager: ${msg}`
  );
  setTimeout(() => {
    console.log(
      `(Waiter number ${process.argv[2]}:) Order received! Starting the waitinator`
    );
  }, 0);

  setTimeout(() => {
    console.log(`(Waiter number ${process.argv[2]}:) Pizza served in 5s`);
  }, 5000);

  setTimeout(() => {
    console.log(`(Waiter number ${process.argv[2]}:) Ready for next order!`);
    process.exit();
  }, 10025);
});
