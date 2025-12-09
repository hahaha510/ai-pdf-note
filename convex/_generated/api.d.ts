/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as collaboration from "../collaboration.js";
import type * as fileStorage from "../fileStorage.js";
import type * as langchain_db from "../langchain/db.js";
import type * as myAction from "../myAction.js";
import type * as shares from "../shares.js";
import type * as user from "../user.js";
import type * as workspaceNotes from "../workspaceNotes.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  collaboration: typeof collaboration;
  fileStorage: typeof fileStorage;
  "langchain/db": typeof langchain_db;
  myAction: typeof myAction;
  shares: typeof shares;
  user: typeof user;
  workspaceNotes: typeof workspaceNotes;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
