'use client';
import { useEffect, useState, useMemo } from 'react';
import { BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui';

import { useConnection, useAnchorWallet  } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { MainNFTCard } from "@/app/components/card";
import { PROGRAM_ID, OUR_TOKEN_NAME, OUR_TOKEN_URI } from '@/config';
import mint_idl from "@/idl.json";
import { getUserNFTs, NFT} from "@/service/nft";
import { Program, Idl,  AnchorProvider} from "@project-serum/anchor";
import { ToastContainer, toast } from 'react-toastify';
import { MPL_TOKEN_METADATA_PROGRAM_ID, findMetadataPda, findMasterEditionPda } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from '@metaplex-foundation/umi';
import { getUmi, getProvider } from "@/service/utils";
import 'react-toastify/dist/ReactToastify.css';

const LABELS = {
    'change-wallet': 'Change wallet',
    connecting: 'Connecting ...',
    'copy-address': 'Copy address',
    copied: 'Copied',
    disconnect: 'Disconnect',
    'has-wallet': 'Connect',
    'no-wallet': 'Solana Wallet',
} as const;


const Main = ()=>{
    const anchorWallet  = useAnchorWallet();
    const { connection } = useConnection();
    const [nftItems, setNftItems] = useState<NFT[]>();
    const provider = useMemo(() => getProvider(anchorWallet), [anchorWallet]);

    useEffect(() => {
        if (!provider) return;
        getNFTs();
    }, [provider]);

    const getNFTs = async () => {
        const walletPubKey:PublicKey = anchorWallet?.publicKey!;
        const nfts = await getUserNFTs(connection, walletPubKey);
        setNftItems(nfts);
    }

    const mint = async ()=>{
        if (!provider || !anchorWallet) return;
        const mint = Keypair.generate();
        const associatedTokenAccount = getAssociatedTokenAddressSync(
            mint.publicKey,
            anchorWallet.publicKey,
        );
        const [authListAccount] = PublicKey.findProgramAddressSync([Buffer.from("auth-list")], new PublicKey(PROGRAM_ID));
        const metadataProgramIdPubkey = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID.toString());

        const umi = getUmi(anchorWallet);
        const metadataAccount = findMetadataPda(umi, {mint: publicKey(mint.publicKey)})[0];
        const masterEditionAccount = findMasterEditionPda(umi, {mint: publicKey(mint.publicKey)})[0];

        const idl: Idl = JSON.parse(JSON.stringify(mint_idl));

        const program = new Program(idl, PROGRAM_ID, provider);
        try{
            const tx = await program.methods.mintNft(OUR_TOKEN_NAME, OUR_TOKEN_URI).accounts({
                user: anchorWallet.publicKey,
                authList: authListAccount,
                mint: mint.publicKey,
                associatedTokenAccount: associatedTokenAccount,
                metadataAccount: metadataAccount,
                masterEditionAccount: masterEditionAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenMetadataProgram: metadataProgramIdPubkey,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            }).signers([mint]).rpc();
            toast(`Successfully minted. txhash:${tx}`);
        }catch(e) {
            console.log(e);
        }
    }

    return (
        <div>
            <div className="w-full flex justify-end items-end mt-4 mr-4">
                <div className="w-[100px] mr-10 flex items-end">
                    {anchorWallet && <button className="w-full col-span-4 m-auto min-w-fit rounded-md bg-blue-500 p-4 py-2 text-white hover:bg-blue-600"
                        onClick={mint}>Mint</button>
                    }
                </div>
                <BaseWalletMultiButton labels={LABELS} />
            </div>
            <div className="bg-darkgray w-full px-[20px] py-[6px] flex justify-between border-b-[#333333] boder-b">
                <div className="p-[20px] flex justify-center  items-start flex-wrap grow gap-[20px] overflow-auto">
                    {
                        nftItems && nftItems.map( (element,index) =>{
                            return <MainNFTCard key={index} img={element.img} description={element.description} name={element.name} nftAccount={element.nftAccount} />
                        })
                    }
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}

export default Main;