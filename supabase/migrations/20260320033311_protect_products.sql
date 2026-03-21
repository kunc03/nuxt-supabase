-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for everyone (anon and authenticated)
CREATE POLICY "Allow anyone to read products" 
ON products FOR SELECT 
USING (true);

-- Allow INSERT for authenticated users only
CREATE POLICY "Allow authenticated to insert products" 
ON products FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow UPDATE for authenticated users only
CREATE POLICY "Allow authenticated to update products" 
ON products FOR UPDATE 
TO authenticated 
USING (true);

-- Allow DELETE for authenticated users only
CREATE POLICY "Allow authenticated to delete products" 
ON products FOR DELETE 
TO authenticated 
USING (true);
