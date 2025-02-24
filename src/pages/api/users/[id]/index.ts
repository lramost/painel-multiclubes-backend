import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/admin-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "User ID is required" });
  }

  switch (req.method) {
    case 'PUT':
      return handleUpdateUser(req, res, id);
    case 'DELETE':
      return handleDeleteUser(req, res, id);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { name, role } = req.body;

    // 1. Atualizar o perfil
    if (name) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return res.status(500).json({ error: profileError.message });
      }
    }

    // 2. Atualizar a role
    if (role) {
      // Verificar se o usuário tem alguma role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userRole) {
        // Atualizar a role existente
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        if (roleError) {
          console.error('Error updating role:', roleError);
          return res.status(500).json({ error: roleError.message });
        }
      } else {
        // Criar uma nova role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (roleError && roleError.code !== '23505') { // Ignorar erro de duplicação
          console.error('Error creating role:', roleError);
          return res.status(500).json({ error: roleError.message });
        }
      }
    }

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error('Error in handleUpdateUser:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleDeleteUser(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    console.log('Deleting user:', userId);

    // 1. Primeiro, deletar o perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return res.status(500).json({ error: profileError.message });
    }

    // 2. Depois, deletar a role
    const { error: roleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (roleError) {
      console.error('Error deleting role:', roleError);
      return res.status(500).json({ error: roleError.message });
    }

    // 3. Por fim, deletar o usuário
    const { error: userError } = await supabase.auth.admin.deleteUser(userId);

    if (userError) {
      console.error('Error deleting user:', userError);
      return res.status(500).json({ error: userError.message });
    }

    console.log('User deleted successfully:', userId);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Error in handleDeleteUser:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal Server Error",
      details: error
    });
  }
}
