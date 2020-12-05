import WebSocket from "isomorphic-ws";
import { UnimplementedOperationError } from "../errors/unimplemented-operation";
import { IAcknowledgementData } from "../operations/acknowledgement";
import { IAliasData } from "../operations/alias";
import { Answer, IAnswerData } from "../operations/answer";
import { Candidate, ICandidateData } from "../operations/candidate";
import { IGoodbyeData } from "../operations/goodbye";
import { IOfferData, Offer } from "../operations/offer";
import {
  ESIGNALING_OPCODES,
  ISignalingOperation,
  TSignalingData,
} from "../operations/operation";
import { SignalingService } from "./signaling-service";
import Emittery from "emittery";
import { Bind } from "../operations/bind";
import { BindRejectedError } from "../errors/bind-rejected";
import { ShutdownRejectedError } from "../errors/shutdown-rejected";
import { Shutdown } from "../operations/shutdown";
import { v4 } from "uuid";
import { ConnectionRejectedError } from "../errors/connection-rejected";
import { Connect } from "../operations/connect";
import { Accepting } from "../operations/accepting";
import { IAcceptData } from "../operations/accept";
import { IGreetingData } from "../operations/greeting";
import { Knock } from "../operations/knock";

export class SignalingClient extends SignalingService {
  private id = "";
  private client?: WebSocket;
  private asyncResolver = new Emittery();

  constructor(
    private address: string,
    private reconnectDuration: number,
    private subnet: string,
    private onConnect: () => Promise<void>,
    private onDisconnect: () => Promise<void>,
    private onAcknowledgement: (id: string, rejected: boolean) => Promise<void>,
    private getOffer: (
      answererId: string,
      handleCandidate: (candidate: string) => Promise<void>
    ) => Promise<string>,
    private getAnswer: (
      offererId: string,
      offer: string,
      handleCandidate: (candidate: string) => Promise<void>
    ) => Promise<string>,
    private onAnswer: (
      offererId: string,
      answererId: string,
      answer: string
    ) => Promise<void>,
    private onCandidate: (
      offererId: string,
      answererId: string,
      candidate: string
    ) => Promise<void>,
    private onGoodbye: (id: string) => Promise<void>,
    private onAlias: (id: string, alias: string, set: boolean) => Promise<void>
  ) {
    super();
  }

  async open() {
    this.logger.debug("Opening signaling client");

    this.client = new WebSocket(this.address);
    this.client.onmessage = async (operation) =>
      await this.handleOperation(await this.receive(operation.data));
    this.client.onerror = async (e) => {
      this.logger.error("WebSocket error", e);

      this.client?.terminate && this.client?.terminate(); // `terminate` does not seem to be defined in some browsers
    };
    this.client.onopen = async () => await this.handleConnect();
    this.client.onclose = async () => await this.handleDisconnect();

    this.logger.info("Server connected", { address: this.address });
  }

  async bind(alias: string) {
    this.logger.info("Binding", { id: this.id, alias });

    return new Promise<void>(async (res, rej) => {
      (async () => {
        const set = await this.asyncResolver.once(
          this.getAliasKey(this.id, alias)
        );

        set
          ? res()
          : rej(
              new BindRejectedError(this.getAliasKey(this.id, alias)).message
            );
      })();

      await this.send(this.client, new Bind({ id: this.id, alias }));
    });
  }

  async accept(alias: string): Promise<string> {
    this.logger.info("Accepting", { id: this.id, alias });

    return new Promise(async (res) => {
      (async () => {
        const clientAlias = await this.asyncResolver.once(
          this.getAcceptKey(alias)
        );

        res(clientAlias as string);
      })();

      await this.send(this.client, new Accepting({ id: this.id, alias }));
    });
  }

  async shutdown(alias: string) {
    this.logger.info("Shutting down", { id: this.id, alias });

    return new Promise<void>(async (res, rej) => {
      (async () => {
        const set = await this.asyncResolver.once(
          this.getAliasKey(this.id, alias)
        );

        set
          ? rej(
              new ShutdownRejectedError(this.getAliasKey(this.id, alias))
                .message
            )
          : res();
      })();

      await this.send(this.client, new Shutdown({ id: this.id, alias }));
    });
  }

  async connect(remoteAlias: string): Promise<string> {
    this.logger.info("Connecting", { id: this.id, remoteAlias });

    const clientConnectionId = v4();

    const clientAlias = await new Promise(async (res, rej) => {
      let i = 0;
      let alias = "";

      this.asyncResolver.on(
        this.getConnectionKey(clientConnectionId),
        (payload) => {
          const { set, alias: newAlias, isConnectionAlias } = JSON.parse(
            payload as string
          );

          if (set) {
            i = i + 1;

            if (isConnectionAlias) {
              alias = newAlias;
            }

            if (i >= 2) {
              res(alias);
            }
          } else {
            rej(
              new ConnectionRejectedError(
                this.getConnectionKey(clientConnectionId)
              ).message
            );
          }
        }
      );

      await this.send(
        this.client,
        new Connect({ id: this.id, clientConnectionId, remoteAlias })
      );
    });

    return clientAlias as string;
  }

  private async handleConnect() {
    this.logger.info("Server connected", { address: this.address });

    await this.send(this.client, new Knock({ subnet: this.subnet }));

    await this.onConnect();
  }

  private async handleDisconnect() {
    this.logger.info("Server disconnected", {
      address: this.address,
      reconnectingIn: this.reconnectDuration,
    });

    await this.onDisconnect();

    await new Promise((res) => setTimeout(res, this.reconnectDuration));

    await this.open();
  }

  private async sendCandidate(candidate: Candidate) {
    await this.send(this.client, candidate);

    this.logger.info("Sent candidate", candidate);
  }

  private async handleOperation(
    operation: ISignalingOperation<TSignalingData>
  ) {
    this.logger.debug("Handling operation", operation);

    switch (operation.opcode) {
      case ESIGNALING_OPCODES.GOODBYE: {
        const data = operation.data as IGoodbyeData;

        this.logger.info("Received goodbye", data);

        await this.onGoodbye(data.id);

        break;
      }

      case ESIGNALING_OPCODES.ACKNOWLEDGED: {
        const data = operation.data as IAcknowledgementData;

        this.id = data.id;

        this.logger.info("Received acknowledgement", { id: this.id });

        await this.onAcknowledgement(this.id, data.rejected);

        break;
      }

      case ESIGNALING_OPCODES.GREETING: {
        const data = operation.data as IGreetingData;

        const offer = await this.getOffer(
          data.answererId,
          async (candidate: string) => {
            await this.sendCandidate(
              new Candidate({
                offererId: data.answererId,
                answererId: data.offererId,
                candidate,
              })
            );

            this.logger.info("Sent candidate", data);
          }
        );

        await this.send(
          this.client,
          new Offer({
            offererId: this.id,
            answererId: data.answererId,
            offer,
          })
        );

        this.logger.info("Sent offer", {
          offererId: this.id,
          answererId: data.answererId,
          offer,
        });

        break;
      }

      case ESIGNALING_OPCODES.OFFER: {
        const data = operation.data as IOfferData;

        this.logger.info("Received offer", data);

        const answer = await this.getAnswer(
          data.offererId,
          data.offer,
          async (candidate: string) => {
            await this.sendCandidate(
              new Candidate({
                offererId: data.answererId,
                answererId: data.offererId,
                candidate,
              })
            );

            this.logger.info("Sent candidate", data);
          }
        );

        await this.send(
          this.client,
          new Answer({
            offererId: data.offererId,
            answererId: this.id,
            answer,
          })
        );

        this.logger.info("Sent answer", {
          offererId: data.offererId,
          answererId: this.id,
          answer,
        });

        break;
      }

      case ESIGNALING_OPCODES.ANSWER: {
        const data = operation.data as IAnswerData;

        this.logger.info("Received answer", data);

        await this.onAnswer(data.offererId, data.answererId, data.answer);

        break;
      }

      case ESIGNALING_OPCODES.CANDIDATE: {
        const data = operation.data as ICandidateData;

        this.logger.info("Received candidate", data);

        await this.onCandidate(data.offererId, data.answererId, data.candidate);

        break;
      }

      case ESIGNALING_OPCODES.ALIAS: {
        const data = operation.data as IAliasData;

        this.logger.info("Received alias", data);

        if (data.clientConnectionId) {
          await this.notifyConnect(
            data.clientConnectionId,
            data.set,
            data.alias,
            data.isConnectionAlias ? true : false
          );
          await this.onAlias(data.id, data.alias, data.set);
        } else {
          await this.notifyBindAndShutdown(data.id, data.alias, data.set);
          await this.onAlias(data.id, data.alias, data.set);
        }

        break;
      }

      case ESIGNALING_OPCODES.ACCEPT: {
        const data = operation.data as IAcceptData;

        this.logger.info("Received accept", data);

        await this.notifyAccept(data.boundAlias, data.clientAlias);

        break;
      }

      default: {
        throw new UnimplementedOperationError(operation.opcode);
      }
    }
  }

  private async notifyConnect(
    clientConnectionId: string,
    set: boolean,
    alias: string,
    isConnectionAlias: boolean
  ) {
    await this.asyncResolver.emit(
      this.getConnectionKey(clientConnectionId),
      JSON.stringify({ set, alias, isConnectionAlias })
    );
  }

  private async notifyBindAndShutdown(id: string, alias: string, set: boolean) {
    await this.asyncResolver.emit(this.getAliasKey(id, alias), set);
  }

  private async notifyAccept(boundAlias: string, clientAlias: string) {
    await this.asyncResolver.emit(this.getAcceptKey(boundAlias), clientAlias);
  }

  private getAliasKey(id: string, alias: string) {
    return `alias id=${id} alias=${alias}`;
  }

  private getConnectionKey(clientConnectionId: string) {
    return `connection id=${clientConnectionId}`;
  }

  private getAcceptKey(boundAlias: string) {
    return `accept alias=${boundAlias}`;
  }
}
