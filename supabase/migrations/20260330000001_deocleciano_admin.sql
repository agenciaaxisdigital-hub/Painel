-- ============================================================
-- CRIAR USUÁRIO DEOCLECIANO — ADMINISTRADOR MASTER
-- Painel de Dados do Site
-- Schema: roles_painel(user_id, cargo='super_admin')
-- Executar no Supabase SQL Editor com service_role
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
  v_email   text := 'deocleciano@sistema.local';
  v_nome    text := 'Deocleciano';
  v_senha   text := 'Sarelli2020';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      is_sso_user, deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', v_email,
      crypt(v_senha, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      format('{"nome":"%s","username":"deocleciano"}', v_nome)::jsonb,
      now(), now(), '', '', false, null
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider,
      created_at, updated_at, provider_id, last_sign_in_at
    ) VALUES (
      v_user_id, v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb,
      'email', now(), now(), v_email, now()
    );

    RAISE NOTICE 'Auth user criado: % (%)', v_nome, v_user_id;
  ELSE
    RAISE NOTICE 'Auth user já existe: % (%)', v_nome, v_user_id;
  END IF;

  -- Garante cargo super_admin no roles_painel
  DELETE FROM public.roles_painel WHERE user_id = v_user_id;
  INSERT INTO public.roles_painel (user_id, cargo)
  VALUES (v_user_id, 'super_admin');

  RAISE NOTICE 'Usuário "%" configurado como super_admin no Painel de Dados.', v_nome;
END $$;
