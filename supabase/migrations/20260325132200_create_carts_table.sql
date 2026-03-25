-- Create carts table
create table if not exists public.carts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    product_id bigint references public.products(id) on delete cascade not null,
    quantity integer default 1 check (quantity > 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Prevent duplicate cart items for same user and product
    unique (user_id, product_id)
);

-- Enable Row Level Security (RLS)
alter table public.carts enable row level security;

-- Policies for carts
create policy "Users can view their own carts" 
    on public.carts for select 
    using (auth.uid() = user_id);

create policy "Users can insert into their own carts" 
    on public.carts for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own carts" 
    on public.carts for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own carts" 
    on public.carts for delete 
    using (auth.uid() = user_id);

-- Optional: Add index for faster reads by user
create index if not exists carts_user_id_idx on public.carts(user_id);
