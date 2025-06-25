import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function Header() {
  const [hideConnectBtn, setHideConnectBtn] = useState(false);
  const { connect } = useConnect();

  useEffect(() => {
    if (window.ethereum && window.ethereum.isMiniPay) {
      setHideConnectBtn(true);
      connect({ connector: injected({ target: "metaMask" }) });
    }
  }, []);

  return (
    <nav className="bg-colors-primary border-b border-black h-16 flex items-center justify-between px-4">
      <span className="text-xl font-bold text-black">CeloKudos</span>
      {!hideConnectBtn && (
        <ConnectButton
          showBalance={{
            smallScreen: true,
            largeScreen: false,
          }}
        />
      )}
    </nav>
  );
}
