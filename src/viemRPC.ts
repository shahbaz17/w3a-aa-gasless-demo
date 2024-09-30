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
  getAddress,
  parseAbi,
  maxUint256,
} from "viem";

import { createPimlicoClient } from "permissionless/clients/pimlico";
import { toBiconomySmartAccount, toEcdsaKernelSmartAccount, toSafeSmartAccount } from "permissionless/accounts";
import { arbitrumSepolia, baseSepolia, mainnet, polygonMumbai, sepolia } from "viem/chains";
import {
  SmartAccountClient,
  createSmartAccountClient,
} from "permissionless";
import type { EIP1193Provider } from "viem";
import type { IProvider } from "@web3auth/base";
import { entryPoint06Address, entryPoint07Address } from "viem/account-abstraction";
import { chainConfig } from "viem/zksync";
import { encodeNonce } from "permissionless/utils";

// const ERC20_PAYMASTER_ADDRESS = "0x000000000041F3aFe8892B48D88b6862efe0ec8d";
// const SPONSORSHIP_POLICY_ID = "sp_square_the_stranger";
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const ERC20_PAYMASTER_ADDRESS = "0x00000000002E3A39aFEf1132214fEee5a55ce127";
const API_KEY = "bff8c9e7-b1ad-4489-ab73-a61e30343138";
// const PAYMASTER_URL = `https://api.pimlico.io/v2/84532/rpc?apikey=${API_KEY}`;
const BUNDLER_URL = `https://api.pimlico.io/v2/421614/rpc?apikey=pim_WDBELWbZeo9guUAr7HNFaF`;

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
        return arbitrumSepolia;
    }
  }

  async prepareSmartAccountClient(): Promise<any> {
    const publicClient = createPublicClient({
      transport: http("https://rpc.ankr.com/arbitrum_sepolia"),
      chain: arbitrumSepolia,
    });

    const smartAccountSigner = this.provider as EIP1193Provider

    const smartAccount = await toSafeSmartAccount({
      client: publicClient,
      owners: [smartAccountSigner],
      version: "1.4.1"
    });

    const bundlerClient = createPimlicoClient({
      transport: http(BUNDLER_URL),
      chain: arbitrumSepolia,
      // entryPoint: {
      //   address: entryPoint06Address,
      //   version: '0.6',
      // }
    });

    const paymasterClient = createPimlicoClient({
      transport: http("https://api-paymaster.web3auth.dev/", {
        fetchOptions: {
          headers: {
            Authorization: "Basic "
          }
        },
      }),
      chain: arbitrumSepolia,
      // entryPoint: {
      //   address: entryPoint06Address,
      //   version: '0.6',
      // }
    });

    // bundlerClient.extends(pimlicoPaymasterActions(entryPoint06Address));

    const smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      bundlerTransport: http(BUNDLER_URL),
      paymaster: bundlerClient,
      chain: arbitrumSepolia,
      userOperation: {
        estimateFeesPerGas: async () => (await bundlerClient.getUserOperationGasPrice()).fast,
      }
    });

    return { smartAccount, smartAccountClient };
  }

  async sendSmartAccountTransaction(address: String) {
    const { smartAccountClient } = await this.prepareSmartAccountClient();
    if (!smartAccountClient) {
      throw new Error("Smart account client not initialized");
    }

    const parallelNonce1 = encodeNonce({
      key: BigInt(Date.now()),
      sequence: 0n,
    })

    try {
      // Send 1 USDC
      const txHash = await (smartAccountClient as SmartAccountClient).sendTransaction({
        calls: [
          {
            to: USDC_ADDRESS,
            abi: parseAbi(["function approve(address,uint)"]),
            functionName: "approve",
            args: ["0x0000000000000039cd5e8aE05257CE51C473ddd1", maxUint256],
          },
          {
            to: "0xeaA8Af602b2eDE45922818AE5f9f7FdE50cFa1A8",
            value: 0n,
            data: '0x',
          }
        ],
        paymasterContext: {
          token: USDC_ADDRESS
        },
        // nonce: parallelNonce1,
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
    } catch (error) {
      console.log(error);
    }
  }

  async getSmartAccountAddress() {
    const { smartAccount } = await this.prepareSmartAccountClient();
    return smartAccount.address;
  }

  async getSmartAccountBalance() {
    const publicClient = createPublicClient({
      transport: http("https://rpc.ankr.com/arbitrum_sepolia"),
      chain: arbitrumSepolia,
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
    return `Smart account USDC balance: ${Number(senderUsdcBalance) / 1000000
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
