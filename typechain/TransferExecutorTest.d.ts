/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface TransferExecutorTestInterface extends ethers.utils.Interface {
  functions: {
    "__TransferExecutorTest_init(address,address)": FunctionFragment;
    "owner()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "setTransferProxy(bytes4,address)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "transferTest(tuple,address,address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "__TransferExecutorTest_init",
    values: [string, string]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setTransferProxy",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "transferTest",
    values: [
      {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      },
      string,
      string
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "__TransferExecutorTest_init",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setTransferProxy",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferTest",
    data: BytesLike
  ): Result;

  events: {
    "OwnershipTransferred(address,address)": EventFragment;
    "ProxyChange(bytes4,address)": EventFragment;
    "Transfer(tuple,address,address,bytes4,bytes4)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ProxyChange"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
}

export type OwnershipTransferredEvent = TypedEvent<
  [string, string] & { previousOwner: string; newOwner: string }
>;

export type ProxyChangeEvent = TypedEvent<
  [string, string] & { assetType: string; proxy: string }
>;

export type TransferEvent = TypedEvent<
  [
    [[string, string] & { assetClass: string; data: string }, BigNumber] & {
      assetType: [string, string] & { assetClass: string; data: string };
      value: BigNumber;
    },
    string,
    string,
    string,
    string
  ] & {
    asset: [
      [string, string] & { assetClass: string; data: string },
      BigNumber
    ] & {
      assetType: [string, string] & { assetClass: string; data: string };
      value: BigNumber;
    };
    from: string;
    to: string;
    transferDirection: string;
    transferType: string;
  }
>;

export class TransferExecutorTest extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: TransferExecutorTestInterface;

  functions: {
    __TransferExecutorTest_init(
      _transferProxy: string,
      _erc20TransferProxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setTransferProxy(
      assetType: BytesLike,
      proxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferTest(
      asset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      },
      from: string,
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  __TransferExecutorTest_init(
    _transferProxy: string,
    _erc20TransferProxy: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  owner(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setTransferProxy(
    assetType: BytesLike,
    proxy: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferTest(
    asset: {
      assetType: { assetClass: BytesLike; data: BytesLike };
      value: BigNumberish;
    },
    from: string,
    to: string,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    __TransferExecutorTest_init(
      _transferProxy: string,
      _erc20TransferProxy: string,
      overrides?: CallOverrides
    ): Promise<void>;

    owner(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    setTransferProxy(
      assetType: BytesLike,
      proxy: string,
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    transferTest(
      asset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      },
      from: string,
      to: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    "ProxyChange(bytes4,address)"(
      assetType?: BytesLike | null,
      proxy?: null
    ): TypedEventFilter<[string, string], { assetType: string; proxy: string }>;

    ProxyChange(
      assetType?: BytesLike | null,
      proxy?: null
    ): TypedEventFilter<[string, string], { assetType: string; proxy: string }>;

    "Transfer(tuple,address,address,bytes4,bytes4)"(
      asset?: null,
      from?: null,
      to?: null,
      transferDirection?: null,
      transferType?: null
    ): TypedEventFilter<
      [
        [[string, string] & { assetClass: string; data: string }, BigNumber] & {
          assetType: [string, string] & { assetClass: string; data: string };
          value: BigNumber;
        },
        string,
        string,
        string,
        string
      ],
      {
        asset: [
          [string, string] & { assetClass: string; data: string },
          BigNumber
        ] & {
          assetType: [string, string] & { assetClass: string; data: string };
          value: BigNumber;
        };
        from: string;
        to: string;
        transferDirection: string;
        transferType: string;
      }
    >;

    Transfer(
      asset?: null,
      from?: null,
      to?: null,
      transferDirection?: null,
      transferType?: null
    ): TypedEventFilter<
      [
        [[string, string] & { assetClass: string; data: string }, BigNumber] & {
          assetType: [string, string] & { assetClass: string; data: string };
          value: BigNumber;
        },
        string,
        string,
        string,
        string
      ],
      {
        asset: [
          [string, string] & { assetClass: string; data: string },
          BigNumber
        ] & {
          assetType: [string, string] & { assetClass: string; data: string };
          value: BigNumber;
        };
        from: string;
        to: string;
        transferDirection: string;
        transferType: string;
      }
    >;
  };

  estimateGas: {
    __TransferExecutorTest_init(
      _transferProxy: string,
      _erc20TransferProxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setTransferProxy(
      assetType: BytesLike,
      proxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferTest(
      asset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      },
      from: string,
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    __TransferExecutorTest_init(
      _transferProxy: string,
      _erc20TransferProxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setTransferProxy(
      assetType: BytesLike,
      proxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferTest(
      asset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      },
      from: string,
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
