import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/admin-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API Route: /api/users called');
  console.log('Method:', req.method);

  switch (req.method) {
    case 'GET':
      return handleGetUsers(req, res);
    case 'POST':
      return handleCreateUser(req, res);
    case 'PUT':
      return handleUpdateUser(req, res);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Fetching users from Supabase...');
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Found ${users?.length || 0} users`);
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleCreateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password, name, role = 'agent' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 1. Criar usuário no auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: error.message });
    }

    if (data.user) {
      try {
        // 2. Aguardar um pouco para o trigger do Supabase criar o perfil e a role
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Verificar se o perfil existe
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // 4. Se o perfil não existe, criar manualmente
        if (!profile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ 
              id: data.user.id, 
              email: data.user.email,
              name: name || data.user.email?.split('@')[0] || 'Unknown' 
            });

          if (profileError && profileError.code !== '23505') { // Ignorar erro de duplicação
            console.error('Error creating profile:', profileError);
            return res.status(500).json({ error: profileError.message });
          }
        }

        // 5. Verificar se a role existe
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('role', role)
          .single();

        // 6. Se a role não existe, criar manualmente
        if (!userRole) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ 
              user_id: data.user.id, 
              role 
            });

          if (roleError && roleError.code !== '23505') { // Ignorar erro de duplicação
            console.error('Error creating role:', roleError);
            return res.status(500).json({ error: roleError.message });
          }
        }

        return res.status(201).json({ user: data.user });
      } catch (error) {
        console.error('Error in profile/role operations:', error);
        return res.status(500).json({ error: "Error creating profile or role" });
      }
    }

    return res.status(500).json({ error: "Failed to create user" });
  } catch (error) {
    console.error('Error in handleCreateUser:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { email, password, name, role } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const updates: any = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase.auth.admin.updateUserById(
        id as string,
        updates
      );

      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    if (name) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return res.status(500).json({ error: profileError.message });
      }
    }

    if (role) {
      // Verificar se a role já existe
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', id)
        .eq('role', role)
        .single();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: id, 
            role 
          });

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
