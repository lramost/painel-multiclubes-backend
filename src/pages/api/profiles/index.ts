import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/admin-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log('Fetching profiles from Supabase...');
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Found ${profiles?.length || 0} profiles`);
    return res.status(200).json(profiles || []);
  } catch (error) {
    console.error('Error in profiles endpoint:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal Server Error",
      details: error
    });
  }
}
