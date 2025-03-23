// Decentralized KYC - Starter Code (React + Tailwind)
// Features: Wallet Connect, Real Biometric Scan (FaceIO), Mint Soulbound NFT with Environment Variables

import React, { useState, useEffect } from "react";
import { Lucid, Blockfrost, Data } from "lucid-cardano";
import { Button } from "@/components/ui/button";

export default function DecentralizedKYC() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [scanComplete, setScanComplete] = useState(false);
  const [lucid, setLucid] = useState(null);
  const [faceioInstance, setFaceioInstance] = useState(null);

  useEffect(() => {
    // Load FaceIO script dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.faceio.net/fio.js";
    script.async = true;
    script.onload = () => {
      setFaceioInstance(new window.faceIO(import.meta.env.VITE_FACEIO_PUBLIC_KEY));
    };
    document.body.appendChild(script);
  }, []);

  async function connectWallet() {
    try {
      const api = await window.cardano.nami.enable();
      const lucidInstance = await Lucid.new(
        new Blockfrost("https://cardano-mainnet.blockfrost.io/api/v0", import.meta.env.VITE_BLOCKFROST_API_KEY),
        "Mainnet"
      );
      lucidInstance.selectWallet(api);
      const address = await lucidInstance.wallet.address();
      setWalletAddress(address);
      setLucid(lucidInstance);
      setWalletConnected(true);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  }

  async function scanBiometric() {
    if (!faceioInstance) return;
    try {
      const userInfo = await faceioInstance.enroll({
        locale: "auto",
        payload: {
          wallet: walletAddress,
        },
      });
      console.log("Biometric Scan Success:", userInfo);
      setScanComplete(true);
    } catch (err) {
      console.error("Biometric Scan Failed:", err);
    }
  }

  async function mintSoulboundNFT() {
    if (!lucid || !scanComplete) return;

    const policy = lucid.utils.nativeScriptFromJson({
      type: "all",
      scripts: [{ type: "sig", keyHash: lucid.utils.keyHash(await lucid.wallet.address()) }],
    });

    const policyId = lucid.utils.mintingPolicyToId(policy);

    const tx = await lucid
      .newTx()
      .mintAssets({ [`${policyId}.KYCProofNFT`]: 1n }, Data.void())
      .validTo(Date.now() + 200000)
      .attachMintingPolicy(policy)
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    alert(`KYC NFT minted! Tx Hash: ${txHash}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Decentralized KYC (Cardano)</h1>
      {!walletConnected ? (
        <Button onClick={connectWallet} className="mb-4">Connect Wallet</Button>
      ) : (
        <div className="mb-4 text-green-400">Wallet Connected: {walletAddress.slice(0, 10)}...</div>
      )}

      {!scanComplete ? (
        <Button onClick={scanBiometric} className="mb-4">Scan Eye (FaceIO)</Button>
      ) : (
        <div className="mb-4 text-blue-400">Biometric Scan Complete</div>
      )}

      {walletConnected && scanComplete && (
        <Button onClick={mintSoulboundNFT} className="bg-purple-600 hover:bg-purple-700">Mint KYC NFT</Button>
      )}
    </div>
  );
}
