import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * @example
 * const externalContracts = {
 *   1: {
 *     DAI: {
 *       address: "0x...",
 *       abi: [...],
 *     },
 *   },
 * } as const;
 */
const deployedContracts = {
  11155111: {
    TipJarExtended: {
      address: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x1686a7493830F31D4dd446c40574D88b22A96b7d") as `0x${string}`,
      abi: [
        {
          type: "constructor",
          inputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "receive",
          stateMutability: "payable",
        },
        {
          type: "function",
          name: "owner",
          inputs: [],
          outputs: [{ name: "", type: "address" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "totalTipCount",
          inputs: [],
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "totalTipAmount",
          inputs: [],
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "tipperTotalAmount",
          inputs: [{ name: "", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "tipperCount",
          inputs: [{ name: "", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "tip",
          inputs: [{ name: "message", type: "string" }],
          outputs: [],
          stateMutability: "payable",
        },
        {
          type: "function",
          name: "withdrawTips",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "getTipHistory",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "tuple[]",
              components: [
                { name: "tipper", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "message", type: "string" },
                { name: "timestamp", type: "uint256" },
              ],
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getTopTippers",
          inputs: [{ name: "n", type: "uint256" }],
          outputs: [
            { name: "addrs", type: "address[]" },
            { name: "amounts", type: "uint256[]" },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getStats",
          inputs: [],
          outputs: [
            { name: "balance", type: "uint256" },
            { name: "count", type: "uint256" },
            { name: "total", type: "uint256" },
          ],
          stateMutability: "view",
        },
        {
          type: "event",
          name: "TipReceived",
          inputs: [
            { name: "tipper", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
            { name: "message", type: "string", indexed: false },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "TipWithdrawn",
          inputs: [
            { name: "owner", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
          ],
          anonymous: false,
        },
      ],
      inheritedFunctions: {},
    },
  },
} as const satisfies GenericContractsDeclaration;

export default deployedContracts;
