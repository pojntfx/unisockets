import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

const subject = new Subject();

const worker = {
  send(message) {
    subject.next(
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
