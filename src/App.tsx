import { useEffect, useState } from "react";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { AuthAdapter } from "@web3auth/auth-adapter";

import "./App.css";
// import RPC from "./web3RPC";  // for using web3.js
import RPC from "./viemRPC"; // for using viem
// import RPC from "./ethersRPC"; // for using ethers.js

// Providers
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

// Wallet Services
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";

// Adapters
// import { WalletConnectV2Adapter, getWalletConnectV2Settings } from "@web3auth/wallet-connect-v2-adapter";
// import { MetamaskAdapter } from "@web3auth/metamask-adapter";
// import { TorusWalletAdapter, TorusWalletOptions } from "@web3auth/torus-evm-adapter";
// import { CoinbaseAdapter, CoinbaseAdapterOptions } from "@web3auth/coinbase-adapter";

import Loading from "./Loading";

const clientId =
  "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x66eee", // Hex of 421614
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  rpcTarget: "https://rpc.ankr.com/arbitrum_sepolia",
  displayName: "Arbitrum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.arbiscan.io/",
  ticker: "AETH",
  tickerName: "AETH",
  logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  privateKeyProvider: privateKeyProvider,
  sessionTime: 86400, // 1 day
  // useCoreKitKey: true,
};

function App() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [walletServicesPlugin, setWalletServicesPlugin] =
    useState<WalletServicesPlugin | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loader, setLoader] = useState(false);
  const [toAddress, setToAddress] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToAddress(event.target.value);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth(web3AuthOptions as Web3AuthOptions);

        const openloginAdapter = new AuthAdapter({
          loginSettings: {
            mfaLevel: "optional",
          },
          adapterSettings: {
            uxMode: "redirect", // "redirect" | "popup"
            mfaSettings: {
              deviceShareFactor: {
                enable: true,
                priority: 1,
                mandatory: true,
              },
              backUpShareFactor: {
                enable: true,
                priority: 2,
                mandatory: true,
              },
              socialBackupFactor: {
                enable: true,
                priority: 3,
                mandatory: false,
              },
              passwordFactor: {
                enable: true,
                priority: 4,
                mandatory: false,
              },
            },
          },
        });
        web3auth.configureAdapter(openloginAdapter);

        // Wallet Services Plugin
        const walletServicesPlugin = new WalletServicesPlugin({
          walletInitOptions: {
            whiteLabel: {
              showWidgetButton: false,
              buttonPosition: "bottom-left",
            },
          },
        });
        setWalletServicesPlugin(walletServicesPlugin);
        web3auth.addPlugin(walletServicesPlugin);

        // read more about adapters here: https://web3auth.io/docs/sdk/pnp/web/adapters/

        // Only when you want to add External default adapters, which includes WalletConnect, Metamask, Torus EVM Wallet
        // const adapters = await getDefaultExternalAdapters({
        //   options: web3AuthOptions,
        // });
        // adapters.forEach((adapter) => {
        //   web3auth.configureAdapter(adapter);
        // });

        // adding wallet connect v2 adapter
        // const defaultWcSettings = await getWalletConnectV2Settings("eip155", ["1"], "04309ed1007e77d1f119b85205bb779d");
        // const walletConnectV2Adapter = new WalletConnectV2Adapter({
        //   ...(web3AuthOptions as BaseAdapterSettings),
        //   adapterSettings: { ...defaultWcSettings.adapterSettings },
        //   loginSettings: { ...defaultWcSettings.loginSettings },
        // });
        // web3auth.configureAdapter(walletConnectV2Adapter);

        // // adding metamask adapter
        // const metamaskAdapter = new MetamaskAdapter(web3AuthOptions as BaseAdapterSettings);
        // web3auth.configureAdapter(metamaskAdapter);

        // // adding torus evm adapter
        // const torusWalletAdapter = new TorusWalletAdapter(web3AuthOptions as TorusWalletOptions);
        // web3auth.configureAdapter(torusWalletAdapter);

        // // adding coinbase adapter
        // const coinbaseAdapter = new CoinbaseAdapter(web3AuthOptions as CoinbaseAdapterOptions);
        // web3auth.configureAdapter(coinbaseAdapter);

        setWeb3auth(web3auth);

        await web3auth.initModal();

        // await web3auth.initModal({
        //   modalConfig: {
        //     [WALLET_ADAPTERS.OPENLOGIN]: {
        //       label: "openlogin",
        //       loginMethods: {
        //         // Disable facebook and reddit
        //         facebook: {
        //           name: "facebook",
        //           showOnModal: false
        //         },
        //         reddit: {
        //           name: "reddit",
        //           showOnModal: false
        //         },
        //         // Disable email_passwordless and sms_passwordless
        //         email_passwordless: {
        //           name: "email_passwordless",
        //           showOnModal: false
        //         },
        //         sms_passwordless: {
        //           name: "sms_passwordless",
        //           showOnModal: false
        //         }
        //       }
        //     }
        //   }
        // });
        if (web3auth.connected) {
          setLoggedIn(true);
          // const rpc = new RPC(web3auth.provider as IProvider);
          // await rpc.initializeSmartAccount();
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.connect();
  };

  function isValidETHAddress(str: string | null): boolean {
    const regex = /^(0x)?[0-9a-fA-F]{40}$/;

    if (str === null) {
      return false;
    }

    return regex.test(str);
  }

  const authenticateUser = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    uiConsole();
    const idToken = await web3auth.authenticateUser();
    uiConsole(idToken);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    uiConsole();
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    uiConsole();
    await web3auth.logout();
    setLoggedIn(false);
  };

  const showWCM = async () => {
    if (!walletServicesPlugin) {
      uiConsole("torus plugin not initialized yet");
      return;
    }
    uiConsole();
    await walletServicesPlugin.showWalletConnectScanner();
  };

  const showCheckout = async () => {
    if (!walletServicesPlugin) {
      uiConsole("torus plugin not initialized yet");
      return;
    }
    console.log(web3auth?.connected);
    await walletServicesPlugin.showCheckout();
  };

  const showWalletUi = async () => {
    if (!walletServicesPlugin) {
      uiConsole("torus plugin not initialized yet");
      return;
    }
    await walletServicesPlugin.showWalletUi();
  };

  const getChainId = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    const rpc = new RPC(web3auth.provider as IProvider);
    const chainId = await rpc.getChainId();
    uiConsole(chainId);
  };

  // const addChain = async () => {
  //   if (!web3auth?.provider) {
  //     uiConsole("provider not initialized yet");
  //     return;
  //   }
  //   uiConsole();
  //   const newChain = {
  //     chainNamespace: CHAIN_NAMESPACES.EIP155,
  //     chainId: "0x89", // hex of 137, polygon mainnet
  //     rpcTarget: "https://rpc.ankr.com/polygon",
  //     // Avoid using public rpcTarget in production.
  //     // Use services like Infura, Quicknode etc
  //     displayName: "Polygon Mainnet",
  //     blockExplorerUrl: "https://polygonscan.com",
  //     ticker: "MATIC",
  //     tickerName: "MATIC",
  //     logo: "https://images.toruswallet.io/polygon.svg",
  //   };

  //   await web3auth?.addChain(newChain);
  //   uiConsole("New Chain Added");
  // };

  // const switchChain = async () => {
  //   if (!web3auth?.provider) {
  //     uiConsole("provider not initialized yet");
  //     return;
  //   }
  //   uiConsole();
  //   await web3auth?.switchChain({ chainId: "0x89" });
  //   uiConsole("Chain Switched");
  // };

  const getAccounts = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    const rpc = new RPC(web3auth.provider as IProvider);
    const address = await rpc.getAccounts();
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    const rpc = new RPC(web3auth.provider as IProvider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const getSmartAccountAddress = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    setLoader(true);
    const rpc = new RPC(web3auth.provider as IProvider);
    const address = await rpc.getSmartAccountAddress();
    uiConsole(`Smart account address: ${address}`);
    setLoader(false);
  };

  const getSmartAccountBalance = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    setLoader(true);
    const rpc = new RPC(web3auth.provider as IProvider);
    const balance = await rpc.getSmartAccountBalance();
    uiConsole(balance);
    setLoader(false);
  };

  const sendSmartAccountTransaction = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    setLoader(true);
    const rpc = new RPC(web3auth.provider as IProvider);
    if (isValidETHAddress(toAddress)) {
      try {
        const receipt = await rpc.sendSmartAccountTransaction(toAddress);
        uiConsole(receipt);
      } catch (e) {
        uiConsole(e);
      }
    } else {
      uiConsole("Please enter valid Ethereum address");
    }
    setLoader(false);
  };

  const sendTransaction = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    setLoader(true);
    const rpc = new RPC(web3auth.provider as IProvider);
    const receipt = await rpc.sendTransaction();
    uiConsole(receipt);
    setLoader(false);
  };

  const signMessage = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    setLoader(true);
    const rpc = new RPC(web3auth.provider as IProvider);
    const signedMessage = await rpc.signMessage();
    uiConsole(signedMessage);
    setLoader(false);
  };

  const getPrivateKey = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole();
    setLoader(true);
    const rpc = new RPC(web3auth.provider as IProvider);
    const privateKey = await rpc.getPrivateKey();
    uiConsole(privateKey);
    setLoader(false);
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={authenticateUser} className="card">
            Get ID Token
          </button>
        </div>
        <div>
          <button onClick={showWalletUi} className="card">
            Show Wallet UI
          </button>
        </div>
        <div>
          <button onClick={showWCM} className="card">
            Show Wallet Connect
          </button>
        </div>
        <div>
          <button onClick={showCheckout} className="card">
            Show Checkout
          </button>
        </div>
        <div>
          <button onClick={getChainId} className="card">
            Get Chain ID
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={sendTransaction} className="card">
            Send Transaction
          </button>
        </div>
        <div>
          <button onClick={getPrivateKey} className="card">
            Get Private Key
          </button>
        </div>

        <div>
          <button
            onClick={getSmartAccountAddress}
            className="card smart-account"
          >
            Get Smart Account Address
          </button>
        </div>
        <div>
          <button
            onClick={getSmartAccountBalance}
            className="card smart-account"
          >
            Get Smart Account Balance
          </button>
        </div>
        <div>
          <button
            onClick={sendSmartAccountTransaction}
            className="card smart-account"
          >
            Send Smart Account Transaction
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
      <h5>
        Please note that the initial transaction for smart account creation can
        take more than 7 USDC.{" "}
        <a
          href="https://sepolia.basescan.org/tx/0x9c1ad9f3e70fcafdadd0c2d43bd6ab4937f503e28f40b3314395ba185ff8848b"
          target="_blank"
          rel="noopener noreferrer"
        >
          Reference transaction
        </a>
      </h5>
      <input
        type="text"
        value={toAddress}
        onChange={handleChange}
        id="textfield"
        placeholder="Enter address to send Smart Account Transaction"
      />
      {loader && <Loading />}
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a
          target="_blank"
          href="https://web3auth.io/docs/sdk/pnp/web/modal"
          rel="noreferrer"
        >
          Web3Auth{" "}
        </a>
        AA Gasless Example
      </h1>
      <p className="center">
        This Demo is on{" "}
        <a
          href="https://sepolia.basescan.org/"
          target="_blank"
          rel="noreferrer"
        >
          Base Sepolia
        </a>{" "}
        Chain
      </p>
      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>

      <footer className="footer">
        <a
          href="https://github.com/shahbaz17/w3a-aa-gasless-demo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
        <a
          href="https://faucet.circle.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          USDC Faucet
        </a>
      </footer>
    </div>
  );
}

export default App;
