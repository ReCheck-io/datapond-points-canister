import { IDL, Principal } from "azle";

export type TransactionType = "EARNING" | "REDEEM";

export type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "APPROVED"
  | "DECLINED"
  | "FAILED";

export const Transaction = IDL.Record({
  id: IDL.Text,
  userPrincipal: IDL.Principal,
  amount: IDL.Nat,
  address: IDL.Text,
  transactionType: IDL.Text,
  status: IDL.Text,
  description: IDL.Text,
  createdAt: IDL.Nat64,
  updatedAt: IDL.Nat64,
});
export type Transaction = {
  id: string;
  userPrincipal: Principal;
  amount: bigint;
  address: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: bigint;
  updatedAt: bigint;
};

export const User = IDL.Record({
  id: IDL.Principal,
  totalPoints: IDL.Nat,
  availablePoints: IDL.Nat,
  totalRedeemed: IDL.Nat,
  transactions: IDL.Vec(Transaction),
  createdAt: IDL.Nat64,
  updatedAt: IDL.Nat64,
});
export type User = {
  id: Principal;
  totalPoints: bigint;
  availablePoints: bigint;
  totalRedeemed: bigint;
  transactions: Transaction[];
  createdAt: bigint;
  updatedAt: bigint;
};

export const AnalyticsData = IDL.Record({
  totalPoints: IDL.Nat64,
  availablePoints: IDL.Nat64,
  redeemedPoints: IDL.Nat64,
  totalTransactions: IDL.Nat64,
});

export type AnalyticsData = {
  totalPoints: bigint;
  availablePoints: bigint;
  redeemedPoints: bigint;
  totalTransactions: bigint;
};

export const Service = IDL.Record({
  id: IDL.Principal,
  createdAt: IDL.Nat64,
});

export interface Service {
  id: Principal;
  createdAt: bigint;
}

export const ErrorType = IDL.Variant({
  NotFound: IDL.Text,
  Conflict: IDL.Text,
  Unauthorized: IDL.Text,
  InvalidPayload: IDL.Text,
});
export type ErrorType =
  | { NotFound: string }
  | { Conflict: string }
  | { Unauthorized: string }
  | { InvalidPayload: string };

export const UserResult = IDL.Variant({ Ok: User, Err: ErrorType });
export type UserResult = { Ok: User } | { Err: ErrorType };

export const TransactionResult = IDL.Variant({
  Ok: Transaction,
  Err: ErrorType,
});
export type TransactionResult = { Ok: Transaction } | { Err: ErrorType };

export const TransactionArrayResult = IDL.Variant({
  Ok: IDL.Vec(Transaction),
  Err: ErrorType,
});
export type TransactionArrayResult = { Ok: Transaction[] } | { Err: ErrorType };

export const ServiceResult = IDL.Variant({ Ok: Service, Err: ErrorType });
export type ServiceResult = { Ok: Service } | { Err: ErrorType };

export const AnalyticsResult = IDL.Variant({
  Ok: AnalyticsData,
  Err: ErrorType,
});
export type AnalyticsResult = { Ok: AnalyticsData } | { Err: ErrorType };
