// Track https://github.com/node-webrtc/node-webrtc/pull/656 for when we can remove this

/// <reference lib="dom" />

declare module "wrtc" {
  export declare var MediaStream: {
    prototype: MediaStream;
    new (): MediaStream;
    new (stream: MediaStream): MediaStream;
    new (tracks: MediaStreamTrack[]): MediaStream;
    new ({ id }: { id: string }): MediaStream;
  };

  export declare var MediaStreamTrack: {
    prototype: MediaStreamTrack;
    new (): MediaStreamTrack;
  };

  export declare var RTCDataChannel: {
    prototype: RTCDataChannel;
    new (): RTCDataChannel;
  };

  export declare var RTCDataChannelEvent: {
    prototype: RTCDataChannelEvent;
    new (
      type: string,
      eventInitDict: RTCDataChannelEventInit
    ): RTCDataChannelEvent;
  };

  export declare var RTCDtlsTransport: {
    prototype: RTCDtlsTransport;
    new (): RTCDtlsTransport;
  };

  export declare var RTCIceCandidate: {
    prototype: RTCIceCandidate;
    new (candidateInitDict?: RTCIceCandidateInit): RTCIceCandidate;
  };

  export declare var RTCIceTransport: {
    prototype: RTCIceTransport;
    new (): RTCIceTransport;
  };

  export type ExtendedRTCConfiguration = RTCConfiguration & {
    portRange?: {
      min: number;
      max: number;
    };
    sdpSemantics?: "plan-b" | "unified-plan";
  };

  export declare var RTCPeerConnection: {
    prototype: RTCPeerConnection;
    new (configuration?: ExtendedRTCConfiguration): RTCPeerConnection;
    generateCertificate(
      keygenAlgorithm: AlgorithmIdentifier
    ): Promise<RTCCertificate>;
    getDefaultIceServers(): RTCIceServer[];
  };

  export declare var RTCPeerConnectionIceEvent: {
    prototype: RTCPeerConnectionIceEvent;
    new (
      type: string,
      eventInitDict?: RTCPeerConnectionIceEventInit
    ): RTCPeerConnectionIceEvent;
  };

  export declare var RTCRtpReceiver: {
    prototype: RTCRtpReceiver;
    new (): RTCRtpReceiver;
    getCapabilities(kind: string): RTCRtpCapabilities | null;
  };

  export declare var RTCRtpSender: {
    prototype: RTCRtpSender;
    new (): RTCRtpSender;
    getCapabilities(kind: string): RTCRtpCapabilities | null;
  };

  export declare var RTCRtpTransceiver: {
    prototype: RTCRtpTransceiver;
    new (): RTCRtpTransceiver;
  };

  export declare var RTCSctpTransport: {
    prototype: RTCSctpTransport;
    new (): RTCSctpTransport;
  };

  export declare var RTCSessionDescription: {
    prototype: RTCSessionDescription;
    new (
      descriptionInitDict?: RTCSessionDescriptionInit
    ): RTCSessionDescription;
  };
}
