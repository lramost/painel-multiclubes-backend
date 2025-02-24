import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/admin-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API Route: /api/user-roles called');
  console.log('Method:', req.method);

  switch (req.method) {
    case 'GET':
      return handleGetUserRoles(req, res);
    case 'POST':
      return handleCreateUserRole(req, res);
    case 'PUT':
      return handleUpdateUserRole(req, res);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetUserRoles(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Fetching user roles from Supabase...');
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('*');

    if (error) {
      console.error('Error fetching user roles:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Found ${data?.length || 0} user roles`);
    return res.status(200).json({ roles: data });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleCreateUserRole(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({ error: "User ID and role are required" });
    }

    const { data, error } = await supabase
      .from('user_roles')
      .insert({ user_id, role })
      .select()
      .single();

    if (error) {
      console.error('Error creating user role:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ role: data });
  } catch (error) {
    console.error("Error creating user role:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleUpdateUserRole(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { role } = req.body;

    if (!id || !role) {
      return res.status(400).json({ error: "User ID and role are required" });
    }

    const { data, error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ role: data });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
