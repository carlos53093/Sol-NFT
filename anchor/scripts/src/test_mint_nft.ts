import { Program, Idl, Wallet, AnchorProvider } from "@project-serum/anchor";
import { PublicKey, Keypair,   Connection, clusterApiUrl } from "@solana/web3.js";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();
const MINT_NFT_PROGRAM_ID = process.env.MINT_NFT_PROGRAM_ID!;
const WALLET_KEY = process.env.WALLET_KEY!;
const TOKEN_NAME = process.env.NAME!;
const TOKEN_URI = process.env.URI!;

const main = async () =>{

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(WALLET_KEY)));
    const idl: Idl = JSON.parse(fs.readFileSync('idl/mint_nft.json', 'utf-8'));
    const programID = new PublicKey(MINT_NFT_PROGRAM_ID);
    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    const program = new Program(idl, programID, provider);

    const mint = new Keypair();
      // Derive the associated token address account for the mint
    const associatedTokenAccount = getAssociatedTokenAddressSync(
        mint.publicKey,
        wallet.publicKey,
    );

    const metadataProgramIdPubkey = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID.toString());

    const [ metadataPDA ] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            metadataProgramIdPubkey.toBuffer(),
            mint.publicKey.toBuffer()
        ],
        metadataProgramIdPubkey
    );

    const [ masterEditionPDA ] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            metadataProgramIdPubkey.toBuffer(),
            mint.publicKey.toBuffer(),
            Buffer.from("edition")
        ],
        metadataProgramIdPubkey
    );

    const [ authListPDA ] = PublicKey.findProgramAddressSync(
        [Buffer.from("auth-list")],
        programID
    );
    console.log('--------')
    const txSig1 = program.methods.mintNft(TOKEN_NAME, TOKEN_URI).accounts({
        signer: wallet.publicKey,
        authList: authListPDA,
        mint: mint.publicKey,
        associatedTokenAccount: associatedTokenAccount,
        metadataAccount: metadataPDA,
        masterEditionAccount: masterEditionPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
    }).signers([mint]).rpc();
    // console.log('--------1')
    // // const txSig2 = await txSig1.transaction();
    // console.log('--------2')
    // const signedTx = await wallet.signTransaction(txSig2);
    
    console.log("Transaction Signature:", txSig1);
    console.log('-----------Create NFT-----------------');
    console.log(`Owner:${wallet.publicKey.toBase58()}`);
    console.log(`Mint Token:${mint.publicKey.toBase58()}`);
    console.log(`MetadataPDA:${metadataPDA.toBase58()}`);
    console.log(`MasterEditionPDA:${masterEditionPDA.toBase58()}`);
    console.log(`TokenAccount:${associatedTokenAccount.toBase58()}`);
};

main().catch(err=>{
    console.log(err);
})
