import getPort from "get-port";
import WebSocket from "isomorphic-ws";
import { IAcknowledgementData } from "../operations/acknowledgement";
import { Knock } from "../operations/knock";
import {
  ESIGNALING_OPCODES,
  ISignalingOperation,
} from "../operations/operation";
import { SignalingServer } from "./signaling-server";

describe("SignalingServer", () => {
  const host = "localhost";
  let port: number;
  let signalingServer: SignalingServer;

  beforeEach(async () => {
    port = await getPort();
    signalingServer = new SignalingServer(host, port);
  });

  describe("lifecycle", () => {
    describe("open", () => {
      it("should open", async () => {
        await signalingServer.open();
      });

      afterEach(async () => {
        await signalingServer.close();
      });
    });

    describe("close", () => {
      beforeEach(async () => {
        await signalingServer.open();
      });

      it("should close", async () => {
        await signalingServer.close();
      });
    });
  });

  describe("operations", () => {
    let client: WebSocket;

    beforeEach(async (done) => {
      await signalingServer.open();

      client = new WebSocket(`ws://${host}:${port}`);

      client.once("open", done);
    });

    afterEach(async () => {
      await signalingServer.close();
    });

    describe("KNOCK", () => {
      it("should send back non-rejected, valid ACKNOWLEDGEMENT as first message if there is no subnet overflow", async (done) => {
        client.onmessage = (msg) => {
          const operation = JSON.parse(
            msg.data as string
          ) as ISignalingOperation<IAcknowledgementData>;

          expect(operation.opcode).toBe(ESIGNALING_OPCODES.ACKNOWLEDGED);
          expect(operation.data.rejected).toBe(false);

          const lastOctet = parseInt(operation.data.id.split(".")[3]);
          expect(lastOctet).toBeGreaterThanOrEqual(0);
          expect(lastOctet).toBeLessThanOrEqual(255);

          done();
        };

        client.send(
          JSON.stringify(
            new Knock({
              subnet: "10.0.0",
            })
          )
        );
      });

      it("should send back non-reject, valid ACKNOWLEDGEMENTs if there is no subnet overflow", async (done) => {
        let responses = 0;

        client.onmessage = (msg) => {
          const operation = JSON.parse(
            msg.data as string
          ) as ISignalingOperation<IAcknowledgementData>;

          if (operation.opcode === ESIGNALING_OPCODES.ACKNOWLEDGED) {
            expect(operation.opcode).toBe(ESIGNALING_OPCODES.ACKNOWLEDGED);
            expect(operation.data.rejected).toBe(false);

            const lastOctet = parseInt(operation.data.id.split(".")[3]);
            expect(lastOctet).toBeGreaterThanOrEqual(0);
            expect(lastOctet).toBeLessThanOrEqual(255);

            responses++;
            if (responses == 255) {
              done();
            }
          }
        };

        // Request the maximum amount of IPs (255)
        for (let requests = 0; requests <= 255; requests++) {
          client.send(
            JSON.stringify(
              new Knock({
                subnet: "10.0.0",
              })
            )
          );
        }
      });

      it("should send back rejected, valid ACKNOWLEDGEMENT if there is a subnet overflow", async (done) => {
        let responses = 0;

        client.onmessage = (msg) => {
          const operation = JSON.parse(
            msg.data as string
          ) as ISignalingOperation<IAcknowledgementData>;

          if (operation.opcode === ESIGNALING_OPCODES.ACKNOWLEDGED) {
            if (responses > 255) {
              expect(operation.opcode).toBe(ESIGNALING_OPCODES.ACKNOWLEDGED);
              expect(operation.data.rejected).toBe(true);

              done();
            }

            responses++;
          }
        };

        // Provoke a overflow (255 is the max value)
        for (let requests = 0; requests <= 256; requests++) {
          client.send(
            JSON.stringify(
              new Knock({
                subnet: "10.0.0",
              })
            )
          );
        }
      });
    });
  });
});
