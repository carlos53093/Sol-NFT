import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { AnchorWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity} from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { Connection } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";

export const getUmi = (wallet: AnchorWallet) => {
    return createUmi("https://api.devnet.solana.com").use(walletAdapterIdentity(wallet)).use(mplTokenMetadata())
}
export const getProvider = (wallet: AnchorWallet | undefined) => {
    if (!wallet){
        return undefined;
    }
    const network = "https://api.devnet.solana.com";
    const connection = new Connection(network, "confirmed");
    const prov = new AnchorProvider(connection, wallet, {"preflightCommitment": "processed"});
    return prov;
}