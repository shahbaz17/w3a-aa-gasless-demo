import {
  createWalletClient,
  createPublicClient,
  custom,
  formatEther,
  parseEther,
  http,
  parseAbiItem,
  encodeFunctionData,
  parseUnits,
} from "viem";
import { baseSepolia, mainnet, polygonMumbai, sepolia } from "viem/chains";
import {
  ENTRYPOINT_ADDRESS_V07,
  createSmartAccountClient,
  providerToSmartAccountSigner,
} from "permissionless";
import { signerToSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoBundlerClient } from "permissionless/clients/pimlico";
import type { EIP1193Provider } from "viem";
import type { IProvider } from "@web3auth/base";
import { pimlicoPaymasterActions } from "permissionless/actions/pimlico";

// const ERC20_PAYMASTER_ADDRESS = "0x000000000041F3aFe8892B48D88b6862efe0ec8d";
// const SPONSORSHIP_POLICY_ID = "sp_square_the_stranger";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const ERC20_PAYMASTER_ADDRESS = "0x00000000002E3A39aFEf1132214fEee5a55ce127";
const API_KEY = "bff8c9e7-b1ad-4489-ab73-a61e30343138";
// const PAYMASTER_URL = `https://api.pimlico.io/v2/84532/rpc?apikey=${API_KEY}`;
const BUNDLER_URL = `https://api.pimlico.io/v2/84532/rpc?apikey=${API_KEY}`;

const USDC_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "_value", type: "uint256" }],
    name: "burn",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_from", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "burnFrom",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
      { name: "_extraData", type: "bytes" },
    ],
    name: "approveAndCall",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "initialSupply", type: "uint256" },
      { name: "tokenName", type: "string" },
      { name: "tokenSymbol", type: "string" },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Burn",
    type: "event",
  },
];

export default class EthereumRpc {
  private provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  private getViewChain() {
    const chainId = this.provider.chainId;
    switch (chainId) {
      case "1":
        return mainnet;
      case "0x13881":
        return polygonMumbai;
      case "0xaa36a7":
        return sepolia;
      default:
        return mainnet;
    }
  }

  async prepareSmartAccountClient(): Promise<any> {
    const publicClient = createPublicClient({
      transport: http("https://sepolia.base.org"),
      chain: baseSepolia,
    });

    const smartAccountSigner = await providerToSmartAccountSigner(
      this.provider as EIP1193Provider
    );

    const smartAccount = await signerToSafeSmartAccount(publicClient, {
      signer: smartAccountSigner,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      safeVersion: "1.4.1",
      setupTransactions: [
        {
          to: USDC_ADDRESS,
          value: 0n,
          data: encodeFunctionData({
            abi: [
              parseAbiItem("function approve(address spender, uint256 amount)"),
            ],
            args: [
              ERC20_PAYMASTER_ADDRESS,
              0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
            ],
          }),
        },
      ],
    });

    const bundlerClient = createPimlicoBundlerClient({
      transport: http(BUNDLER_URL),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    }).extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07));

    const smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      chain: baseSepolia,
      bundlerTransport: http(BUNDLER_URL),
      middleware: {
        gasPrice: async () => {
          return (await bundlerClient.getUserOperationGasPrice()).fast;
        },
        sponsorUserOperation: async (args) => {
          const gasEstimates = await bundlerClient.estimateUserOperationGas({
            userOperation: {
              ...args.userOperation,
              paymaster: ERC20_PAYMASTER_ADDRESS,
            },
          });

          return {
            ...gasEstimates,
            preVerificationGas: (gasEstimates.preVerificationGas * 120n) / 100n,
            paymaster: ERC20_PAYMASTER_ADDRESS,
          };
        },
      },
    });

    return { smartAccount, smartAccountClient };
  }

  async sendSmartAccountTransaction(address: String) {
    const { smartAccountClient } = await this.prepareSmartAccountClient();
    if (!smartAccountClient) {
      throw new Error("Smart account client not initialized");
    }

    // Send 1 USDC
    const txHash = await smartAccountClient.sendTransaction({
      to: USDC_ADDRESS,
      data: encodeFunctionData({
        abi: USDC_ABI,
        functionName: "transfer",
        args: [address, parseUnits("1", 6)],
      }),
    });

    // const txHash = await smartAccountClient.sendTransaction({
    //   to: "0xeaA8Af602b2eDE45922818AE5f9f7FdE50cFa1A8",
    //   value: parseEther("0.08"),
    //   data: "0x1234",
    // });

    console.log(
      `User operation included: https://sepolia.basescan.org/tx/${txHash}`
    );
    return `User operation included: https://sepolia.basescan.org/tx/${txHash}`;
  }

  async getSmartAccountAddress() {
    const { smartAccount } = await this.prepareSmartAccountClient();
    return smartAccount.address;
  }

  async getSmartAccountBalance() {
    const publicClient = createPublicClient({
      transport: http("https://sepolia.base.org"),
      chain: baseSepolia,
    });
    const { smartAccount } = await this.prepareSmartAccountClient();

    const senderUsdcBalance = await publicClient.readContract({
      abi: [
        parseAbiItem(
          "function balanceOf(address account) external view returns (uint256)"
        ),
      ],
      address: USDC_ADDRESS,
      functionName: "balanceOf",
      args: [smartAccount.address],
    });

    // if (senderUsdcBalance < 1_000_000n) {
    //   console.log(`Smart account USDC balance: 0 USDC`);
    // } else {
    //   console.log(
    //     `Smart account USDC balance: ${Number(senderUsdcBalance) / 1000000
    //     } USDC`
    //   );
    // }

    const balance = await publicClient.getBalance({
      address: smartAccount.address as any,
    });
    const ethBalance = formatEther(balance);
    return `Smart account USDC balance: ${
      Number(senderUsdcBalance) / 1000000
    } USDC and ETH balance: ${ethBalance}`;
  }

  async getChainId(): Promise<string | Error> {
    try {
      const walletClient = createWalletClient({
        transport: custom(this.provider),
      });
      const chainId = await walletClient.getChainId();
      return chainId.toString();
    } catch (error) {
      return error as Error;
    }
  }

  async getAddresses(): Promise<string[] | Error> {
    try {
      const walletClient = createWalletClient({
        chain: this.getViewChain(),
        transport: custom(this.provider),
      });
      return await walletClient.getAddresses();
    } catch (error) {
      return error as Error;
    }
  }

  async getAccounts(): Promise<string[] | Error> {
    return this.getAddresses();
  }

  async getPrivateKey(): Promise<string | Error> {
    try {
      const privateKey = await this.provider.request({
        method: "eth_private_key",
      });
      return privateKey as string;
    } catch (error) {
      return error as Error;
    }
  }

  async getBalance(): Promise<string | Error> {
    try {
      const publicClient = createPublicClient({
        chain: this.getViewChain(),
        transport: custom(this.provider),
      });
      const addresses = await this.getAccounts();
      if (Array.isArray(addresses)) {
        const balance = await publicClient.getBalance({
          address: addresses[0] as any,
        });
        return formatEther(balance);
      } else {
        return "Unable to retrieve address";
      }
    } catch (error) {
      return error as Error;
    }
  }

  async sendTransaction(): Promise<any | Error> {
    try {
      const publicClient = createPublicClient({
        chain: this.getViewChain(),
        transport: custom(this.provider),
      });
      const walletClient = createWalletClient({
        chain: this.getViewChain(),
        transport: custom(this.provider),
      });

      const destination = "0x40e1c367Eca34250cAF1bc8330E9EddfD403fC56";
      const amount = parseEther("0.0001");
      const addresses = await this.getAccounts();

      if (Array.isArray(addresses)) {
        const hash = await walletClient.sendTransaction({
          account: addresses[0] as any,
          to: destination,
          value: amount,
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        return this.toObject(receipt);
      } else {
        return "Unable to retrieve address";
      }
    } catch (error) {
      return error as Error;
    }
  }

  async signMessage(): Promise<string | Error> {
    try {
      const walletClient = createWalletClient({
        chain: this.getViewChain(),
        transport: custom(this.provider),
      });

      const addresses = await this.getAccounts();
      if (Array.isArray(addresses)) {
        const originalMessage = "YOUR_MESSAGE";
        const hash = await walletClient.signMessage({
          account: addresses[0] as any,
          message: originalMessage,
        });
        return hash.toString();
      } else {
        return "Unable to retrieve address";
      }
    } catch (error) {
      return error as Error;
    }
  }

  private toObject(data: any): any {
    return JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  }
}
