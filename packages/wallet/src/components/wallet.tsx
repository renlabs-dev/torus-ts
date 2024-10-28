"use client";

import "../output.css";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type {
  InjectedAccountWithMeta,
  TransactionResult,
} from "@torus-ts/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { isSS58 } from "@torus-ts/types";
import {
  CopyButton,
  NoWalletExtensionDisplay,
  TransactionStatus,
} from "@torus-ts/ui";
import { formatToken, fromNano, smallAddress } from "@torus-ts/utils";

import { WalletButton } from "./";

// type MenuType = "send" | "stake" | "unstake" | "transfer" | null;
type MenuType = "transfer" | "stake" | "unstake" | null;

export function Wallet() {
  const {
    handleGetWallets,
    selectedAccount,
    setSelectedAccount,
    setIsConnected,
    addStake,
    removeStake,
    transfer,
    stakeOut,
    balance,
    accounts,
    handleWalletModal,
    openWalletModal,
  } = useTorus();

  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [validator, setValidator] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const [isWalletSelectionView, setIsWalletSelectionView] = useState(
    Boolean(!selectedAccount?.address),
  );

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const [inputError, setInputError] = useState<{
    validator: string | null;
    value: string | null;
  }>({ validator: null, value: null });

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
  };

  const handleMenuClick = (type: MenuType) => {
    setValidator("");
    setAmount("");
    setActiveMenu(type);
  };

  const handleCheckInput = () => {
    setInputError({ validator: null, value: null });

    const isAddressValid = isSS58(validator);
    if (!isAddressValid)
      setInputError((prev) => ({
        ...prev,
        validator: "Invalid address. Please correct it and try again.",
      }));

    const isAmountValid = !(Number(amount) <= 0 || isNaN(Number(amount)));
    if (!isAmountValid) {
      setInputError((prev) => ({
        ...prev,
        value: "Invalid value. Please correct it and try again.",
      }));
    }

    return Boolean(isAmountValid && isAddressValid);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAccount) {
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Select your wallet",
      });
      return;
    }

    const isValidInput = handleCheckInput();

    if (!isValidInput) {
      // setTransactionStatus({
      //   status: "ERROR",
      //   finalized: true,
      //   message: "Please correct the input error and try again.",
      // });
      return;
    }

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    if (activeMenu === "stake") {
      void addStake({
        validator,
        amount,

        callback: handleCallback,
      });
    }
    if (activeMenu === "unstake") {
      void removeStake({
        validator,
        amount,

        callback: handleCallback,
      });
    }
    // if (activeMenu === "transfer") {
    //   transferStake({
    //     fromValidator: selectedAccount.address,
    //     toValidator: validator,
    //     amount,

    //     callback: handleCallback,
    //   });
    // }

    if (activeMenu === "transfer") {
      // ORIGINAL SEND
      void transfer({
        to: validator,
        amount,
        callback: handleCallback,
      });
    }
  };

  const walletActions = [
    {
      icon: "send-icon.svg",
      name: "Transfer",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "tw-text-red-500",
      bgColor: "tw-bg-red-500/25",
    },
    {
      icon: "stake-icon.svg",
      name: "Stake",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "tw-text-yellow-500",
      bgColor: "tw-bg-yellow-500/25",
    },
    {
      icon: "unstake-icon.svg",
      name: "Unstake",
      handleMenuClick: (menuType: MenuType) => {
        handleMenuClick(menuType);
      },
      textColor: "tw-text-purple-500",
      bgColor: "tw-bg-purple-500/25",
    },
    // {
    //   icon: "transfer-icon.svg",
    //   name: "Transfer Stake",
    //   handleMenuClick: (menuType: MenuType) => {
    //     handleMenuClick(menuType);
    //   },
    //   textColor: "tw-text-green-500",
    //   bgColor: "tw-bg-green-500/15",
    // },
  ];

  const [userStakeWeight, setUserStakeWeight] = useState<bigint | null>(null);

  const calculateUserStakeWeight = () => {
    if (stakeOut != null && selectedAccount != null) {
      const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
      return userStakeEntry ?? 0n;
    }
    return null;
  };

  useEffect(() => {
    setUserStakeWeight(calculateUserStakeWeight());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, stakeOut]);

  const [freeBalancePercentage, setFreeBalancePercentage] = useState(0);

  const router = useRouter();

  function handleWalletSelection(wallet: InjectedAccountWithMeta): void {
    const currentWallet = localStorage.getItem("favoriteWalletAddress");
    if (wallet.address === currentWallet) return;

    setSelectedAccount(wallet);
    localStorage.removeItem("authorization");
    localStorage.setItem("favoriteWalletAddress", wallet.address);
    setIsConnected(true);
    setIsWalletSelectionView(false);
    setUserStakeWeight(calculateUserStakeWeight());
    router.refresh();
  }

  const handleOpenSelectWallet = () => {
    handleGetWallets();
    setIsWalletSelectionView(true);
  };

  useEffect(() => {
    setIsWalletSelectionView(Boolean(!selectedAccount));
  }, [selectedAccount]);

  useEffect(() => {
    const freeBalance = Number(fromNano(balance ?? 0));
    const stakedBalance = Number(fromNano(userStakeWeight ?? 0));
    const availablePercentage =
      (freeBalance * 100) / (stakedBalance + freeBalance);

    if (isNaN(availablePercentage) || !availablePercentage) {
      setFreeBalancePercentage(0);
      return;
    }
    setFreeBalancePercentage(availablePercentage);
  }, [balance, userStakeWeight]);

  const SelectWalletModal = () => {
    if (!accounts?.length && isWalletSelectionView)
      return <NoWalletExtensionDisplay />;

    if (isWalletSelectionView) {
      return (
        <div className="tw-flex tw-flex-col tw-gap-y-4 tw-overflow-y-auto tw-p-4">
          {accounts?.map((item) => (
            <button
              className={`tw-text-md tw-flex tw-cursor-pointer tw-items-center tw-gap-x-3 tw-overflow-auto tw-border tw-px-4 tw-py-2 ${selectedAccount?.address === item.address
                  ? "tw-border-green-500"
                  : "tw-border-white/20"
                }`}
              key={item.address}
              onClick={() => handleWalletSelection(item)}
              type="button"
            >
              <div className="tw-flex tw-flex-col tw-items-start tw-gap-1">
                <span className="tw-font-semibold tw-text-white">
                  {item.meta.name}
                </span>
                <p className="tw-text-sm tw-font-thin tw-text-gray-300">
                  {smallAddress(item.address, 17)}
                </p>
              </div>
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={
        openWalletModal
          ? "tw-flex tw-items-center tw-justify-center"
          : "tw-hidden"
      }
    >
      <div
        className="tw-w-full tw-h-screen tw-absolute tw-z-[100]"
        onClick={() => {
          handleWalletModal(false);
          setIsWalletSelectionView(false);
        }}
      />
      <div className="tw-max-w-screen-2xl tw-mx-auto tw-w-full tw-fixed tw-z-[100]">
        <div className="tw-absolute tw-animate-fade-down tw-top-16 tw-w-auto xl:tw-w-1/4 tw-right-0 !tw-z-[150] tw-m-3 tw-flex-col tw-border tw-border-white/20 tw-bg-stone-950/70 tw-backdrop-blur-md">
          <SelectWalletModal />

          {!isWalletSelectionView && (
            <>
              <div className="tw-flex tw-gap-2 tw-animate-fade tw-animate-delay-300 tw-justify-between tw-border-b tw-border-white/20 tw-p-4">
                <WalletButton
                  customHandler={handleOpenSelectWallet}
                  className="tw-w-full"
                />
                <CopyButton code={selectedAccount?.address ?? ""} />
              </div>
              <div className="tw-flex tw-flex-col tw-animate-fade tw-animate-delay-500 tw-gap-4 tw-border-b tw-border-white/20 tw-p-4 tw-text-white">
                <div className="tw-border tw-border-white/20 tw-p-4">
                  <div className="tw-flex tw-w-full tw-justify-between gap-6">
                    <div>
                      <p className="tw-text-xl tw-text-green-500">
                        {formatToken(balance ?? 0)}
                        <span className="tw-ml-1 tw-text-sm tw-font-light tw-text-gray-400">
                          COMAI
                        </span>
                      </p>
                      <p className="tw-text-xs tw-text-gray-500">
                        Free Balance
                      </p>
                    </div>
                    <div className="tw-text-right">
                      <p className="tw-text-xl tw-text-red-500">
                        {stakeOut
                          ? formatToken(userStakeWeight ?? 0)
                          : "Loading..."}
                        <span className="tw-ml-1 tw-text-sm tw-font-light tw-text-gray-400">
                          COMAI
                        </span>
                      </p>
                      <p className="tw-text-xs tw-text-gray-500">
                        Staked Balance
                      </p>
                    </div>
                  </div>
                  {stakeOut ? (
                    <div className="tw-relative tw-flex tw-h-2 tw-w-full tw-pt-1">
                      <span
                        className="tw-absolute tw-h-2 tw-bg-green-500"
                        style={{
                          width: `${freeBalancePercentage.toFixed(2)}%`,
                        }}
                      />
                      <span className="tw-h-2 tw-w-full tw-bg-red-500" />
                    </div>
                  ) : (
                    <div className="tw-relative tw-flex tw-animate-pulse tw-h-2 tw-w-full tw-pt-1">
                      <span
                        className="tw-absolute tw-h-2 tw-bg-green-500/20"
                        style={{
                          width: `50%`,
                        }}
                      />
                      <span className="tw-h-2 tw-w-full tw-bg-red-500/20" />
                    </div>
                  )}
                </div>
              </div>
              <div className="tw-flex tw-p-4">
                <div className="tw-flex tw-border tw-border-white/20 tw-w-full tw-animate-fade tw-animate-delay-700">
                  {walletActions.map((action) => {
                    return (
                      <button
                        className={`tw-flex tw-w-full tw-flex-col tw-items-center tw-border-white/20 tw-px-3.5 tw-py-3 tw-text-gray-400 tw-transition tw-duration-200 hover:tw-bg-white/5 ${activeMenu == action.name.toLocaleLowerCase()
                            ? action.bgColor
                            : ""
                          }`}
                        key={action.name}
                        onClick={() => {
                          action.handleMenuClick(
                            action.name.toLowerCase() as MenuType,
                          );
                        }}
                        type="button"
                      >
                        <Image
                          height={24}
                          width={24}
                          alt={`${action.name} Icon`}
                          className="tw-h-6 tw-w-6"
                          src={action.icon}
                        />
                        <span className={`${action.textColor} tw-text-sm`}>
                          {action.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div
                className={`tw-flex tw-flex-col tw-gap-4 tw-border-t tw-animate-fade-down tw-border-white/20 tw-p-4 tw-text-white ${activeMenu ? "tw-flex" : "tw-hidden"
                  }`}
              >
                <form
                  className="tw-flex tw-w-full tw-flex-col tw-gap-4"
                  onSubmit={handleSubmit}
                >
                  <div className="tw-w-full">
                    <span className="tw-text-base">
                      {activeMenu === "stake" ||
                        // activeMenu === "transfer" ||
                        activeMenu === "unstake" ? (
                        <div className="tw-flex tw-flex-col tw-items-end tw-gap-3 md:tw-flex-row">
                          <p>Validator Address</p>
                          <a
                            className="tw-text-sm tw-text-blue-500 hover:tw-underline ml-auto"
                            href="https://www.comstats.org/"
                            target="_blank"
                          >
                            View validators list
                          </a>
                        </div>
                      ) : (
                        "To Address"
                      )}
                    </span>
                    <input
                      className="tw-w-full tw-border tw-border-white/20 tw-bg-black tw-p-2 tw-text-gray-200 placeholder:tw-text-gray-400"
                      disabled={transactionStatus.status === "PENDING"}
                      onChange={(e) => {
                        setValidator(e.target.value);
                        setInputError((prev) => ({
                          ...prev,
                          validator: null,
                        }));
                      }}
                      placeholder={
                        activeMenu === "stake" ||
                          // activeMenu === "transfer" ||
                          activeMenu === "unstake"
                          ? "Enter the full address of the validator"
                          : "Enter full address of the recipient"
                      }
                      type="text"
                      value={validator}
                    />
                  </div>
                  {inputError.validator ? (
                    <p className="--tw-mt-2 tw-mb-1 tw-flex tw-text-left tw-text-sm tw-text-red-400">
                      {inputError.validator}
                    </p>
                  ) : null}
                  <div className="tw-w-full">
                    <p className="tw-text-base">Value</p>
                    <input
                      className="tw-w-full tw-border tw-border-white/20 tw-bg-black tw-p-2 tw-text-gray-200 placeholder:tw-text-gray-400"
                      disabled={transactionStatus.status === "PENDING"}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setInputError((prev) => ({
                          ...prev,
                          value: null,
                        }));
                      }}
                      placeholder="Enter the amount of COMAI"
                      type="text"
                      value={amount}
                    />
                  </div>
                  {inputError.value ? (
                    <p className="--tw-mt-2 tw-mb-1 tw-flex tw-text-left tw-text-sm tw-text-red-400">
                      {inputError.value}
                    </p>
                  ) : null}
                  <button
                    className="tw-w-full tw-border tw-border-green-500 tw-py-2 tw-text-green-500 hover:tw-bg-green-500/10 disabled:hover:tw-bg-400/10 disabled:tw-cursor-not-allowed disabled:tw-border-gray-400/70 disabled:tw-bg-gray-400/10 disabled:tw-text-gray-400/70 tw-transition tw-duration-100"
                    disabled={
                      transactionStatus.status === "PENDING" ||
                      !validator ||
                      !amount
                    }
                    type="submit"
                  >
                    Submit
                  </button>
                </form>
                {transactionStatus.status && (
                  <TransactionStatus
                    status={transactionStatus.status}
                    message={transactionStatus.message}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
