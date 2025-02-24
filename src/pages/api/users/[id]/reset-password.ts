import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/admin-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { password } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { error } = await supabase.auth.admin.updateUserById(
      id,
      { password }
    );

    if (error) {
      console.error('Error resetting password:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error('Error in reset password:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
