-- Create profiles table extending auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create years table
CREATE TABLE years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, year_number)
);

-- Create resolutions table
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create targets table
CREATE TABLE targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_id UUID NOT NULL REFERENCES resolutions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_years_user_id ON years(user_id);
CREATE INDEX idx_resolutions_year_id ON resolutions(year_id);
CREATE INDEX idx_targets_resolution_id ON targets(resolution_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles - users can only see their own profile
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for years - users can only access their own years
CREATE POLICY "Users can view their own years" ON years FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own years" ON years FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own years" ON years FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own years" ON years FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for resolutions - cascade from years
CREATE POLICY "Users can view their own resolutions" ON resolutions FOR SELECT USING (
  year_id IN (SELECT id FROM years WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own resolutions" ON resolutions FOR INSERT WITH CHECK (
  year_id IN (SELECT id FROM years WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own resolutions" ON resolutions FOR UPDATE USING (
  year_id IN (SELECT id FROM years WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete their own resolutions" ON resolutions FOR DELETE USING (
  year_id IN (SELECT id FROM years WHERE user_id = auth.uid())
);

-- RLS Policies for targets - cascade from resolutions
CREATE POLICY "Users can view their own targets" ON targets FOR SELECT USING (
  resolution_id IN (
    SELECT r.id FROM resolutions r 
    INNER JOIN years y ON r.year_id = y.id 
    WHERE y.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own targets" ON targets FOR INSERT WITH CHECK (
  resolution_id IN (
    SELECT r.id FROM resolutions r 
    INNER JOIN years y ON r.year_id = y.id 
    WHERE y.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update their own targets" ON targets FOR UPDATE USING (
  resolution_id IN (
    SELECT r.id FROM resolutions r 
    INNER JOIN years y ON r.year_id = y.id 
    WHERE y.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete their own targets" ON targets FOR DELETE USING (
  resolution_id IN (
    SELECT r.id FROM resolutions r 
    INNER JOIN years y ON r.year_id = y.id 
    WHERE y.user_id = auth.uid()
  )
);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
