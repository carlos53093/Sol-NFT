'use client';
import Image from 'next/image'

interface MainNFTCardsProps {
    name: string,
    img: string,
    description: string,
    nftAccount: string,
}
export const MainNFTCard:React.FC<MainNFTCardsProps> =({name, img, nftAccount}) =>{
    console.log('----img:', img);
    return (
        <div className="bg-darkgray width:w-[268px] border-[#333333] border rounded-[20px] flex flex-col">
          <div className="flex flex-col p-[16[x] pb-[12px]">
            <div>
              <Image src={img} width={236} height={236} alt="img" />
            </div>
            <div className="mt-[16px] bg-[#333333] w-full h-px"/>
            <div className="mt-[12px] flex flex-row items-center">
              <div className="ml-[6px] flex items-center justify-center font-semibold text-[12px] leading-[16px] traking-[-0.04em]">
                {name}
              </div>
            </div>
          </div>
        </div>
      );
}