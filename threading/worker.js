import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";
import EventEmitter from "events";

const threadConnection = new EventEmitter();

const subject = new Subject();

threadConnection.on("message", (message) => subject.next(message));

const worker = {
  send(message) {
    threadConnection.emit(
      "message",
      new TextEncoder().encode(
        "You've send: " + new TextDecoder().decode(message)
      )
    );
  },
  recv() {
    return Observable.from(subject);
  },
};

expose(worker);
