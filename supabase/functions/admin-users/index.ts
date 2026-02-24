import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the calling user is admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "list") {
      // List all users with profiles and roles
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, nombre, active, created_at")
        .order("created_at", { ascending: true });

      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role");

      // Get emails from auth
      const { data: { users } } = await adminClient.auth.admin.listUsers();

      const result = (profiles || []).map((p: any) => {
        const authUser = users?.find((u: any) => u.id === p.user_id);
        const userRoles = (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role);
        return {
          user_id: p.user_id,
          nombre: p.nombre,
          email: authUser?.email || "N/A",
          active: p.active,
          roles: userRoles,
          created_at: p.created_at,
        };
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_profile") {
      const { user_id, nombre, active } = body;
      const updates: any = {};
      if (nombre !== undefined) updates.nombre = nombre;
      if (active !== undefined) updates.active = active;

      const { error } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("user_id", user_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle_role") {
      const { user_id, role } = body;
      // Check if role exists
      const { data: existing } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", user_id)
        .eq("role", role)
        .single();

      if (existing) {
        // Don't allow removing your own admin role
        if (user_id === user.id && role === "admin") {
          return new Response(JSON.stringify({ error: "No puedes quitarte el rol de admin" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await adminClient.from("user_roles").delete().eq("id", existing.id);
      } else {
        await adminClient.from("user_roles").insert({ user_id, role });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      const { user_id: targetId } = body;
      if (targetId === user.id) {
        return new Response(JSON.stringify({ error: "No puedes eliminarte a ti mismo" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.deleteUser(targetId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
