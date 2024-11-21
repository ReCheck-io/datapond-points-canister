# datapond-points-canister

> DataPond Tracing canister is a Internet Computer smart contract for seamless data transparency and accountability. Effortlessly store and trace every action, from data uploads to processing and consumption, providing methods for granular verification and retrieving logs for a specific data.

## Setup

1. Install DFINITY SDK using the following command:
```bash
  DFX_VERSION=0.22.0 sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

2. Add DFINITY to your PATH variables by appending the following line to your `.bashrc`:
```bash
  echo 'export PATH="$PATH:$HOME/bin"' >> "$HOME/.bashrc"
```

3. Start the DFINITY local environment in the background:
```bash
  dfx start --background
```

4. Install project dependencies:
```bash
  npm install
```

4. Then run deploy command
```bash
dfx deploy points
```

5. Then call initialize canister method to authorize back-end identity principle.
```bash
dfx canister call points initializeCanister '(principal "<YOUR_PRINCIPLE_HERE>")'
```

## Methods

#### `initializeCanister`
- **Description:** Initializes the canister by adding a new service during deployment. This is typically restricted to the controller.  
- **Parameters:** `serviceId` (`Principal`) – The unique identifier for the service.  
- **Returns:** The created service entry or an error.

---

#### `initializeUser`
- **Description:** Registers a new user in the canister. If the user already exists, it throws an error.  
- **Parameters:** `userPrincipal` (`Principal`) – The unique identifier of the user.  
- **Returns:** The created user entry or an error.

---

#### `addPoints`
- **Description:** Adds points to a user’s account and records the transaction.  
- **Parameters:**  
  - `userPrincipal` (`Principal`) – The user’s unique identifier.  
  - `amount` (`Nat`) – The amount of points to add.  
  - `description` (`Text`) – A description for the transaction.  
- **Returns:** The updated user record or an error.

---

#### `requestRedeem`
- **Description:** Initiates a points redemption request for a user. The request deducts points from the user’s available balance and sets the transaction status to "PENDING."  
- **Parameters:**  
  - `userPrincipal` (`Principal`) – The user’s unique identifier.  
  - `amount` (`Nat`) – The amount of points to redeem.  
  - `address` (`Text`) – The address for USDC processing.  
  - `description` (`Text`) – A description for the transaction.  
- **Returns:** The created redemption transaction or an error.

---

#### `updateRedeemStatus`
- **Description:** Updates the status of a redemption request after manual USDC processing. The status can be "APPROVED" or "DECLINED."  
- **Parameters:**  
  - `userPrincipal` (`Principal`) – The user’s unique identifier.  
  - `transactionId` (`Text`) – The identifier of the transaction to update.  
  - `status` (`TransactionStatus`) – The new status of the transaction ("APPROVED" or "DECLINED").  
- **Returns:** The updated transaction or an error.

---

#### `getUser`
- **Description:** Retrieves a user’s data by their unique identifier.  
- **Parameters:** `userPrincipal` (`Principal`) – The user’s unique identifier.  
- **Returns:** The user record or an error.

---

#### `getUserTransactions`
- **Description:** Retrieves all transactions associated with a user.  
- **Parameters:** `userPrincipal` (`Principal`) – The user’s unique identifier.  
- **Returns:** A list of transactions or an error.

---

#### `getPendingRedeemTransactions`
- **Description:** Retrieves all redemption requests across users that are in the "PENDING" status.  
- **Returns:** A list of pending redemption transactions or an error.

---

#### `getPlatformAnalytics`
- **Description:** Retrieves platform-wide analytics, including:  
  - Total points issued.  
  - Available points.  
  - Redeemed points.  
  - Total transactions.  
- **Returns:** An object containing platform-wide analytics or an error.

---

#### `authorizeCaller` (Private)
- **Description:** Ensures that the caller is authorized to perform actions on the canister.  
- **Throws:** An `Unauthorized` error if the caller is not authorized.  

--- 