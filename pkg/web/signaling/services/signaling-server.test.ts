import { SignalingServer } from "./signaling-server";
import getPort from "get-port";

describe("SignalingServer", () => {
  const host = "localhost";
  let port: number;
  let instance: SignalingServer;

  beforeEach(async () => {
    port = await getPort();
    instance = new SignalingServer(host, port);
  });

  describe("open lifecycle", () => {
    it("should open", async () => {
      await instance.open();
    });

    afterEach(async () => {
      await instance.close();
    });
  });

  describe("positive close lifecycle", () => {
    it("should close if opened", async () => {
      await instance.close();
    });

    beforeEach(async () => {
      await instance.open();
    });
  });

  describe("negative close lifecycle", () => {
    it("should close if not opened", async () => {
      await instance.close();
    });
  });
});
