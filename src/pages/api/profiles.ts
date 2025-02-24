import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/admin-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API Route: /api/profiles called');
  console.log('Method:', req.method);

  switch (req.method) {
    case 'GET':
      return handleGetProfiles(req, res);
    case 'POST':
      return handleCreateProfile(req, res);
    case 'PUT':
      return handleUpdateProfile(req, res);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetProfiles(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Fetching profiles from Supabase...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching profiles:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Found ${data?.length || 0} profiles`);
    return res.status(200).json({ profiles: data });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleCreateProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, name, email } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: "ID and name are required" });
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({ id, name, email })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ profile: data });
  } catch (error) {
    console.error("Error creating profile:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleUpdateProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { name, email } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ profile: data });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
