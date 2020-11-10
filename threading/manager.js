import { spawn, Thread, Worker } from "threads";

const main = async () => {
  const worker = await spawn(new Worker("./worker.js"));

  worker.recv().subscribe((response) => {
    console.log(new TextDecoder().decode(response));
  });

  await worker.send(new TextEncoder().encode("Hello from client!"));
  await worker.send(new TextEncoder().encode("Nice ..."));
  await worker.send(new TextEncoder().encode("Omegalul!"));

  await Thread.terminate(worker);
};

main();
