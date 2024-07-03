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

const main = async () =>{

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(WALLET_KEY)));
    const idl: Idl = JSON.parse(fs.readFileSync('idl/mint_nft.json', 'utf-8'));
    const programID = new PublicKey(MINT_NFT_PROGRAM_ID);
    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    const program = new Program(idl, programID, provider);

    const [ authListPDA ] = PublicKey.findProgramAddressSync(
        [Buffer.from("auth-list")],
        programID
    );

    const txSig = await program.methods.addUser(new PublicKey("4Dm3i52Se54NBPt3BtwXNyEADXH1vhFmRuroY4cVkPCs")).accounts({
        admin: wallet.publicKey,
        authList: authListPDA
    }).signers([]).rpc();
    console.log("Transaction Signature:", txSig);
    console.log('-----------Add User-----------------');
    console.log(`Owner:${wallet.publicKey.toBase58()}`);
    console.log(`Authlist Account:${authListPDA.toBase58()}`);
};

main().catch(err=>{
    console.log(err);
})
