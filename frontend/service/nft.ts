import {PublicKey, Connection} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { fetchDigitalAssetWithTokenByMint, MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey } from "@metaplex-foundation/umi";
import { OUR_TOKEN_NAME } from "@/config";
import axios from "axios";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl } from '@solana/web3.js';

export interface NFT {
    name: any;
    description: any;
    img: any;
    nftAccount: string;
    holderAccount: string;
}

export const getUserNFTs = async (connection: Connection, walletPubKey:PublicKey):Promise<NFT[]> => {

    let tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubKey, {
      programId: TOKEN_PROGRAM_ID,
    })
    const umi = createUmi(clusterApiUrl("devnet"));

    //fetch our NFT

    const nfts:NFT[] = []
    const metadataProgramIdPubkey = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID.toString());
    for (let index = 0; index < tokenAccounts.value.length; index++) {
      const mint = tokenAccounts.value[index];
      const info = mint.account.data.parsed.info;

      if (info.tokenAmount.decimals === 0 && info.tokenAmount.amount === "1") {

        const mintKey = new PublicKey(mint.account.data.parsed.info.mint);
        const largestAccounts = await connection.getTokenLargestAccounts(mintKey); //get TokenAccount
        const nft_holderAccount = largestAccounts.value[0].address.toBase58(); //token Account
        // console.log(nft_holderAccount);
        const [tokenMetaPubkey] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            metadataProgramIdPubkey.toBuffer(),
            mintKey.toBuffer(),
          ],
          metadataProgramIdPubkey
        );
        const asset = await fetchDigitalAssetWithTokenByMint(umi,publicKey(mintKey.toBase58()))
        const tokenMeta = asset.metadata;
        if (tokenMeta.name.indexOf(OUR_TOKEN_NAME) < 0){
            continue;
        }
        const value = await axios.get(tokenMeta.uri)
        const nft:NFT = {
          name: value.data.name,
          img: value.data.image,
          description: value.data.description,
          nftAccount: mintKey.toBase58(),
          holderAccount: nft_holderAccount
        };
        nfts.push(nft);
      }
    }
    // console.log(nfts);
    return nfts;
  }