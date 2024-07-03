use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_master_edition_v3, create_metadata_accounts_v3, CreateMasterEditionV3,
        CreateMetadataAccountsV3, Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::{
    accounts::{MasterEdition, Metadata as MetadataAccount},
    types::DataV2,
};

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("4nXc7AQhGmvvJuvsEctwfiKSPAAmkcZBJqc9vU7p1byt");

#[program]
mod mint_nft {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let account = &mut ctx.accounts.auth_list;
        account.users = Vec::new();
        account.count = 0;
        account.admin = ctx.accounts.admin.key();
        Ok(())
    }
    pub fn add_user(ctx: Context<AddUser>, new_user: Pubkey) -> Result<()> {
        let account = &mut ctx.accounts.auth_list;
        require!(
            ctx.accounts.admin.key == &account.admin,
            ErrorCode::Unauthorized
        );
        account.users.push(new_user);
        Ok(())
    }

    pub fn mint_nft(ctx: Context<MintNFT>, name: String, uri: String) -> Result<()> {
        let account = &ctx.accounts.auth_list;
        let user = ctx.accounts.user.key;
        require!(account.users.contains(user), ErrorCode::UserNotAuthorized);

        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.associated_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        mint_to(cpi_context, 1)?;
        // create metadata account
        let cpi_context = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.user.to_account_info(),
                update_authority: ctx.accounts.user.to_account_info(),
                payer: ctx.accounts.user.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );
        let count = ctx.accounts.auth_list.count;
        //https://bafybeib7j7kxkd5u445oewlttohocyc55t6pjmxyyxwtwp65o4zpbwyxhe.ipfs.nftstorage.link/{}.json
        let token_uri = format!("{}/{}.json", uri, count);
        let token_name = format!("{} #{}", name, count);
        let data_v2 = DataV2 {
            name: token_name,
            symbol: "".to_string(),
            uri: token_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };
        create_metadata_accounts_v3(cpi_context, data_v2, false, true, None)?;
        //create master edition account
        let cpi_context = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                update_authority: ctx.accounts.user.to_account_info(),
                mint_authority: ctx.accounts.user.to_account_info(),
                payer: ctx.accounts.user.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );

        create_master_edition_v3(cpi_context, None)?;
        ctx.accounts.auth_list.count += 1;

        Ok(())
    }
    // pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
    //     ctx.accounts.new_account.data = data;
    //     msg!("Changed data to: {}!", data); // Message will show up in the tx logs
    //     Ok(())
    // }
}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    /// CHECK: ok, we are passing in this account ourselves
    #[account(mut, signer)]
    pub user: AccountInfo<'info>,

    #[account(mut, seeds = [b"auth-list"], bump)]
    pub auth_list: Account<'info, AuthList>,

    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = user.key(),
        mint::freeze_authority = user.key(),
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub associated_token_account: Account<'info, TokenAccount>,
    /// CHECK - address
    #[account(
        mut,
        address=MetadataAccount::find_pda(&mint.key()).0,
    )]
    pub metadata_account: AccountInfo<'info>,
    /// CHECK: address
    #[account(
        mut,
        address=MasterEdition::find_pda(&mint.key()).0,
    )]
    pub master_edition_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = admin, seeds = [b"auth-list"], bump, space = 8 + 32 + 4 + 32 + (32*100))]
    // Adjust space as needed
    pub auth_list: Account<'info, AuthList>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct AddUser<'info> {
    #[account(mut, seeds = [b"auth-list"], bump, has_one=admin)]
    pub auth_list: Account<'info, AuthList>,
    pub admin: Signer<'info>,
}
#[account]
pub struct AuthList {
    pub admin: Pubkey,
    pub count: u32,
    pub users: Vec<Pubkey>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("User not authorized to mint")]
    UserNotAuthorized,
}
