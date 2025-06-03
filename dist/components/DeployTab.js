var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Contract, BrowserProvider, parseUnits } from "ethers";
import { NFTStorage, File } from "nft.storage";
import monportAbi from "../abis/MonPortFactory.json";
import { MONPORT_FACTORY_ADDRESS } from "../utils/contracts";
const NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_API;
const DeployTab = () => {
    const [file, setFile] = useState(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const connectWallet = () => __awaiter(void 0, void 0, void 0, function* () {
        if (window.ethereum) {
            const provider = new BrowserProvider(window.ethereum); //
            yield provider.send("eth_requestAccounts", []);
            const signer = yield provider.getSigner();
            const address = yield signer.getAddress();
            setWalletAddress(address);
        }
    });
    const handleDeploy = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!file || !name || !price) {
            alert("Please fill all fields.");
            return;
        }
        try {
            const nftStorage = new NFTStorage({ token: NFT_STORAGE_TOKEN });
            const metadata = yield nftStorage.store({
                name,
                description: `${name} on Monad`,
                image: new File([file], file.name, { type: file.type }),
            });
            const provider = new BrowserProvider(window.ethereum);
            const signer = yield provider.getSigner();
            const contract = new Contract(MONPORT_FACTORY_ADDRESS, monportAbi, signer); //
            const value = parseUnits("0.5", 18); //
            const tx = yield contract.deployCustomNFT(metadata.url, name, parseUnits(price, 18), {
                value,
            });
            yield tx.wait();
            alert("Deployment successful!");
        }
        catch (error) {
            console.error(error);
            alert("Deployment failed.");
        }
    });
    useEffect(() => {
        connectWallet();
    }, []);
    return (_jsxs("div", { className: "tab deploy-tab", children: [_jsx("h2", { children: "Create Your NFT Collection" }), walletAddress && _jsxs("p", { children: ["Connected: ", walletAddress] }), _jsx("input", { type: "file", accept: "image/*", onChange: (e) => setFile(e.target.files[0]) }), _jsx("input", { type: "text", placeholder: "NFT Name", value: name, onChange: (e) => setName(e.target.value) }), _jsx("input", { type: "number", placeholder: "Mint Price in MON", value: price, onChange: (e) => setPrice(e.target.value) }), _jsx("button", { onClick: handleDeploy, children: "Deploy Collection (0.5 MON)" })] }));
};
export default DeployTab;
