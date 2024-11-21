import {
  IDL,
  Principal,
  query,
  update,
  StableBTreeMap,
  isController,
  caller,
  time,
} from "azle";
import { v4 as uuidv4 } from "uuid";

import { handleError } from "./utils";
import {
  User,
  UserResult,
  Transaction,
  TransactionResult,
  TransactionArrayResult,
  TransactionStatus,
  Service,
  ServiceResult,
  AnalyticsResult,
} from "./types";

export default class PointsCanister {
  userStorage = StableBTreeMap<Principal, User>(0);
  serviceStorage = StableBTreeMap<Principal, Service>(1);

  @update([IDL.Principal], ServiceResult)
  initializeCanister(serviceId: Principal): ServiceResult {
    try {
      if (!isController(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      if (this.serviceStorage.keys().length > 0) {
        throw {
          Unauthorized: "Canister already has an authorized service ID!",
        };
      }

      if (this.serviceStorage.containsKey(serviceId)) {
        throw { Conflict: "Service already exists!" };
      }

      const newService: Service = {
        id: serviceId,
        createdAt: time(),
      };
      this.serviceStorage.insert(serviceId, newService);
      return { Ok: newService };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  // Initialize or get a user
  @update([IDL.Principal], UserResult)
  initializeUser(userPrincipal: Principal): UserResult {
    try {
      this.authorizeCaller();

      if (this.userStorage.containsKey(userPrincipal)) {
        throw { Conflict: "User already exists!" };
      }

      const newUser: User = {
        id: userPrincipal,
        totalPoints: BigInt(0),
        availablePoints: BigInt(0),
        totalRedeemed: BigInt(0),
        transactions: [],
        createdAt: time(),
        updatedAt: time(),
      };

      this.userStorage.insert(userPrincipal, newUser);
      return { Ok: newUser };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  // Add points to user
  @update([IDL.Principal, IDL.Nat, IDL.Text], UserResult)
  addPoints(
    userPrincipal: Principal,
    amount: bigint,
    description: string,
  ): UserResult {
    try {
      this.authorizeCaller();

      if (amount <= BigInt(0)) {
        throw { InvalidPayload: "Amount must be a positive number" };
      }

      const user = this.userStorage.get(userPrincipal);
      if (!user) {
        throw { NotFound: "User not found" };
      }

      const transaction: Transaction = {
        id: `EARN-${uuidv4()}`,
        userPrincipal,
        amount,
        address: "",
        status: "COMPLETED",
        transactionType: "EARNING",
        description: description ?? "Points earned",
        createdAt: time(),
        updatedAt: time(),
      };

      user.totalPoints += amount;
      user.availablePoints += amount;
      user.transactions.push(transaction);
      user.updatedAt = time();

      this.userStorage.insert(userPrincipal, user);
      return { Ok: user };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  // Process redeem request
  @update([IDL.Principal, IDL.Nat, IDL.Text, IDL.Text], TransactionResult)
  requestRedeem(
    userPrincipal: Principal,
    amount: bigint,
    address: string,
    description: string,
  ): TransactionResult {
    try {
      this.authorizeCaller();

      if (amount <= BigInt(0)) {
        throw { InvalidPayload: "Amount must be a positive number" };
      }

      const user = this.userStorage.get(userPrincipal);
      if (!user) {
        throw { NotFound: "User not found" };
      }

      if (user.availablePoints < amount) {
        return {
          Err: { InvalidPayload: "Insufficient points for redeeming" },
        };
      }

      const transaction: Transaction = {
        id: `RED-${uuidv4()}`,
        userPrincipal,
        amount,
        address,
        status: "PENDING",
        transactionType: "REDEEM",
        description: description ?? "Points redeem request",
        createdAt: time(),
        updatedAt: time(),
      };

      user.availablePoints -= amount;
      user.totalRedeemed += amount;
      user.transactions.push(transaction);
      user.updatedAt = time();

      this.userStorage.insert(userPrincipal, user);
      return { Ok: transaction };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  // Approve or decline a redeem request after manual USDC processing
  @update([IDL.Principal, IDL.Text, IDL.Text], TransactionResult)
  updateRedeemStatus(
    userPrincipal: Principal,
    transactionId: string,
    status: TransactionStatus,
  ): TransactionResult {
    try {
      this.authorizeCaller();

      // Validate that status is either "APPROVED" or "DECLINED"
      if (status !== "APPROVED" && status !== "DECLINED") {
        throw {
          InvalidPayload: "Status must be either 'APPROVED' or 'DECLINED'",
        };
      }

      const user = this.userStorage.get(userPrincipal);
      if (!user) {
        throw { NotFound: "User not found" };
      }

      const transactionIndex = user.transactions.findIndex(
        (t) => t.id === transactionId,
      );
      if (transactionIndex === -1) {
        throw { NotFound: "Transaction not found" };
      }

      const transaction: Transaction = user.transactions[transactionIndex];

      if (
        transaction.transactionType === "REDEEM" &&
        transaction.status === "PENDING"
      ) {
        if (status === "DECLINED") {
          user.availablePoints += transaction.amount;
          user.totalRedeemed -= transaction.amount;
        }

        user.transactions[transactionIndex] = {
          ...transaction,
          status: status,
        };

        // Update the user's record in storage
        user.updatedAt = time();
        this.userStorage.insert(userPrincipal, user);

        return { Ok: user.transactions[transactionIndex] };
      } else {
        throw {
          InvalidPayload:
            "Transaction is not pending or is not a redeem request",
        };
      }
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @query([IDL.Principal], UserResult)
  getUser(userPrincipal: Principal): UserResult {
    try {
      this.authorizeCaller();

      const user = this.userStorage.get(userPrincipal);
      if (!user) {
        throw { NotFound: "User not found" };
      }
      return { Ok: user };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @query([IDL.Principal], TransactionArrayResult)
  getUserTransactions(userPrincipal: Principal): TransactionArrayResult {
    try {
      this.authorizeCaller();

      const user = this.userStorage.get(userPrincipal);
      return { Ok: user ? user.transactions : [] };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  // Retrieve all pending redeem transactions
  @query([], TransactionArrayResult)
  getPendingRedeemTransactions(): TransactionArrayResult {
    try {
      this.authorizeCaller();

      const allPendingRedeemTransactions: Transaction[] = [];

      for (const [, user] of this.userStorage.items()) {
        const pendingRedeemTransactions = user.transactions.filter(
          (transaction) =>
            transaction.status === "PENDING" &&
            transaction.transactionType === "REDEEM",
        );

        allPendingRedeemTransactions.push(...pendingRedeemTransactions);
      }

      return { Ok: allPendingRedeemTransactions };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @query([], AnalyticsResult)
  getPlatformAnalytics(): AnalyticsResult {
    try {
      this.authorizeCaller();

      let totalPoints = BigInt(0);
      let availablePoints = BigInt(0);
      let redeemedPoints = BigInt(0);
      let totalTransactions = BigInt(0);

      for (const [, user] of this.userStorage.items()) {
        totalPoints += user.totalPoints;
        availablePoints += user.availablePoints;
        redeemedPoints += user.totalRedeemed;
        totalTransactions += BigInt(user.transactions.length);
      }

      return {
        Ok: {
          totalPoints,
          availablePoints,
          redeemedPoints,
          totalTransactions,
        },
      };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  // Auth
  private authorizeCaller(): void {
    if (!this.serviceStorage.containsKey(caller())) {
      throw { Unauthorized: "Unauthorized access!" };
    }
  }
}
